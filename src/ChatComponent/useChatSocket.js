import { useState, useEffect, useRef, useCallback } from 'react';

const WS_URL = 'ws://127.0.0.1:8000/ws/chat/';

export const useChatSocket = (token) => {
    const [lastMessage, setLastMessage] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const wsRef = useRef(null);
    const retryCount = useRef(0);
    const maxRetries = 10;
    const timeoutRef = useRef(null);
    const messageCount = useRef(0);
    const isCleaningUp = useRef(false);  // ← EVITE FERMETURE INVOLONTAIRE

    const addMessage = useCallback((data) => {
        messageCount.current += 1;
        setLastMessage({ ...data, _wsId: messageCount.current, _ts: Date.now() });
    }, []);

    useEffect(() => {
        if (!token) return;
        
        let isMounted = true;
        let ws = null;
        let heartbeatInterval = null;

        const connect = () => {
            if (!isMounted) return;
            if (retryCount.current >= maxRetries) {
                console.error("❌ WS: Max retries atteint");
                setIsConnected(false);
                return;
            }
            
            const wsUrl = `${WS_URL}?token=${token}`;
            console.log(`🔌 WS Connexion: ${wsUrl.substring(0, 80)}...`);
            
            ws = new WebSocket(wsUrl);
            wsRef.current = ws;

            ws.onopen = () => {
                if (!isMounted) return;
                retryCount.current = 0;
                setIsConnected(true);
                console.log("🟢 WS Connecté ✅");
                
                // Heartbeat simple pour garder la connexion
                heartbeatInterval = setInterval(() => {
                    if (ws.readyState === WebSocket.OPEN) {
                        ws.send(JSON.stringify({ type: "ping" }));
                    }
                }, 25000);
            };

            ws.onmessage = (event) => {
                if (!isMounted) return;
                try {
                    const data = JSON.parse(event.data);
                    // Ignorer les pong du serveur
                    if (data.type === 'pong') return;
                    console.log("📩 WS reçu:", data);
                    addMessage(data);
                } catch (e) {
                    console.error("Format WS invalide:", event.data);
                }
            };

            ws.onclose = (event) => {
                if (!isMounted || isCleaningUp.current) return;
                setIsConnected(false);
                if (heartbeatInterval) clearInterval(heartbeatInterval);
                
                console.log(`⚪ WS Fermé (code: ${event.code}, wasClean: ${event.wasClean})`);
                if (event.code === 1000 && event.wasClean) return;
                
                retryCount.current += 1;
                const delay = Math.min(1500 * retryCount.current, 10000);
                console.log(`⏳ Retry ${retryCount.current}/${maxRetries} dans ${delay}ms`);
                timeoutRef.current = setTimeout(connect, delay);
            };
            
            ws.onerror = (err) => {
                console.error("🔴 WS Erreur:", err.type);
                // Ne pas fermer ici, laisser onclose gérer
            };
        };

        connect();

        return () => {
            console.log("🧹 Cleanup useChatSocket");
            isMounted = false;
            isCleaningUp.current = true;
            if (heartbeatInterval) clearInterval(heartbeatInterval);
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.close(1000, "Cleanup");
            }
            isCleaningUp.current = false;
        };
    }, [token, addMessage]);

    return { lastMessage, isConnected };
};