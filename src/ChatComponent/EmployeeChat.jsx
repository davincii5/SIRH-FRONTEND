import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { Send, ShieldCheck, MessageSquare, Loader2, ChevronLeft } from 'lucide-react';
import { useChatSocket } from './useChatSocket';

const API_URL = 'http://127.0.0.1:8000/api';

const EmployeeChat = ({ token, currentUser }) => {
    const [conversations, setConversations] = useState([]);
    const [activeConv, setActiveConv] = useState(null);
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const { lastMessage, isConnected } = useChatSocket(token);
    const scrollRef = useRef(null);

    const fetchConversations = useCallback(async () => {
        try {
            const res = await axios.get(`${API_URL}/chat/conversations/`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setConversations(res.data);
            
            // Si une seule conversation et pas encore active, l'ouvrir
            if (res.data.length === 1 && !activeConv) {
                await openConversation(res.data[0]);
            }
        } catch (err) {
            setError("Erreur de chargement");
        } finally {
            setLoading(false);
        }
    }, [token, activeConv]);

    useEffect(() => {
        fetchConversations();
    }, [fetchConversations]);

    const openConversation = async (conv) => {
        setActiveConv(conv);
        setError(null);
        try {
            const res = await axios.get(`${API_URL}/chat/conversations/${conv.id}/messages/`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMessages(res.data);
            setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        } catch (err) {
            setError("Impossible de charger les messages");
        }
    };

    // ====== WebSocket listener - CORRIGÉ ======
    useEffect(() => {
        if (!lastMessage) return;

        console.log("🔥 Employé WS reçu:", lastMessage);
        console.log("   activeConv:", activeConv?.id);
        console.log("   liveConvId:", lastMessage.conversation_id);

        const liveConvId = String(lastMessage.conversation_id || lastMessage.conversation || '');
        const activeId = String(activeConv?.id || '');

        console.log("   Comparaison:", liveConvId, "===", activeId, "→", liveConvId === activeId);

        // Si c'est pour la conversation active, l'ajouter
        if (activeConv && liveConvId && liveConvId === activeId) {
            console.log("   ✅ Ajout au chat actif");
            setMessages(prev => {
                const msgId = String(lastMessage.id || '');
                const exists = prev.find(m => 
                    String(m.id) === msgId || 
                    (m.content === lastMessage.content && 
                     m.sender_id === lastMessage.sender_id &&
                     Math.abs(new Date(m.created_at) - new Date(lastMessage.created_at)) < 5000)
                );
                if (exists) {
                    console.log("   ⚠️ Message déjà présent, ignoré");
                    return prev;
                }
                const newMessages = [...prev, lastMessage];
                console.log("   📊 Messages:", newMessages.length);
                return newMessages;
            });
            setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
        } else {
            console.log("   ❌ Conversation non active, refresh liste");
            fetchConversations();
        }
    }, [lastMessage, activeConv, fetchConversations]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!inputValue.trim() || !activeConv) return;
        
        const text = inputValue;
        const receiverId = activeConv.hr_id;

        // Optimistic update
        const tempId = `temp-${Date.now()}`;
        const optimisticMsg = {
            id: tempId,
            content: text,
            sender_id: currentUser.id,
            sender_name: currentUser.username,
            conversation_id: activeConv.id,
            created_at: new Date().toISOString(),
            is_read: false
        };
        setMessages(prev => [...prev, optimisticMsg]);
        setInputValue('');
        setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);

        try {
            const res = await axios.post(`${API_URL}/chat/messages/send/`, {
                content: text,
                receiver_ids: [receiverId]
            }, { headers: { Authorization: `Bearer ${token}` }});
            
            const realMsg = res.data[0];
            if (realMsg) {
                setMessages(prev => prev.map(m => m.id === tempId ? realMsg : m));
            }
            setError(null);
        } catch (err) {
            setMessages(prev => prev.map(m => 
                m.id === tempId ? {...m, content: m.content + " ❌ [Échec]"} : m
            ));
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-64 font-black uppercase italic text-gray-400">
                <Loader2 className="w-8 h-8 animate-spin mb-2" />
                Connexion...
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto h-[75vh] flex flex-col border-4 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <div className="bg-yellow-300 border-b-4 border-black p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="bg-black p-2 border-2 border-white rounded-full">
                        <ShieldCheck className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h2 className="font-black uppercase text-sm">
                            {activeConv ? activeConv.hr_name : 'Support RH'}
                        </h2>
                        <p className="text-[10px] font-bold opacity-70 uppercase">
                            {isConnected ? 'En ligne' : 'Hors ligne'}
                        </p>
                    </div>
                </div>
                {activeConv && (
                    <button 
                        onClick={() => { setActiveConv(null); setMessages([]); }}
                        className="text-xs font-bold uppercase flex items-center gap-1 hover:underline"
                    >
                        <ChevronLeft className="w-4 h-4" /> Retour
                    </button>
                )}
            </div>

            {error && (
                <div className="bg-red-100 border-b-2 border-red-500 p-2 text-xs font-bold text-red-700 text-center">
                    {error}
                </div>
            )}

            {!activeConv ? (
                <div className="flex-1 overflow-y-auto p-2 bg-slate-50">
                    {conversations.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center p-8">
                            <MessageSquare className="w-12 h-12 text-gray-300 mb-2" />
                            <p className="font-black uppercase text-xs text-gray-400">
                                Aucune conversation.<br/>Attendez qu'un RH vous contacte.
                            </p>
                        </div>
                    ) : (
                        conversations.map(conv => {
                            const lastMsg = conv.last_message;
                            return (
                                <div 
                                    key={conv.id} 
                                    onClick={() => openConversation(conv)}
                                    className="p-3 border-4 border-black mb-2 cursor-pointer bg-white hover:bg-gray-100 transition-all"
                                >
                                    <p className="font-black text-sm uppercase">{conv.hr_name}</p>
                                    <p className="text-[10px] font-bold text-gray-500 truncate mt-1">
                                        {lastMsg ? `${lastMsg.sender_id === currentUser.id ? 'Vous' : conv.hr_name} : ${lastMsg.content}` : 'Nouvelle conversation'}
                                    </p>
                                </div>
                            );
                        })
                    )}
                </div>
            ) : (
                <>
                    <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50">
                        {messages.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center p-8 border-4 border-dashed border-gray-200">
                                <MessageSquare className="w-12 h-12 text-gray-200 mb-2" />
                                <p className="font-black uppercase text-xs text-gray-400">
                                    Aucun message. Écrivez votre première question.
                                </p>
                            </div>
                        ) : (
                            messages.map((msg, index) => {
                                const isMe = msg.sender_id === currentUser?.id;
                                return (
                                    <div key={msg.id || index} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                        <div className={`max-w-[70%] p-3 border-2 border-black font-bold text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${isMe ? 'bg-cyan-200' : 'bg-white'}`}>
                                            {msg.content}
                                        </div>
                                        <span className="text-[9px] font-black uppercase mt-2 text-gray-400 px-1">
                                            {isMe ? 'Vous' : msg.sender_name} • {new Date(msg.created_at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                                        </span>
                                    </div>
                                );
                            })
                        )}
                        <div ref={scrollRef} />
                    </div>

                    <form onSubmit={handleSend} className="p-4 border-t-4 border-black bg-white flex gap-3">
                        <input 
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder="Votre message..."
                            className="flex-1 border-4 border-black p-3 font-bold outline-none focus:bg-yellow-50"
                        />
                        <button 
                            type="submit"
                            disabled={!inputValue.trim()}
                            className="bg-black text-white px-6 py-3 border-4 border-black font-black uppercase hover:bg-gray-800 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all flex items-center gap-2 disabled:opacity-50"
                        >
                            <span className="hidden sm:inline">Envoyer</span>
                            <Send className="w-5 h-5" />
                        </button>
                    </form>
                </>
            )}
        </div>
    );
};

export default EmployeeChat;