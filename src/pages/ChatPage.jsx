import { useState, useEffect, useRef } from 'react';
import { Send, Users, MessageCircle, X, AlertCircle, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { useChatNotification } from '../contexts/ChatNotificationContext';


// ✅ Fonction de formatage heure - VERSION DÉFINITIVE
  const formatHeureParis = (dateString) => {
    if (!dateString) return 'Date inconnue';

    try {
      // Exemple Supabase : "2025-12-26 21:21:44.19262"
      const [datePart, timePart] = dateString.split(' ');

      // On découpe l'heure proprement
      const [hour, minute, secondRaw] = timePart.split(':');
      const [second, micro] = secondRaw.split('.');

      // On construit une date UTC propre
      const date = new Date(Date.UTC(
        ...datePart.split('-').map(Number), // year, month, day
        Number(hour),
        Number(minute),
        Number(second)
      ));

      // Conversion Europe/Paris
      return date.toLocaleTimeString('fr-FR', {
        timeZone: 'Europe/Paris',
        hour: '2-digit',
        minute: '2-digit'
      });

    } catch (e) {
      console.error(e);
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
  
  // États pour les réactions
  const [reactions, setReactions] = useState({});
  const [showEmojiPicker, setShowEmojiPicker] = useState(null);
  
  // États pour la suppression
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  
  // ✅ États pour le swipe
  const [swipedMessage, setSwipedMessage] = useState(null);
  const [touchStart, setTouchStart] = useState(null);
  const [touchCurrent, setTouchCurrent] = useState(null);
  
  const messagesEndRef = useRef(null);
  const channelRef = useRef(null);
  const presenceChannelRef = useRef(null);

  // Emojis rapides
  const quickEmojis = [
    '❤️', '👍', '😂', '🏉', '🔥', '💪', '⚡', '🚀', 
    '🎯', '👏', '🎉', '💯', '🙌', '👌', '😎', '🤩',
    '🤔', '😍', '🥳', '🤣', '👀', '💀', '✨', '⭐',
    '🏆', '🥇', '🎊', '🌟', '💫', '🔝', '🆒', '💥',
    '😤', '🤝', '🙏', '👊', '🤘', '✌️', '🤙', '👋'
  ];

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
      
      const { data: reactionsData } = await supabase
        .from('message_reactions')
        .select('message_id, emoji');
      
      if (reactionsData) {
        const reactionsMap = {};
        reactionsData.forEach(r => {
          if (!reactionsMap[r.message_id]) reactionsMap[r.message_id] = {};
          reactionsMap[r.message_id][r.emoji] = (reactionsMap[r.message_id][r.emoji] || 0) + 1;
        });
        setReactions(reactionsMap);
      }
      
      setTimeout(() => scrollToBottom(false), 100);
    }
    
    setLoading(false);
  };

  const subscribeToMessages = () => {
    channelRef.current = supabase
      .channel('chat_messages')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'chat_messages' }, 
        (payload) => {
          if (!payload.new.deleted) {
            setMessages(prev => [...prev, payload.new]);
            markAsRead();
          }
        }
      )
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'chat_messages' },
        (payload) => {
          if (payload.new.deleted) {
            setMessages(prev => prev.filter(m => m.id !== payload.new.id));
          }
        }
      )
      .subscribe();
  };

  const subscribeToPresence = () => {
    if (!user) return;

    presenceChannelRef.current = supabase
      .channel('online-users')
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannelRef.current.presenceState();
        const users = Object.values(state).flat();
        setOnlineUsers(users);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannelRef.current.track({
            user_id: user.id,
            pseudo: user.user_metadata?.nom_complet || 'Anonyme',
            online_at: new Date().toISOString()
          });
        }
      });
  };

  const handleSend = async () => {
    if (!newMessage.trim() || sending || !user) return;

    setSending(true);

    const messageData = {
      user_id: user.id,
      username: user.user_metadata?.nom_complet || user.email?.split('@')[0] || 'Anonyme',
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

  // ✅ Gestion du swipe
  const handleTouchStart = (e, messageId) => {
    setTouchStart(e.touches[0].clientX);
    setTouchCurrent(0);
    setSwipedMessage(messageId);
  };

  const handleTouchMove = (e, messageId) => {
    if (!touchStart || swipedMessage !== messageId) return;
    
    const currentTouch = e.touches[0].clientX;
    const diff = touchStart - currentTouch;
    
    // Limiter le swipe à 80px maximum
    const swipeDistance = Math.min(Math.max(diff, 0), 80);
    setTouchCurrent(swipeDistance);
  };

  const handleTouchEnd = () => {
    // Si swipe > 40px, garder ouvert, sinon refermer
    if (touchCurrent > 40) {
      setTouchCurrent(80); // Ouvrir complètement
    } else {
      setTouchCurrent(0);
      setSwipedMessage(null);
    }
    setTouchStart(null);
  };

  // Fermer le swipe si on touche ailleurs
  const handleClickOutside = () => {
    setSwipedMessage(null);
    setTouchCurrent(0);
  };

  // ✅ Supprimer un message via backend
  const handleDeleteMessage = async (messageId) => {
    try {
      const response = await fetch('https://top14-api-production.up.railway.app/api/chat/delete-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id
        },
        body: JSON.stringify({
          messageId: messageId
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setMessages(prev => prev.filter(m => m.id !== messageId));
        setDeleteConfirm(null);
        setSwipedMessage(null);
        setTouchCurrent(0);
      } else {
        alert('Erreur: ' + result.error);
      }
    } catch (err) {
      console.error('Erreur:', err);
      alert('Erreur de connexion');
    }
  };

  // ✅ Ajouter une réaction
  const handleReaction = async (messageId, emoji) => {
    if (!user) return;

    const { error } = await supabase
      .from('message_reactions')
      .insert({
        message_id: messageId,
        user_id: user.id,
        emoji: emoji
      });

    if (!error) {
      setReactions(prev => ({
        ...prev,
        [messageId]: {
          ...prev[messageId],
          [emoji]: (prev[messageId]?.[emoji] || 0) + 1
        }
      }));
      setShowEmojiPicker(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-rugby-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-rugby-gold"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-rugby-white" onClick={handleClickOutside}>
      {/* Header */}
      <div className="bg-gradient-to-r from-rugby-gold to-rugby-bronze text-white">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageCircle className="w-8 h-8" />
              <div>
                <h1 className="text-2xl font-bold">Chat Communauté</h1>
                <p className="text-sm text-white/80">
                  {messages.length} message{messages.length > 1 ? 's' : ''}
                </p>
              </div>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowUsersModal(true);
              }}
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-full transition-colors backdrop-blur-sm"
            >
              <Users className="w-5 h-5" />
              <span className="font-semibold">{onlineUsers.length}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modal utilisateurs en ligne */}
      {showUsersModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowUsersModal(false)}>
          <div className="bg-white rounded-lg max-w-md w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-800">
                Utilisateurs en ligne ({onlineUsers.length})
              </h2>
              <button
                onClick={() => setShowUsersModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
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
            const isSwiped = swipedMessage === msg.id;
            const swipeOffset = isSwiped ? touchCurrent : 0;
            
            return (
              <div 
                key={msg.id} 
                className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
              >
                <div className="max-w-[85%] relative">
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
                  
                  {/* Container avec swipe */}
                  <div className="relative overflow-visible">
                    {/* Bouton poubelle en arrière-plan (uniquement pour messages de l'utilisateur) */}
                    {isCurrentUser && (
                      <div className="absolute right-0 top-0 bottom-0 w-20 flex items-center justify-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteConfirm(msg.id);
                          }}
                          className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-red-600 transition-colors"
                          style={{
                            opacity: swipeOffset / 80,
                            transform: `scale(${0.5 + (swipeOffset / 80) * 0.5})`
                          }}
                        >
                          <Trash2 className="w-6 h-6" />
                        </button>
                      </div>
                    )}
                    
                    {/* Bulle message avec swipe */}
                    <div 
                      className={`rounded-2xl px-4 py-2 shadow-sm relative ${
                        isCurrentUser
                          ? 'bg-rugby-gold text-white rounded-tr-none'
                          : 'bg-white border border-gray-200 text-gray-800 rounded-tl-none'
                      }`}
                      style={{
                        transform: isCurrentUser ? `translateX(-${swipeOffset}px)` : 'none',
                        transition: touchStart ? 'none' : 'transform 0.3s ease-out'
                      }}
                      onTouchStart={(e) => isCurrentUser && handleTouchStart(e, msg.id)}
                      onTouchMove={(e) => isCurrentUser && handleTouchMove(e, msg.id)}
                      onTouchEnd={handleTouchEnd}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <p className="text-base whitespace-pre-wrap break-words">{msg.message}</p>
                      
                      <div className="flex items-center justify-between mt-1">
                        <p className={`text-[10px] ${
                          isCurrentUser ? 'text-white/70' : 'text-gray-400'
                        }`}>
                          {formatHeureParis(msg.created_at)}
                          {msg.edited && ' (modifié)'}
                        </p>
                      </div>

                      {/* Picker emojis */}
                      {showEmojiPicker === msg.id && (
                        <div className={`absolute -top-12 w-[90vw] bg-white border border-gray-200 rounded-full shadow-xl p-2 z-50 ${
                          isCurrentUser ? 'right-0' : 'left-0'
                        }`}>
                          <div className="flex gap-1 overflow-x-auto scrollbar-hide">
                            {quickEmojis.map((emoji) => (
                              <button
                                key={emoji}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleReaction(msg.id, emoji);
                                }}
                                className="text-2xl flex-shrink-0 hover:scale-125 transition-transform active:scale-95"
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Bouton emoji (uniquement pour messages des autres) */}
                      {!isCurrentUser && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowEmojiPicker(showEmojiPicker === msg.id ? null : msg.id);
                          }}
                          className="absolute -bottom-2 -right-2 bg-gray-200 rounded-full p-1.5 shadow-md hover:bg-gray-300 transition-colors md:hidden"
                        >
                          <span className="text-sm">😊</span>
                        </button>
                      )}

                      {/* Desktop hover */}
                      <div 
                        className="hidden md:block absolute -top-0 -bottom-0 -left-0 -right-0"
                        onMouseEnter={() => setShowEmojiPicker(msg.id)}
                        onMouseLeave={() => setShowEmojiPicker(null)}
                      />

                      {/* Réactions */}
                      {Object.keys(messageReactions).length > 0 && (
                        <div className="flex gap-1 mt-2 overflow-x-auto scrollbar-hide">
                          {Object.entries(messageReactions).map(([emoji, count]) => (
                            <span 
                              key={emoji}
                              className="bg-gray-100 rounded-full px-2 py-0.5 text-xs flex items-center gap-1 border border-gray-300 flex-shrink-0"
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
              </div>
            );
          })
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Modal confirmation suppression */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setDeleteConfirm(null)}>
          <div className="bg-white rounded-lg max-w-sm w-full shadow-xl p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Supprimer ce message ?</h3>
                <p className="text-sm text-gray-500">Cette action est irréversible</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-3 rounded-lg border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => handleDeleteMessage(deleteConfirm)}
                className="flex-1 py-3 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
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

      {/* CSS pour cacher la scrollbar */}
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}