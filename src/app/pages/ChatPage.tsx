import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import {
  MessageSquare, Send, ArrowLeft, TreePine, User,
  Loader2, LogIn, Circle,
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export function ChatPage() {
  const { isAuthenticated, user, setShowAuthModal } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConv, setActiveConv] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Load conversations
  useEffect(() => {
    if (!isAuthenticated) { setLoadingConvs(false); return; }
    api.chat.getConversations()
      .then(data => setConversations(data || []))
      .catch(() => {})
      .finally(() => setLoadingConvs(false));
  }, [isAuthenticated]);

  // Load messages when conversation selected
  useEffect(() => {
    if (!activeConv) return;
    setLoadingMsgs(true);
    api.chat.getMessages(activeConv.adoption_id)
      .then(data => {
        setMessages(data || []);
        // Mark conv as read
        setConversations(prev => prev.map(c =>
          c.adoption_id === activeConv.adoption_id ? { ...c, unread_count: 0 } : c
        ));
      })
      .catch(() => {})
      .finally(() => setLoadingMsgs(false));
  }, [activeConv?.adoption_id]);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // WebSocket for real-time
  useEffect(() => {
    if (!isAuthenticated) return;
    const token = localStorage.getItem('access_token');
    if (!token) return;

    const ws = new WebSocket(`ws://localhost:8000/api/v1/ws/user?token=${token}`);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.event === 'NEW_CHAT_MESSAGE') {
          const d = payload.data;
          // If this message belongs to the active conversation, append it
          setMessages(prev => {
            if (!activeConvRef.current || activeConvRef.current.adoption_id !== d.adoption_id) return prev;
            // Avoid duplicate if we already added it optimistically
            if (prev.find(m => m.id === d.id)) return prev;
            return [...prev, {
              id: d.id,
              adoption_id: d.adoption_id,
              sender_id: d.sender_id,
              sender_role: d.sender_role,
              sender_name: d.sender_name,
              message: d.message,
              is_read: false,
              created_at: d.created_at,
            }];
          });
          // Update last message in conversation list
          setConversations(prev => prev.map(c => {
            if (c.adoption_id !== d.adoption_id) return c;
            const isActive = activeConvRef.current?.adoption_id === d.adoption_id;
            return {
              ...c,
              last_message: d.message,
              last_message_time: d.created_at,
              unread_count: isActive ? 0 : (c.unread_count || 0) + (d.sender_id !== user?.id ? 1 : 0),
            };
          }));
        }
      } catch {}
    };

    return () => ws.close();
  }, [isAuthenticated]);

  // Keep activeConv in a ref so the WS handler can access it
  const activeConvRef = useRef(activeConv);
  useEffect(() => { activeConvRef.current = activeConv; }, [activeConv]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !activeConv || sending) return;
    const text = input.trim();
    setInput('');
    setSending(true);

    // Optimistic update
    const optimistic = {
      id: `temp_${Date.now()}`,
      adoption_id: activeConv.adoption_id,
      sender_id: user?.id,
      sender_role: user?.role === 'farmer' || user?.role === 'admin' ? 'farmer' : 'user',
      sender_name: user?.name,
      message: text,
      is_read: false,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimistic]);

    try {
      const sent = await api.chat.sendMessage(activeConv.adoption_id, text);
      // Replace optimistic with real
      setMessages(prev => prev.map(m => m.id === optimistic.id ? sent : m));
      setConversations(prev => prev.map(c =>
        c.adoption_id === activeConv.adoption_id
          ? { ...c, last_message: text, last_message_time: sent.created_at }
          : c
      ));
    } catch {
      setMessages(prev => prev.filter(m => m.id !== optimistic.id));
      setInput(text);
    } finally {
      setSending(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[var(--cream-white)] to-[var(--light-sage)] pt-24 flex items-center justify-center px-4">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl p-12 shadow-2xl text-center max-w-md w-full"
        >
          <MessageSquare className="w-20 h-20 text-[var(--forest-green)] mx-auto mb-6 opacity-40" />
          <h2 className="text-2xl font-bold text-[var(--deep-forest)] mb-3">Sign in to access chats</h2>
          <p className="text-[var(--earth-brown)] mb-6 text-sm">Chat with your farmer or adopters about your trees.</p>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => setShowAuthModal(true)}
            className="w-full py-4 bg-gradient-to-r from-[var(--forest-green)] to-[var(--leaf-green)] text-white font-bold rounded-2xl shadow-lg flex items-center justify-center gap-2"
          >
            <LogIn className="w-5 h-5" /> Sign In
          </motion.button>
        </motion.div>
      </div>
    );
  }

  const isFarmer = user?.role === 'farmer' || user?.role === 'admin';

  return (
    <div className="min-h-screen bg-gradient-to-b from-[var(--cream-white)] to-[var(--light-sage)] pt-20 pb-0">
      <div className="max-w-6xl mx-auto px-4 h-[calc(100vh-5rem)] flex flex-col">

        <div className="flex items-center gap-3 py-4">
          <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-white/60 transition-colors">
            <ArrowLeft className="w-5 h-5 text-[var(--forest-green)]" />
          </button>
          <h1 className="text-2xl font-bold text-[var(--deep-forest)]">
            {isFarmer ? 'Adopter Chats' : 'My Farmer Chats'}
          </h1>
        </div>

        <div className="flex flex-1 gap-4 min-h-0 pb-4">

          {/* Conversations sidebar */}
          <div className="w-80 flex-shrink-0 bg-white rounded-3xl shadow-xl flex flex-col overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <p className="text-xs font-bold text-[var(--earth-brown)] uppercase tracking-wider">
                {conversations.length} Conversation{conversations.length !== 1 ? 's' : ''}
              </p>
            </div>

            <div className="flex-1 overflow-y-auto">
              {loadingConvs ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="w-6 h-6 text-[var(--forest-green)] animate-spin" />
                </div>
              ) : conversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-center px-6">
                  <TreePine className="w-12 h-12 text-gray-200 mb-3" />
                  <p className="text-sm text-[var(--earth-brown)]">
                    {isFarmer ? 'No adopters yet.' : 'Adopt a tree to start chatting with your farmer.'}
                  </p>
                </div>
              ) : (
                conversations.map(conv => (
                  <motion.button key={conv.adoption_id} whileHover={{ x: 2 }}
                    onClick={() => setActiveConv(conv)}
                    className={`w-full flex items-center gap-3 p-4 border-b border-gray-50 text-left transition-colors ${
                      activeConv?.adoption_id === conv.adoption_id
                        ? 'bg-[var(--light-sage)]/40'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="relative flex-shrink-0">
                      {conv.tree_image ? (
                        <img src={conv.tree_image} alt="" className="w-12 h-12 rounded-2xl object-cover" />
                      ) : (
                        <div className="w-12 h-12 rounded-2xl bg-[var(--light-sage)] flex items-center justify-center">
                          <TreePine className="w-6 h-6 text-[var(--forest-green)]" />
                        </div>
                      )}
                      {conv.unread_count > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-[var(--forest-green)] text-white text-[9px] font-black rounded-full flex items-center justify-center">
                          {conv.unread_count}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-sm font-bold text-[var(--deep-forest)] truncate">{conv.other_name}</span>
                        <span className="text-[10px] text-gray-400 flex-shrink-0 ml-1">
                          {conv.last_message_time ? new Date(conv.last_message_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--earth-brown)] truncate">{conv.custom_tree_name} • {conv.tree_type}</p>
                      <p className="text-xs text-gray-400 truncate mt-0.5">{conv.last_message || 'No messages yet'}</p>
                    </div>
                  </motion.button>
                ))
              )}
            </div>
          </div>

          {/* Chat window */}
          <div className="flex-1 bg-white rounded-3xl shadow-xl flex flex-col overflow-hidden min-w-0">
            {!activeConv ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                <MessageSquare className="w-16 h-16 text-gray-200 mb-4" />
                <h3 className="text-lg font-bold text-[var(--deep-forest)] mb-2">Select a conversation</h3>
                <p className="text-sm text-[var(--earth-brown)]">Choose a chat from the left to start messaging</p>
              </div>
            ) : (
              <>
                {/* Chat header */}
                <div className="flex items-center gap-3 p-4 border-b border-gray-100 bg-gray-50/50">
                  {activeConv.tree_image ? (
                    <img src={activeConv.tree_image} alt="" className="w-10 h-10 rounded-xl object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-[var(--light-sage)] flex items-center justify-center">
                      <TreePine className="w-5 h-5 text-[var(--forest-green)]" />
                    </div>
                  )}
                  <div>
                    <h3 className="font-bold text-sm text-[var(--deep-forest)]">{activeConv.other_name}</h3>
                    <p className="text-xs text-[var(--earth-brown)]">{activeConv.custom_tree_name} • {activeConv.tree_type}</p>
                  </div>
                  <div className="ml-auto flex items-center gap-1.5 text-xs text-green-600 font-semibold">
                    <Circle className="w-2 h-2 fill-green-500" /> Online
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {loadingMsgs ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="w-6 h-6 text-[var(--forest-green)] animate-spin" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <MessageSquare className="w-10 h-10 text-gray-200 mb-2" />
                      <p className="text-sm text-[var(--earth-brown)]">No messages yet. Say hello! 👋</p>
                    </div>
                  ) : (
                    messages.map(msg => {
                      const isMe = msg.sender_id === user?.id;
                      return (
                        <motion.div key={msg.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
                        >
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                            isMe ? 'bg-[var(--forest-green)] text-white' : 'bg-[var(--light-sage)] text-[var(--forest-green)]'
                          }`}>
                            {msg.sender_name?.[0]?.toUpperCase() || <User className="w-3 h-3" />}
                          </div>
                          <div className={`max-w-[70%] ${isMe ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                            {!isMe && (
                              <span className="text-[10px] text-[var(--earth-brown)] font-semibold px-1">
                                {msg.sender_name} · {msg.sender_role === 'farmer' ? '🌾 Farmer' : '🌱 Adopter'}
                              </span>
                            )}
                            <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                              isMe
                                ? 'bg-gradient-to-br from-[var(--forest-green)] to-[var(--leaf-green)] text-white rounded-br-sm'
                                : 'bg-gray-100 text-[var(--deep-forest)] rounded-bl-sm'
                            }`}>
                              {msg.message}
                            </div>
                            <span className="text-[10px] text-gray-400 px-1">
                              {new Date(msg.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </motion.div>
                      );
                    })
                  )}
                  <div ref={bottomRef} />
                </div>

                {/* Input */}
                <form onSubmit={handleSend} className="p-4 border-t border-gray-100 flex gap-3 items-center">
                  <input
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder={`Message ${activeConv.other_name}...`}
                    className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm outline-none focus:border-[var(--forest-green)] transition-colors"
                  />
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    type="submit"
                    disabled={!input.trim() || sending}
                    className="w-11 h-11 bg-gradient-to-br from-[var(--forest-green)] to-[var(--leaf-green)] text-white rounded-2xl flex items-center justify-center shadow-md disabled:opacity-50 flex-shrink-0"
                  >
                    {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </motion.button>
                </form>
              </>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
