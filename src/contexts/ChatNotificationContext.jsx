import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from './AuthContext';

const ChatNotificationContext = createContext();

export function ChatNotificationProvider({ children }) {
  const { user } = useAuth();
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);

  useEffect(() => {
    if (!user) return;

    checkUnreadMessages();
    subscribeToNewMessages();
  }, [user]);

  const checkUnreadMessages = async () => {
    const lastRead = localStorage.getItem('lastChatRead');
    
    if (!lastRead) {
      setHasUnreadMessages(false);
      return;
    }

    const { count } = await supabase
      .from('chat_messages')
      .select('*', { count: 'exact', head: true })
      .eq('deleted', false)
      .gt('created_at', lastRead)
      .neq('user_id', user.id); // Pas ses propres messages

    setHasUnreadMessages(count > 0);
  };

  const subscribeToNewMessages = () => {
    const channel = supabase
      .channel('chat-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages'
        },
        (payload) => {
          // Si le message n'est pas du user actuel
          if (payload.new.user_id !== user.id) {
            // Vérifier si on n'est pas sur la page chat
            const isOnChatPage = window.location.pathname === '/chat';
            
            if (!isOnChatPage) {
              setHasUnreadMessages(true);
            }
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  };

  const markAsRead = () => {
    localStorage.setItem('lastChatRead', new Date().toISOString());
    setHasUnreadMessages(false);
  };

  return (
    <ChatNotificationContext.Provider value={{ hasUnreadMessages, markAsRead }}>
      {children}
    </ChatNotificationContext.Provider>
  );
}

export function useChatNotification() {
  const context = useContext(ChatNotificationContext);
  if (!context) {
    throw new Error('useChatNotification must be used within ChatNotificationProvider');
  }
  return context;
}
