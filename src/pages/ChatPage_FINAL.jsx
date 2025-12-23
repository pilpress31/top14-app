import { useState, useEffect, useRef } from 'react';
import { Send, Users, MessageCircle, X, ArrowDown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { useChatNotification } from '../contexts/ChatNotificationContext';

export default function ChatPage() {
  const { user } = useAuth();
  const { markAsRead } = useChatNotification();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [showUsersModal, setShowUsersModal] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const channelRef = useRef(null);
  const firstUnreadRef = useRef(null);
  const lastReadTimestamp = useRef(null);

  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
  };

  const scrollToFirstUnread = () => {
    if (firstUnreadRef.current) {
      firstUnreadRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      scrollToBottom();
    }
  };

  // Détecter scroll pour afficher bouton
  const handleScroll = () => {
    if (!messagesContainerRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    
    setShowScrollButton(!isNearBottom);
    
    // Si scroll en bas, marquer comme lu
    if (isNearBottom) {
      markAsRead();
      setUnreadCount(0);
    }
  };

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, []);

  // Charger messages et s'abonner
  useEffect(() => {
    loadMessages();
    subscribeToMessages();
    subscribeToPresence();

    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
      }
    };
  }, [user]);

  const loadMessages = async () => {
    setLoading(true);
    
    // Récupérer le dernier timestamp de lecture
    const lastRead = localStorage.getItem('lastChatRead');
    lastReadTimestamp.current = lastRead ? new Date(lastRead) : null;
    
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('deleted', false)
      .order('created_at', { ascending: true })
      .limit(100);

    if (!error && data) {
      setMessages(data);
      
      // Compter messages non lus
      if (lastReadTimestamp.current && user) {
        const unread = data.filter(m => 
          new Date(m.created_at) > lastReadTimestamp.current &&
          m.user_id !== user.id
        ).length;
        setUnreadCount(unread);
      }

      // Scroll vers premier non lu après chargement
      setTimeout(() => {
        if (unread > 0) {
          scrollToFirstUnread();
        } else {
          scrollToBottom(false);
        }
      }, 100);
    }
    
    setLoading(false);
  };

  // Temps réel : écouter nouveaux messages
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
            
            // Si message pas du user et scroll pas en bas, incrémenter compteur
            if (payload.new.user_id !== user?.id) {
              const container = messagesContainerRef.current;
              if (container) {
                const { scrollTop, scrollHeight, clientHeight } = container;
                const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
                
                if (!isNearBottom) {
                  setUnreadCount(prev => prev + 1);
                } else {
                  // Si en bas, scroll automatique et marquer lu
                  setTimeout(() => scrollToBottom(), 100);
                  markAsRead();
                }
              }
            } else {
              // Si c'est son propre message, scroll vers bas
              setTimeout(() => scrollToBottom(), 100);
            }
          }
        }
      )
      .subscribe((status) => {
        console.log('Statut subscription:', status);
      });

    channelRef.current = channel;
  };

  // Présence en temps réel
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
        setOnlineUsers(users);
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        console.log('Utilisateur connecté:', newPresences);
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        console.log('Utilisateur déconnecté:', leftPresences);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({
            user_id: user.id,
            username: user.user_metadata?.nom_complet || 
                     user.user_metadata?.username || 
                     user.email?.split('@')[0] || 
                     'Utilisateur',
            online_at: new Date().toISOString(),
          });
        }
      });
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !user) return;

    setSending(true);

    const messageData = {
      user_id: user.id,
      username: user.user_metadata?.nom_complet || 
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
      {/* Header */}
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
                        {u.username?.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-800">{u.username}</p>
                        <p className="text-xs text-gray-500">
                          Connecté depuis {new Date(u.online_at).toLocaleTimeString('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
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
      <div 
        ref={messagesContainerRef}
        className="container mx-auto px-4 py-4 space-y-3 pb-32 overflow-y-auto"
        style={{ height: 'calc(100vh - 200px)' }}
      >
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Aucun message pour le moment</p>
            <p className="text-sm text-gray-400 mt-2">Soyez le premier à discuter !</p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isCurrentUser = user && msg.user_id === user.id;
            const isFirstUnread = lastReadTimestamp.current && 
                                  new Date(msg.created_at) > lastReadTimestamp.current &&
                                  (index === 0 || new Date(messages[index - 1].created_at) <= lastReadTimestamp.current);
            
            return (
              <div key={msg.id}>
                {/* Séparateur messages non lus */}
                {isFirstUnread && !isCurrentUser && (
                  <div 
                    ref={firstUnreadRef}
                    className="flex items-center gap-2 my-4"
                  >
                    <div className="flex-1 h-px bg-red-400"></div>
                    <span className="text-xs font-medium text-red-600 px-2 bg-red-50 rounded-full">
                      Nouveaux messages
                    </span>
                    <div className="flex-1 h-px bg-red-400"></div>
                  </div>
                )}
                
                <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] ${isCurrentUser ? 'order-2' : 'order-1'}`}>
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
                      className={`rounded-2xl px-4 py-2 shadow-sm ${
                        isCurrentUser
                          ? 'bg-rugby-gold text-white rounded-tr-none'
                          : 'bg-white border border-gray-200 text-gray-800 rounded-tl-none'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                      <p className={`text-[10px] mt-1 ${
                        isCurrentUser ? 'text-white/70' : 'text-gray-400'
                      }`}>
                        {new Date(msg.created_at).toLocaleTimeString('fr-FR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                        {msg.edited && ' (modifié)'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Bouton scroll vers bas avec compteur */}
      {showScrollButton && (
        <button
          onClick={() => {
            scrollToBottom();
            markAsRead();
            setUnreadCount(0);
          }}
          className="fixed bottom-32 right-4 bg-rugby-gold text-white p-3 rounded-full shadow-lg hover:bg-rugby-bronze transition-all z-30"
        >
          <div className="relative">
            <ArrowDown className="w-6 h-6" />
            {unreadCount > 0 && (
              <div className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </div>
            )}
          </div>
        </button>
      )}

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
