// ============================================
// RugbyIATab.jsx – IA Conversationnelle Rugby
// ============================================
// Interface chat avec l'IA rugby intégrée dans ChatPage
// Limite : 5 questions/jour/user
// ============================================

import { useState, useEffect, useRef } from 'react';
import { Send, Brain, Zap } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const API_BASE = 'https://top14-api-production.up.railway.app';

const SUGGESTIONS = [
  "Comment se porte le Stade Toulousain cette saison ?",
  "Qui sont les favoris pour le titre du Top 14 ?",
  "C'est quoi la règle du en-avant ?",
  "Quel est le pronostic IA pour le prochain match ?",
  "Combien de fois Toulouse a gagné le championnat ?",
];

export default function RugbyIATab() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [quota, setQuota] = useState({ used: 0, remaining: 5, limit: 5 });
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadQuota();
    // Message de bienvenue
    setMessages([{
      id: 'welcome',
      role: 'assistant',
      text: "👋 Bonjour ! Je suis ton assistant rugby IA. Pose-moi n'importe quelle question sur le rugby — règles, équipes, pronostics, statistiques... Je suis là pour t'aider ! 🏉",
    }]);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadQuota = async () => {
    if (!user) return;
    try {
      const res = await axios.get(`${API_BASE}/api/rugby-ia/quota`, {
        headers: { 'x-user-id': user.id }
      });
      setQuota(res.data);
    } catch (e) {
      console.warn('Erreur chargement quota:', e.message);
    }
  };

  const handleSend = async (questionText) => {
    const question = (questionText || input).trim();
    if (!question || loading || !user) return;
    if (quota.remaining <= 0) return;

    setInput('');
    setLoading(true);

    // Ajouter la question dans le fil
    const userMsg = { id: Date.now(), role: 'user', text: question };
    setMessages(prev => [...prev, userMsg]);

    try {
      const res = await axios.post(`${API_BASE}/api/rugby-ia/chat`,
        { question },
        { headers: { 'x-user-id': user.id } }
      );

      const assistantMsg = {
        id: Date.now() + 1,
        role: 'assistant',
        text: res.data.answer,
      };
      setMessages(prev => [...prev, assistantMsg]);
      setQuota(prev => ({
        ...prev,
        used: prev.used + 1,
        remaining: res.data.remaining,
      }));
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Erreur de connexion. Réessaie dans quelques instants.';
      const isQuotaError = err.response?.status === 429;
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'error',
        text: isQuotaError
          ? `⏳ ${errorMsg}`
          : `❌ ${errorMsg}`,
      }]);
      if (isQuotaError) {
        setQuota(prev => ({ ...prev, remaining: 0 }));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const quotaColor = quota.remaining === 0
    ? 'text-red-500'
    : quota.remaining <= 2
      ? 'text-orange-500'
      : 'text-green-600';

  return (
    <div className="flex flex-col min-h-screen bg-rugby-white">

      {/* Zone messages */}
      <div className="flex-1 container mx-auto px-4 py-4 space-y-4 pb-40"
           style={{ paddingTop: 'calc(var(--safe-area-top, 0px) + 6rem)' }}>

        {/* Quota */}
        <div className="sticky top-0 z-10 flex items-center justify-center gap-2 bg-white rounded-full px-4 py-2 shadow-sm border border-gray-200 w-fit mx-auto">
          <Zap className={`w-4 h-4 ${quotaColor}`} />
          <span className={`text-xs font-semibold ${quotaColor}`}>
            {quota.remaining}/{quota.limit} questions aujourd'hui
          </span>
        </div>

        {/* Messages */}
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[85%] ${msg.role === 'user' ? '' : 'flex items-start gap-2'}`}>
              {msg.role !== 'user' && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rugby-gold to-rugby-bronze flex items-center justify-center flex-shrink-0 mt-1">
                  <Brain className="w-4 h-4 text-white" />
                </div>
              )}
              <div className={`rounded-2xl px-4 py-3 shadow-sm ${
                msg.role === 'user'
                  ? 'bg-rugby-gold text-white rounded-tr-none'
                  : msg.role === 'error'
                    ? 'bg-red-50 border border-red-200 text-red-700 rounded-tl-none'
                    : 'bg-white border border-gray-200 text-gray-800 rounded-tl-none'
              }`}>
                <p className="text-base whitespace-pre-wrap break-words">{msg.text}</p>
              </div>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {loading && (
          <div className="flex justify-start">
            <div className="flex items-start gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rugby-gold to-rugby-bronze flex items-center justify-center flex-shrink-0">
                <Brain className="w-4 h-4 text-white" />
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm">
                <div className="flex gap-1 items-center">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Suggestions (si conversation vide ou après welcome) */}
        {messages.length <= 1 && !loading && (
          <div className="space-y-2 mt-4">
            <p className="text-xs text-gray-400 text-center font-medium">Suggestions</p>
            {SUGGESTIONS.map((s, i) => (
              <button
                key={i}
                onClick={() => handleSend(s)}
                disabled={quota.remaining <= 0}
                className="w-full text-left px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 hover:border-rugby-gold hover:bg-rugby-gold/5 transition-colors shadow-sm disabled:opacity-50"
              >
                🏉 {s}
              </button>
            ))}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Barre de saisie fixe */}
      <div className="fixed bottom-16 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg">
        <div className="container mx-auto">
          {quota.remaining <= 0 ? (
            <div className="text-center py-2 bg-orange-50 rounded-xl border border-orange-200 px-4">
              <p className="text-sm text-orange-600 font-semibold">
                ⏳ Limite quotidienne atteinte — Reviens demain !
              </p>
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Pose ta question rugby..."
                disabled={loading || quota.remaining <= 0}
                maxLength={500}
                className="flex-1 px-4 py-2 border-2 border-rugby-gray rounded-full focus:ring-2 focus:ring-rugby-gold focus:border-rugby-gold disabled:bg-gray-100"
              />
              <button
                onClick={() => handleSend()}
                disabled={loading || !input.trim() || quota.remaining <= 0}
                className="bg-rugby-gold text-white p-2 rounded-full hover:bg-rugby-bronze transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>
          )}
          {input.length > 0 && (
            <p className="text-xs text-gray-400 mt-1 text-right">{input.length}/500</p>
          )}
        </div>
      </div>
    </div>
  );
}
