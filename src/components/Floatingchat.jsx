import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { useChatSocket } from '../ChatComponent/useChatSocket';
import { 
    MessageSquare, X, Search, ChevronDown, ChevronUp, Send, 
    Edit3, SlidersHorizontal, 
    Users, ArrowLeft
} from 'lucide-react';

const API_URL = 'http://127.0.0.1:8000/api';

const FloatingChat = ({ token, currentUser }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [conversations, setConversations] = useState([]);
    const [activeConv, setActiveConv] = useState(null);
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [showNewChat, setShowNewChat] = useState(false);
    const [allEmployees, setAllEmployees] = useState([]);
    const [selectedEmployee, setSelectedEmployee] = useState('');
    const [isGlobal, setIsGlobal] = useState(false);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

    const { lastMessage } = useChatSocket(token);
    const scrollRef = useRef(null);

    const role = currentUser?.role?.toUpperCase() || 'EMPLOYE';
    const isRH = ['RH', 'ADMIN', 'ADMINISTRATEUR'].includes(role);

    const fetchConversations = useCallback(async () => {
        try {
            const res = await axios.get(`${API_URL}/chat/conversations/`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setConversations(res.data);
        } catch (err) {
            console.error("Erreur chargement conversations:", err);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchConversations();
        if (isRH) {
            axios.get(`${API_URL}/accounts/employes/`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            .then(res => setAllEmployees(res.data))
            .catch(err => console.error("Erreur chargement employés:", err));
        }
    }, [token, fetchConversations, isRH]);

    useEffect(() => {
        if (!lastMessage) return;
        if (lastMessage.action === 'refresh_conversations') {
            fetchConversations();
            return;
        }
        const liveConvId = String(lastMessage.conversation_id || lastMessage.conversation || '');
        const activeId = String(activeConv?.id || '');
        if (activeConv && liveConvId && liveConvId === activeId) {
            setMessages(prev => {
                const msgId = String(lastMessage.id || '');
                const exists = prev.find(m => 
                    String(m.id) === msgId || 
                    (m.content === lastMessage.content && 
                     m.sender_id === lastMessage.sender_id &&
                     Math.abs(new Date(m.created_at) - new Date(lastMessage.created_at)) < 5000)
                );
                if (exists) return prev;
                return [...prev, lastMessage];
            });
            setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
        } else {
            fetchConversations();
        }
    }, [lastMessage, activeConv, fetchConversations]);

    const openConversation = async (conv) => {
        setActiveConv(conv);
        setShowNewChat(false);
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

    const handleSend = async (e) => {
        e.preventDefault();
        if (!inputValue.trim() || !activeConv) return;
        const text = inputValue;
        const currentId = String(currentUser?.id || '');
        const hrId = String(activeConv?.hr_id || activeConv?.hr?.id || '');
        const empId = String(activeConv?.employee_id || activeConv?.employee?.id || '');
        let receiverId;
        if (hrId === currentId && empId) receiverId = empId;
        else if (empId === currentId && hrId) receiverId = hrId;
        else receiverId = isRH ? empId : hrId;
        if (!receiverId) {
            setError("Impossible de déterminer le destinataire");
            return;
        }
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
            setError(err.response?.data?.error || "Échec de l'envoi");
        }
    };

    const handleStartNewChat = async () => {
        if (isGlobal) {
            if (!inputValue.trim()) return;
            try {
                await axios.post(`${API_URL}/chat/messages/send/`, {
                    content: inputValue,
                    receiver_ids: 'all'
                }, { headers: { Authorization: `Bearer ${token}` }});
                setInputValue('');
                setShowNewChat(false);
                setIsGlobal(false);
                fetchConversations();
            } catch (err) {
                setError(err.response?.data?.error || "Échec de l'envoi global");
            }
            return;
        }
        if (!selectedEmployee || !inputValue.trim()) return;
        try {
            const res = await axios.post(`${API_URL}/chat/messages/send/`, {
                content: inputValue,
                receiver_ids: [selectedEmployee]
            }, { headers: { Authorization: `Bearer ${token}` }});
            const newMsg = res.data[0];
            if (newMsg) setMessages(prev => [...prev, newMsg]);
            setInputValue('');
            setShowNewChat(false);
            setSelectedEmployee('');
            fetchConversations();
        } catch (err) {
            setError(err.response?.data?.error || "Échec de l'envoi");
        }
    };

    const filteredConversations = conversations.filter(conv => {
        const name = isRH ? (conv.employee_name || '') : (conv.hr_name || '');
        return name.toLowerCase().includes(searchQuery.toLowerCase());
    });

    const Avatar = ({ name, small = false }) => {
        const initial = (name || '?').charAt(0).toUpperCase();
        const sizeClass = small ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm';
        return (
            <div className={`${sizeClass} bg-black text-white font-black border-2 border-black flex items-center justify-center shrink-0`}>
                {initial}
            </div>
        );
    };

    // ═══════ BOUTON FLOTTANT (style LinkedIn) ═══════
    if (!isOpen) {
        return (
            <div className="fixed bottom-6 right-6 z-50">
                <button 
                    onClick={() => setIsOpen(true)}
                    className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(253,224,71,1)] hover:translate-x-1 hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(253,224,71,1)] active:translate-x-0 active:translate-y-0 active:shadow-none transition-all flex items-center gap-3 px-4 py-2.5"
                >
                    <div className="w-8 h-8 bg-black text-white font-black text-xs flex items-center justify-center border-2 border-black shrink-0">
                        S
                    </div>
                    <span className="font-black text-sm uppercase tracking-tight">Messaging</span>
                    <span className="w-2.5 h-2.5 bg-green-500 rounded-full border border-black shrink-0"></span>
                    <ChevronUp className="w-4 h-4 text-gray-600 shrink-0" />
                </button>
            </div>
        );
    }

    return (
        <div className="fixed bottom-6 right-6 z-50 flex items-end gap-4">
            {activeConv && (
                <div className="w-[360px] h-[480px] bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col overflow-hidden">
                    <div className="bg-yellow-300 border-b-4 border-black p-3 flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-3 min-w-0">
                            <Avatar name={isRH ? activeConv.employee_name : activeConv.hr_name} />
                            <div className="min-w-0">
                                <h3 className="font-black text-sm uppercase truncate">
                                    {isRH ? activeConv.employee_name : activeConv.hr_name}
                                </h3>
                            </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                            <button 
                                onClick={() => { setActiveConv(null); setMessages([]); }}
                                className="p-1.5 hover:bg-black hover:text-white transition-colors border-2 border-transparent hover:border-black"
                            >
                                <ArrowLeft className="w-4 h-4" />
                            </button>
                            <button 
                                onClick={() => { setActiveConv(null); setMessages([]); setIsOpen(false); }}
                                className="p-1.5 hover:bg-red-500 hover:text-white transition-colors border-2 border-transparent hover:border-black"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
                        {messages.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center">
                                <MessageSquare className="w-10 h-10 text-gray-300 mb-2" />
                                <p className="font-black text-[10px] uppercase text-gray-400">
                                    Aucun message.<br/>Écrivez votre premier message.
                                </p>
                            </div>
                        ) : (
                            messages.map((msg, index) => {
                                const isMe = msg.sender_id === currentUser?.id;
                                return (
                                    <div key={msg.id || index} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                        <div className={`max-w-[75%] p-2.5 border-2 border-black font-bold text-xs shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] ${isMe ? 'bg-yellow-300' : 'bg-white'}`}>
                                            {msg.content}
                                        </div>
                                        <span className="text-[9px] font-black uppercase mt-1 text-gray-400">
                                            {isMe ? 'Vous' : msg.sender_name} • {new Date(msg.created_at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                                        </span>
                                    </div>
                                );
                            })
                        )}
                        <div ref={scrollRef} />
                    </div>
                    <form onSubmit={handleSend} className="p-3 border-t-4 border-black bg-white flex gap-2 shrink-0">
                        <input 
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder="Écrivez un message..."
                            className="flex-1 border-2 border-black p-2.5 font-bold text-xs outline-none focus:bg-yellow-50"
                        />
                        <button 
                            type="submit"
                            disabled={!inputValue.trim()}
                            className="bg-black text-white px-4 py-2 border-2 border-black font-black text-xs uppercase hover:bg-gray-800 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all flex items-center gap-1 disabled:opacity-40"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </form>
                </div>
            )}

            <div className="w-[320px] h-[520px] bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col overflow-hidden">
                <div className="bg-white border-b-4 border-black p-3 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-black text-white font-black text-xs flex items-center justify-center border-2 border-black">
                            S
                        </div>
                        <h2 className="font-black text-sm uppercase tracking-tight">Messaging</h2>
                    </div>
                    <div className="flex items-center gap-1">
                        {isRH && (
                            <button 
                                onClick={() => setShowNewChat(!showNewChat)}
                                className="p-1.5 hover:bg-yellow-300 transition-colors border-2 border-transparent hover:border-black"
                                title="Nouvelle conversation"
                            >
                                <Edit3 className="w-4 h-4" />
                            </button>
                        )}
                        <button 
                            onClick={() => setIsOpen(false)}
                            className="p-1.5 hover:bg-red-500 hover:text-white transition-colors border-2 border-transparent hover:border-black"
                        >
                            <ChevronDown className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {!showNewChat && (
                    <div className="p-3 border-b-2 border-black bg-gray-50 shrink-0">
                        <div className="flex items-center gap-2 border-2 border-black bg-white px-3 py-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                            <Search className="w-4 h-4 text-gray-500" />
                            <input 
                                type="text"
                                placeholder="Search messages"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="flex-1 bg-transparent outline-none font-bold text-xs uppercase placeholder:font-bold placeholder:text-gray-400"
                            />
                            <SlidersHorizontal className="w-4 h-4 text-gray-500" />
                        </div>
                    </div>
                )}

                {!showNewChat && (
                    <div className="border-b-2 border-black shrink-0">
                        <div className="py-3 font-black text-xs uppercase text-center text-black border-b-4 border-black">
                            Focused
                        </div>
                    </div>
                )}

                {error && (
                    <div className="bg-red-100 border-b-2 border-red-500 p-2 text-[10px] font-bold text-red-700 text-center shrink-0">
                        {error}
                    </div>
                )}

                {showNewChat && isRH && (
                    <div className="flex-1 overflow-y-auto p-4 bg-slate-50">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-black text-sm uppercase">Nouveau message</h3>
                            <button 
                                onClick={() => { setShowNewChat(false); setIsGlobal(false); setError(null); }}
                                className="text-[10px] font-black uppercase text-gray-500 hover:text-black"
                            >
                                Annuler
                            </button>
                        </div>
                        <label className="flex items-center gap-2 mb-4 cursor-pointer border-2 border-black p-2 bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                            <input 
                                type="checkbox" 
                                checked={isGlobal}
                                onChange={(e) => setIsGlobal(e.target.checked)}
                                className="w-4 h-4 accent-black"
                            />
                            <span className="font-bold text-[10px] uppercase flex items-center gap-2">
                                <Users className="w-3 h-3" /> Envoyer à TOUS
                            </span>
                        </label>
                        {!isGlobal && (
                            <>
                                <label className="font-bold text-[10px] uppercase mb-1 block">Destinataire :</label>
                                <select 
                                    className="w-full border-2 border-black p-2 font-bold text-xs mb-4 outline-none bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                                    value={selectedEmployee}
                                    onChange={(e) => setSelectedEmployee(e.target.value)}
                                >
                                    <option value="">-- Choisir --</option>
                                    {allEmployees.filter(emp => emp.id !== currentUser.id).map(emp => (
                                        <option key={emp.id} value={emp.id}>{emp.username}</option>
                                    ))}
                                </select>
                            </>
                        )}
                        <label className="font-bold text-[10px] uppercase mb-1 block">Message :</label>
                        <textarea 
                            className="w-full border-2 border-black p-2 font-bold text-xs outline-none min-h-[100px] resize-none bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder={isGlobal ? "Message global..." : "Écrivez ici..."}
                        />
                        <button 
                            onClick={handleStartNewChat}
                            disabled={!inputValue.trim() || (!isGlobal && !selectedEmployee)}
                            className="mt-3 w-full bg-black text-white px-4 py-2 font-black text-xs uppercase hover:bg-gray-800 shadow-[3px_3px_0px_0px_rgba(253,224,71,1)] disabled:opacity-40"
                        >
                            {isGlobal ? 'Envoyer à tous' : 'Envoyer'}
                        </button>
                    </div>
                )}

                {!showNewChat && (
                    <div className="flex-1 overflow-y-auto bg-white">
                        {loading ? (
                            <div className="p-8 text-center font-black text-xs uppercase text-gray-400 animate-pulse">
                                Chargement...
                            </div>
                        ) : filteredConversations.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                                <MessageSquare className="w-10 h-10 text-gray-200 mb-3" />
                                <p className="font-black text-[10px] uppercase text-gray-400 mb-1">Aucune discussion</p>
                                {isRH && (
                                    <button 
                                        onClick={() => setShowNewChat(true)}
                                        className="mt-2 text-[10px] font-black uppercase text-black underline"
                                    >
                                        Démarrer une conversation
                                    </button>
                                )}
                            </div>
                        ) : (
                            filteredConversations.map(conv => {
                                const lastMsg = conv.last_message;
                                const name = isRH ? conv.employee_name : conv.hr_name;
                                const date = lastMsg ? new Date(lastMsg.created_at).toLocaleDateString([], {month:'short', day:'numeric'}) : '';
                                return (
                                    <div 
                                        key={conv.id} 
                                        onClick={() => openConversation(conv)}
                                        className={`flex items-start gap-3 p-3 border-b-2 border-gray-100 cursor-pointer transition-all hover:bg-gray-50 ${
                                            activeConv?.id === conv.id ? 'bg-yellow-50 border-l-4 border-l-black' : 'border-l-4 border-l-transparent'
                                        }`}
                                    >
                                        <Avatar name={name} />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-0.5">
                                                <h4 className="font-black text-xs uppercase truncate">{name}</h4>
                                                {date && <span className="text-[9px] font-bold text-gray-400 shrink-0 ml-2">{date}</span>}
                                            </div>
                                            <p className="text-[10px] font-bold text-gray-500 truncate leading-tight">
                                                {lastMsg ? (
                                                    <>
                                                        <span className="text-black">{lastMsg.sender_id === currentUser.id ? 'Vous: ' : ''}</span>
                                                        {lastMsg.content}
                                                    </>
                                                ) : (
                                                    <span className="text-gray-400 italic">Nouvelle conversation</span>
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default FloatingChat;