import { useState, useEffect, useRef } from 'react';
import { Send, Users, MessageCircle, X, AlertCircle, Trash2, Brain } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { useChatNotification } from '../contexts/ChatNotificationContext';
import RugbyIATab from '../components/RugbyIATab';


// ✅ Fonction de formatage heure - VERSION DÉFINITIVE
const formatHeureParis = (dateString) => {
  if (!dateString) return 'Date inconnue';

  try {
    // Supprimer les microsecondes
    const cleaned = dateString.replace(' ', 'T').split('.')[0] + 'Z';
    // Exemple : "2025-12-26T21:21:44Z"

    const date = new Date(cleaned);

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
  const [activeTab, setActiveTab] = useState(
    () => sessionStorage.getItem('chat_active_tab') || 'chat'
  );
  const savedScrollPos = useRef(0);

  // Sauvegarder en continu la position scroll quand on est sur Chat
  useEffect(() => {
    if (activeTab !== 'chat') return;
    const handleScroll = () => {
      savedScrollPos.current = window.scrollY;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [activeTab]);

  useEffect(() => {
    sessionStorage.setItem('chat_active_tab', activeTab);
    if (activeTab === 'chat') {
      // Double RAF pour attendre le paint complet
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (savedScrollPos.current > 0) {
            window.scrollTo(0, savedScrollPos.current);
          } else {
            messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
          }
        });
      });
    } else {
      window.scrollTo(0, 0);
    }
  }, [activeTab]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const loadingMoreRef = useRef(false); // guard anti-scroll
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
  const topSentinelRef = useRef(null); // sentinel scroll infini

  // Emojis rapides
  const quickEmojis = [
    '❤️', '👍', '😂', '🏉', '🔥', '💪', '⚡', '🚀', 
    '🎯', '👏', '🎉', '💯', '🙌', '👌', '😎', '🤩',
    '🤔', '😍', '🥳', '🤣', '👀', '💀', '✨', '⭐',
    '🏆', '🥇', '🎊', '🌟', '💫', '🔝', '🆒', '💥',
    '😤', '🤝', '🙏', '👊', '🤘', '✌️', '🤙', '👋'
  ];

  const scrollToBottom = (smooth = true) => {
    if (loadingMoreRef.current) return; // bloquer scroll pendant chargement anciens msgs
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
  };

  useEffect(() => {
    if (!loadingMoreRef.current) scrollToBottom();
  }, [messages]);

  // ── Scroll infini : charger anciens messages quand on arrive en haut
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY < 100 && hasMore && !loadingMoreRef.current) {
        loadMoreMessages();
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasMore]);

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
      .or('deleted.eq.false,deleted.is.null')
      .order('created_at', { ascending: false })
      .limit(100);

    if (!error && data) {
      setOffset(100);
      // COUNT réel pour savoir s'il y a plus de 100 messages
      const { count } = await supabase
        .from('chat_messages')
        .select('*', { count: 'exact', head: true })
        .or('deleted.eq.false,deleted.is.null');
      setHasMore((count || 0) > 100);
      setMessages([...data].reverse());
      
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

  const loadMoreMessages = async () => {
    if (loadingMoreRef.current) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .or('deleted.eq.false,deleted.is.null')
        .order('created_at', { ascending: false })
        .range(offset, offset + 99);

      if (!error && data && data.length > 0) {
        setOffset(prev => prev + 100);
        setHasMore(data.length === 100);
        // Sauvegarder hauteur avant ajout pour restaurer position
        const scrollHeightBefore = document.documentElement.scrollHeight;
        const scrollTopBefore = window.scrollY;
        setMessages(prev => [...[...data].reverse(), ...prev]);
        // Restaurer position après rendu - double RAF pour attendre le paint
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            const scrollHeightAfter = document.documentElement.scrollHeight;
            window.scrollTo(0, scrollTopBefore + (scrollHeightAfter - scrollHeightBefore));
          });
        });
      } else {
        setHasMore(false);
      }
    } catch (e) {
      console.error('Erreur chargement messages:', e);
    } finally {
      setLoadingMore(false);
      loadingMoreRef.current = false;
    }
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

    // ✅ Générer un pseudo court
    const generatePseudo = () => {
      // 1. Si y a un pseudo dans user_metadata, l'utiliser
      if (user.user_metadata?.pseudo) {
        return user.user_metadata.pseudo;
      }
      
      // 2. Sinon, prendre le prénom uniquement (premier mot du nom complet)
      if (user.user_metadata?.nom_complet) {
        return user.user_metadata.nom_complet.split(' ')[0];
      }
      
      // 3. Sinon, prendre l'email avant le @
      if (user.email) {
        return user.email.split('@')[0];
      }
      
      // 4. Dernier recours
      return 'Anonyme';
    };

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
            pseudo: generatePseudo(),  // ✅ Pseudo court
            online_at: new Date().toISOString()
          });
        }
      });
  };

  const handleSend = async () => {
    if (!newMessage.trim() || sending || !user) return;

    setSending(true);

    // ✅ Générer le même pseudo que pour presence
    const generatePseudo = () => {
      if (user.user_metadata?.pseudo) return user.user_metadata.pseudo;
      if (user.user_metadata?.nom_complet) return user.user_metadata.nom_complet.split(' ')[0];
      if (user.email) return user.email.split('@')[0];
      return 'Anonyme';
    };

    const messageData = {
      user_id: user.id,
      username: generatePseudo(),  // ✅ Pseudo court au lieu de nom complet
      avatar_url: user.user_metadata?.avatar_url || null,
      message: newMessage.trim(),
      deleted: false
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
      {/* ✅ Header - FIXED */}
      <div
        className="fixed left-0 right-0 z-50 bg-gradient-to-r from-rugby-gold to-rugby-bronze text-white shadow-lg"
        style={{ top: 0, paddingTop: 'var(--safe-area-top, 0px)' }}
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <MessageCircle className="w-8 h-8" />
              <h1 className="text-2xl font-bold">Chat</h1>
            </div>

            {activeTab === 'chat' && (
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
            )}
          </div>

          {/* Onglets */}
          <div className="flex gap-1 bg-white/10 rounded-xl p-1">
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'chat'
                  ? 'bg-white text-rugby-gold shadow-sm'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              <MessageCircle className="w-4 h-4" />
              Communauté
            </button>
            <button
              onClick={() => setActiveTab('ia')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'ia'
                  ? 'bg-white text-rugby-gold shadow-sm'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              <Brain className="w-4 h-4" />
              IA Rugby
            </button>
          </div>
        </div>
      </div>

      {/* ── ONGLET IA Rugby ── (display:none pour garder en mémoire) */}
      <div style={{ display: activeTab === 'ia' ? 'block' : 'none' }}>
        <RugbyIATab />
      </div>

      {/* ── ONGLET CHAT COMMUNAUTÉ ── (display:none pour garder en mémoire) */}
      <div style={{ display: activeTab === 'chat' ? 'block' : 'none' }}>
        <>
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
                            {/* ✅ PSEUDO COURT */}
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

          {/* ✅ Zone messages - PADDING-TOP pour passer sous le header fixed */}
          <div className="container mx-auto px-4 py-4 space-y-3"
            style={{ 
              paddingTop: 'calc(var(--safe-area-top, 0px) + 9.5rem)',
              paddingBottom: 'calc(6rem + env(safe-area-inset-bottom, 0px))'
            }}>
            {loadingMore && (
              <div className="flex justify-center py-3">
                <div className="w-5 h-5 border-2 border-rugby-gold border-t-transparent rounded-full animate-spin" />
              </div>
            )}

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
                          {/* ✅ PSEUDO COURT dans les messages */}
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
                          <p className="text-base whitespace-pre-wrap break-words">
                            {msg.message.split(/(https?:\/\/[^\s]+)/g).map((part, i) =>
                              /^https?:\/\//.test(part)
                                ? <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="underline text-blue-500 break-all">{part}</a>
                                : part
                            )}
                          </p>
                          
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
          <div className="fixed left-0 right-0 bg-white border-t border-gray-200 shadow-lg"
               style={{ 
                 bottom: 'calc(4rem + env(safe-area-inset-bottom, 0px))',
                 paddingLeft: '1rem',
                 paddingRight: '1rem',
                 paddingTop: '0.75rem',
                 paddingBottom: '0.75rem',
               }}>
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
        </>
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
