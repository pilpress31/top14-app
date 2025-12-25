import { useState, useEffect, useRef } from 'react';
import { Send, Users, MessageCircle, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { useChatNotification } from '../contexts/ChatNotificationContext';

// ✅ Fonction de formatage heure Paris
const formatHeureParis = (dateString) => {
  if (!dateString) return 'Date inconnue';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Date invalide';
    
    return date.toLocaleTimeString('fr-FR', {
      timeZone: 'Europe/Paris',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    console.error('Erreur format date:', error);
    return 'Date invalide';
  }
};

export default function ChatPage() {
  const { user } = useAuth();
  const { markAsRead } = useChatNotification();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [showUsersModal, setShowUsersModal] = useState(false);
  
  // ✅ États pour les réactions
  const [reactions, setReactions] = useState({});
  const [showEmojiPicker, setShowEmojiPicker] = useState(null);
  
  const messagesEndRef = useRef(null);
  const channelRef = useRef(null);
  const presenceChannelRef = useRef(null);

  // Emojis rapides
  const quickEmojis = ['❤️', '👍', '😂', '🏉', '🔥', '💪', '⚡', '🚀', '🎯', '👏', '🎉', '💯', '🙌', '👌', '😎', '🤩'];

  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    loadMessages();
    subscribeToMessages();
    subscribeToPresence();
    markAsRead();

    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
      }
      if (presenceChannelRef.current) {
        presenceChannelRef.current.unsubscribe();
      }
    };
  }, [user]);

  const loadMessages = async () => {
    setLoading(true);
    
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('deleted', false)
      .order('created_at', { ascending: true })
      .limit(100);

    if (!error && data) {
      setMessages(data);
      setTimeout(() => scrollToBottom(false), 100);
    }
    
    setLoading(false);
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel('public:chat_messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages'
        },
        (payload) => {
          console.log('Nouveau message reçu:', payload.new);
          if (!payload.new.deleted) {
            setMessages(prev => [...prev, payload.new]);
            setTimeout(() => scrollToBottom(), 100);
          }
        }
      )
      .subscribe((status) => {
        console.log('Statut subscription messages:', status);
      });

    channelRef.current = channel;
  };

  const subscribeToPresence = () => {
    if (!user) return;

    const presenceChannel = supabase.channel('online-users', {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        const users = Object.values(state).flat();
        console.log('Utilisateurs en ligne:', users.length);
        setOnlineUsers(users);
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        console.log('Utilisateur connecté:', newPresences);
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        console.log('Utilisateur déconnecté:', leftPresences);
      })
      .subscribe(async (status) => {
        console.log('Statut subscription presence:', status);
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({
            user_id: user.id,
            pseudo: user.user_metadata?.pseudo || 
                    user.user_metadata?.username || 
                    user.email?.split('@')[0] || 
                    'Utilisateur',
            online_at: new Date().toISOString(),
          });
        }
      });

    presenceChannelRef.current = presenceChannel;

    const intervalId = setInterval(async () => {
      if (presenceChannel.state === 'joined') {
        await presenceChannel.track({
          user_id: user.id,
          pseudo: user.user_metadata?.pseudo || 
                  user.user_metadata?.username || 
                  user.email?.split('@')[0] || 
                  'Utilisateur',
          online_at: new Date().toISOString(),
        });
      }
    }, 30000);

    return () => {
      clearInterval(intervalId);
      presenceChannel.unsubscribe();
    };
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !user) return;

    setSending(true);

    const messageData = {
      user_id: user.id,
      username: user.user_metadata?.pseudo || 
                user.user_metadata?.username || 
                user.email?.split('@')[0] || 
                'Utilisateur',
      avatar_url: user.user_metadata?.avatar_url || null,
      message: newMessage.trim()
    };

    const { data, error } = await supabase
      .from('chat_messages')
      .insert(messageData)
      .select()
      .single();

    if (!error && data) {
      setNewMessage('');
      markAsRead();
    } else {
      console.error('Erreur envoi message:', error);
      alert('Erreur lors de l\'envoi du message');
    }

    setSending(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ✅ Ajouter une réaction
  const handleReaction = (messageId, emoji) => {
    if (!user) return;
    
    setReactions(prev => {
      const messageReactions = prev[messageId] || {};
      const currentCount = messageReactions[emoji] || 0;
      
      return {
        ...prev,
        [messageId]: {
          ...messageReactions,
          [emoji]: currentCount + 1
        }
      };
    });
    
    // Fermer le picker après sélection
    setShowEmojiPicker(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-rugby-white flex items-center justify-center">
        <div className="text-center">
          <MessageCircle className="w-12 h-12 text-rugby-gold mx-auto mb-2 animate-pulse" />
          <p className="text-gray-600">Chargement du chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-rugby-white pb-24 pt-20">
      {/* Header fixe */}
      <div className="fixed top-0 left-0 right-0 bg-gradient-to-r from-rugby-gold to-rugby-bronze p-4 shadow-md z-40">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MessageCircle className="w-6 h-6 text-white" />
            <div>
              <h1 className="text-white text-xl font-bold">Chat Communauté</h1>
              <p className="text-white/80 text-xs">
                {messages.length} message{messages.length > 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowUsersModal(true)}
            className="flex items-center gap-1 bg-white/20 px-3 py-1 rounded-full hover:bg-white/30 transition-colors"
          >
            <Users className="w-4 h-4 text-white" />
            <span className="text-white text-sm font-bold">
              {onlineUsers.length} en ligne
            </span>
          </button>
        </div>
      </div>

      {/* Modale utilisateurs en ligne */}
      {showUsersModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[80vh] overflow-hidden">
            <div className="bg-gradient-to-r from-rugby-gold to-rugby-bronze p-4 flex justify-between items-center">
              <h2 className="text-white font-bold text-lg">
                Utilisateurs en ligne ({onlineUsers.length})
              </h2>
              <button
                onClick={() => setShowUsersModal(false)}
                className="text-white hover:bg-white/20 rounded-full p-1 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto max-h-96">
              {onlineUsers.length > 0 ? (
                <div className="space-y-2">
                  {onlineUsers.map((u, idx) => (
                    <div 
                      key={idx} 
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="w-10 h-10 rounded-full bg-rugby-gold flex items-center justify-center text-white font-bold">
                        {u.pseudo?.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-800">{u.pseudo}</p>
                        <p className="text-xs text-gray-500">
                          Connecté depuis {formatHeureParis(u.online_at)}
                        </p>
                      </div>
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Aucun utilisateur en ligne
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Zone messages */}
      <div className="container mx-auto px-4 py-4 space-y-3 pb-32">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Aucun message pour le moment</p>
            <p className="text-sm text-gray-400 mt-2">Soyez le premier à discuter !</p>
          </div>
        ) : (
          messages.map(msg => {
            const isCurrentUser = user && msg.user_id === user.id;
            const messageReactions = reactions[msg.id] || {};
            
            return (
              <div 
                key={msg.id} 
                className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
              >
                <div className="max-w-[85%]">
                  {/* Nom utilisateur */}
                  {!isCurrentUser && (
                    <div className="flex items-center gap-2 mb-1 px-2">
                      {msg.avatar_url ? (
                        <img 
                          src={msg.avatar_url} 
                          alt={msg.username}
                          className="w-5 h-5 rounded-full"
                        />
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-rugby-gold flex items-center justify-center text-white text-xs font-bold">
                          {msg.username?.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <p className="text-xs text-gray-500 font-medium">{msg.username}</p>
                    </div>
                  )}
                  
                  {/* Bulle message */}
                  <div 
                    className={`rounded-2xl px-4 py-2 shadow-sm relative group ${
                      isCurrentUser
                        ? 'bg-rugby-gold text-white rounded-tr-none'
                        : 'bg-white border border-gray-200 text-gray-800 rounded-tl-none'
                    }`}
                    onMouseEnter={() => setShowEmojiPicker(msg.id)}
                    onMouseLeave={() => setShowEmojiPicker(null)}
                  >
                    <p className="text-base whitespace-pre-wrap break-words">{msg.message}</p>
                    
                    <p className={`text-[10px] mt-1 ${
                      isCurrentUser ? 'text-white/70' : 'text-gray-400'
                    }`}>
                      {formatHeureParis(msg.created_at)}
                      {msg.edited && ' (modifié)'}
                    </p>

                    {/* Picker emojis au survol */}
                    {showEmojiPicker === msg.id && (
                      <div className="absolute -top-14 left-0 right-0 mx-auto w-max max-w-full bg-white border border-gray-200 rounded-2xl shadow-xl p-2 flex flex-wrap justify-center z-50">
                        {quickEmojis.map((emoji) => (
                          <button
                            key={emoji}
                            onClick={() => handleReaction(msg.id, emoji)}
                            className="text-2xl m-1 hover:scale-125 transition-transform active:scale-95"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Affichage des réactions */}
                    {Object.keys(messageReactions).length > 0 && (
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {Object.entries(messageReactions).map(([emoji, count]) => (
                          <span 
                            key={emoji}
                            className="bg-gray-100 rounded-full px-2 py-0.5 text-xs flex items-center gap-1 border border-gray-300"
                          >
                            <span>{emoji}</span>
                            <span className="font-semibold text-gray-700">{count}</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Barre de saisie fixe */}
      <div className="fixed bottom-16 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg">
        <div className="container mx-auto">
          {user ? (
            <div className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Écrivez votre message..."
                disabled={sending}
                maxLength={500}
                className="flex-1 px-4 py-2 border-2 border-rugby-gray rounded-full focus:ring-2 focus:ring-rugby-gold focus:border-rugby-gold disabled:bg-gray-100"
              />
              <button
                onClick={handleSend}
                disabled={sending || !newMessage.trim()}
                className="bg-rugby-gold text-white p-2 rounded-full hover:bg-rugby-bronze transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
              >
                {sending ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>
          ) : (
            <div className="text-center py-2">
              <p className="text-sm text-gray-600">
                Connectez-vous pour participer au chat
              </p>
            </div>
          )}
          
          {newMessage.length > 0 && (
            <p className="text-xs text-gray-400 mt-1 text-right">
              {newMessage.length}/500
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
