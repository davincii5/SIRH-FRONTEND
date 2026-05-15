import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { useChatSocket } from './useChatSocket';
import { MessageSquare, Send, UserPlus, ShieldCheck, Users } from 'lucide-react';

const API_URL = 'http://127.0.0.1:8000/api';

const HRChatDashboard = ({ token, currentUser }) => {
    const [conversations, setConversations] = useState([]);
    const [activeConv, setActiveConv] = useState(null);
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [allEmployees, setAllEmployees] = useState([]);
    const [showNewChat, setShowNewChat] = useState(false);
    const [selectedNewEmployeeId, setSelectedNewEmployeeId] = useState('');
    const [isGlobal, setIsGlobal] = useState(false);
    const [error, setError] = useState(null);

    const { lastMessage, isConnected } = useChatSocket(token);
    const scrollRef = useRef(null);

    const fetchConversations = useCallback(async () => {
        try {
            const res = await axios.get(`${API_URL}/chat/conversations/`, { 
                headers: { Authorization: `Bearer ${token}` }
            });
            setConversations(res.data);
        } catch (err) {
            console.error("Erreur chargement conversations:", err);
        }
    }, [token]);

    useEffect(() => {
        fetchConversations();
        axios.get(`${API_URL}/accounts/employes/`, { 
            headers: { Authorization: `Bearer ${token}` }
        })
        .then(res => setAllEmployees(res.data))
        .catch(err => console.error("Erreur chargement employés:", err));
    }, [token, fetchConversations]);

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

        if (!selectedNewEmployeeId || !inputValue.trim()) return;
        try {
            const res = await axios.post(`${API_URL}/chat/messages/send/`, {
                content: inputValue,
                receiver_ids: [selectedNewEmployeeId]
            }, { headers: { Authorization: `Bearer ${token}` }});
            
            const newMsg = res.data[0];
            if (newMsg) {
                setMessages(prev => [...prev, newMsg]);
                setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
            }
            
            setInputValue('');
            setShowNewChat(false);
            setSelectedNewEmployeeId('');
            fetchConversations();
        } catch (err) {
            setError(err.response?.data?.error || "Échec de l'envoi");
        }
    };

    // ========== CORRECTION handleReply ==========
    const handleReply = async (e) => {
        e.preventDefault();
        if (!inputValue.trim() || !activeConv) return;
        
        const text = inputValue;
        
        // Récupérer les IDs (gestion des différents formats possibles)
        const currentId = String(currentUser?.id || '');
        const hrId = String(activeConv?.hr_id || activeConv?.hr?.id || '');
        const empId = String(activeConv?.employee_id || activeConv?.employee?.id || '');
        
        // Déterminer le destinataire : celui qui N'EST PAS l'utilisateur courant
        let receiverId;
        
        // Si je suis le HR de cette conversation → envoyer à l'employé
        if (hrId === currentId && empId) {
            receiverId = empId;
        } 
        // Si je suis l'employé de cette conversation → envoyer au HR
        else if (empId === currentId && hrId) {
            receiverId = hrId;
        } 
        // Fallback : détecter par le rôle
        else {
            const isHr = ['RH', 'ADMIN', 'ADMINISTRATEUR'].includes(currentUser?.role);
            receiverId = isHr ? empId : hrId;
        }
        
        if (!receiverId) {
            setError("Impossible de déterminer le destinataire");
            console.error("DEBUG handleReply:", { currentId, hrId, empId, activeConv, currentUser });
            return;
        }

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
            console.error("Erreur envoi:", err.response?.data || err);
            setMessages(prev => prev.map(m => 
                m.id === tempId ? {...m, content: m.content + " ❌ [Échec]"} : m
            ));
            setError(err.response?.data?.error || "Échec de l'envoi");
        }
    };

    return (
        <div className="flex h-[80vh] border-4 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <div className="w-1/3 border-r-4 border-black flex flex-col bg-slate-50">
                <div className="p-4 border-b-4 border-black bg-yellow-300 flex justify-between items-center">
                    <h3 className="font-black uppercase flex items-center gap-2">
                        <MessageSquare className="w-5 h-5" /> Discussions
                        {!isConnected && <span className="text-[10px] bg-red-500 text-white px-2 py-1 rounded">Hors ligne</span>}
                    </h3>
                    <button 
                        onClick={() => { setShowNewChat(true); setActiveConv(null); }}
                        className="bg-black text-white p-2 border-2 border-white hover:bg-gray-800"
                    >
                        <UserPlus className="w-4 h-4" />
                    </button>
                </div>
                {error && (
                    <div className="bg-red-100 border-b-2 border-red-500 p-2 text-xs font-bold text-red-700 text-center">
                        {error}
                    </div>
                )}
                <div className="flex-1 overflow-y-auto p-2">
                    {conversations.length === 0 ? (
                        <p className="text-center font-bold text-xs uppercase text-gray-400 mt-10">Aucune discussion</p>
                    ) : (
                        conversations.map(conv => {
                            const isActive = activeConv?.id === conv.id;
                            const lastMsg = conv.last_message;
                            return (
                                <div 
                                    key={conv.id} 
                                    onClick={() => openConversation(conv)}
                                    className={`p-3 border-4 border-black mb-2 cursor-pointer transition-all ${
                                        isActive ? 'bg-cyan-200 translate-x-1 -translate-y-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]' : 'bg-white hover:bg-gray-100'
                                    }`}
                                >
                                    <p className="font-black text-sm uppercase">{conv.employee_name}</p>
                                    <p className="text-[10px] font-bold text-gray-500 truncate mt-1">
                                        {lastMsg ? `${lastMsg.sender_id === currentUser.id ? 'Vous' : conv.employee_name} : ${lastMsg.content}` : 'Nouvelle conversation'}
                                    </p>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
            <div className="flex-1 flex flex-col relative bg-white">
                {showNewChat ? (
                    <div className="flex-1 flex flex-col p-8">
                        <h2 className="text-2xl font-black uppercase mb-6 border-b-4 border-black pb-2">Nouveau Message</h2>
                        <label className="flex items-center gap-2 mb-4 cursor-pointer">
                            <input 
                                type="checkbox" 
                                checked={isGlobal}
                                onChange={(e) => setIsGlobal(e.target.checked)}
                                className="w-4 h-4"
                            />
                            <span className="font-bold text-sm uppercase flex items-center gap-2">
                                <Users className="w-4 h-4" /> Envoyer à TOUS les employés
                            </span>
                        </label>
                        {!isGlobal && (
                            <>
                                <label className="font-bold text-xs uppercase mb-2">Employé :</label>
                                <select 
                                    className="border-4 border-black p-3 font-bold mb-6 outline-none"
                                    value={selectedNewEmployeeId}
                                    onChange={(e) => setSelectedNewEmployeeId(e.target.value)}
                                >
                                    <option value="">-- Choisir --</option>
                                    {allEmployees.filter(emp => emp.id !== currentUser.id).map(emp => (
                                        <option key={emp.id} value={emp.id}>{emp.username}</option>
                                    ))}
                                </select>
                            </>
                        )}
                        <label className="font-bold text-xs uppercase mb-2">Message :</label>
                        <textarea 
                            className="flex-1 border-4 border-black p-3 font-bold outline-none min-h-[150px] resize-none"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder={isGlobal ? "Message global..." : "Écrivez ici..."}
                        />
                        <button 
                            onClick={handleStartNewChat}
                            disabled={!inputValue.trim() || (!isGlobal && !selectedNewEmployeeId)}
                            className="mt-6 bg-black text-white px-6 py-4 font-black uppercase hover:bg-gray-800 shadow-[4px_4px_0px_0px_rgba(253,224,71,1)] self-start disabled:opacity-50"
                        >
                            {isGlobal ? 'Envoyer à tous' : 'Envoyer'}
                        </button>
                        <button 
                            onClick={() => { setShowNewChat(false); setIsGlobal(false); setError(null); }}
                            className="mt-2 text-xs font-bold text-gray-500 uppercase hover:text-black self-start"
                        >
                            Annuler
                        </button>
                    </div>
                ) : activeConv ? (
                    <>
                        <div className="bg-purple-200 border-b-4 border-black p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="bg-white p-2 border-2 border-black">
                                    <ShieldCheck className="w-5 h-5 text-black" />
                                </div>
                                <div>
                                    <h2 className="font-black uppercase text-sm">{activeConv.employee_name}</h2>
                                    <p className="text-[10px] font-bold text-gray-600 uppercase">{isConnected ? 'En direct' : 'Déconnecté'}</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50">
                            {messages.map((msg, index) => {
                                const isMe = msg.sender_id === currentUser?.id;
                                return (
                                    <div key={msg.id || index} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                        <div className={`max-w-[70%] p-3 border-2 border-black font-bold text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${isMe ? 'bg-yellow-300' : 'bg-white'}`}>
                                            {msg.content}
                                        </div>
                                        <span className="text-[9px] font-black uppercase mt-2 text-gray-400 px-1">
                                            {isMe ? 'Vous' : msg.sender_name} • {new Date(msg.created_at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                                        </span>
                                    </div>
                                );
                            })}
                            <div ref={scrollRef} />
                        </div>
                        <form onSubmit={handleReply} className="p-4 border-t-4 border-black bg-white flex gap-3">
                            <input 
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                placeholder={`Répondre à ${activeConv.employee_name}...`}
                                className="flex-1 border-4 border-black p-3 font-bold outline-none"
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
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 opacity-50">
                        <MessageSquare className="w-16 h-16 mb-4" />
                        <h2 className="font-black text-xl uppercase mb-2">Messagerie RH</h2>
                        <p className="font-bold text-sm">Sélectionnez une discussion ou créez un message.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default HRChatDashboard;