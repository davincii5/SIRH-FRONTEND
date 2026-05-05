import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const AttendanceDashboard = ({ token }) => {
    const [pointages, setPointages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fonction de récupération mémorisée pour éviter les re-rendus inutiles
    const fetchPointages = useCallback(() => {
        axios.get('http://127.0.0.1:8000/api/attendance/pointages/', {
            headers: { Authorization: `Bearer ${token}` }
        })
        .then(res => setPointages(res.data))
        .catch(err => {
            console.error("Erreur de chargement", err);
            setError("Impossible de charger les données IoT.");
        })
        .finally(() => setLoading(false));
    }, [token]);

    useEffect(() => {
        fetchPointages(); // Chargement initial
        
        // Polling : on rafraîchit toutes les 5 secondes pour le "Temps Réel"
        const interval = setInterval(fetchPointages, 5000);
        
        return () => clearInterval(interval); // Nettoyage
    }, [fetchPointages]);

    const checkRetard = (dateString, type) => {
        // Normalisation de la casse pour matcher l'IoT (ENTREE/entrée)
        if (!type || type.toUpperCase() !== 'ENTREE') return false;
        
        const pointageDate = new Date(dateString);
        // Règle : Retard si > 09:00:00
        return pointageDate.getHours() > 9 || (pointageDate.getHours() === 9 && pointageDate.getMinutes() > 0);
    };

    if (loading) return <div className="p-10 font-black uppercase text-xl animate-pulse text-center">Synchronisation avec les terminaux IoT...</div>;

    return (
        <div className="bg-white border-4 border-black p-6 md:p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b-4 border-black pb-4 mb-6 gap-4">
                <div>
                    <h2 className="text-3xl font-black uppercase italic">Flux IoT Temps Réel</h2>
                    <p className="font-bold text-gray-600 mt-1 uppercase tracking-widest text-xs">Surveillance HiveMQ Cloud</p>
                </div>
                <div className="bg-green-400 border-2 border-black px-4 py-2 font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center gap-3">
                    <div className="w-3 h-3 bg-white border border-black rounded-full animate-ping"></div>
                    CAPTEURS EN LIGNE
                </div>
            </div>

            {error && <div className="mb-6 p-4 font-black uppercase text-red-600 bg-red-100 border-4 border-black">{error}</div>}
            
            <div className="overflow-x-auto border-4 border-black">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-yellow-300 border-b-4 border-black text-xs md:text-sm uppercase tracking-widest">
                            <th className="p-4 border-r-4 border-black font-black">Date & Heure</th>
                            <th className="p-4 border-r-4 border-black font-black">Collaborateur</th>
                            <th className="p-4 border-r-4 border-black font-black">Mouvement</th>
                            <th className="p-4 font-black">Statut</th>
                        </tr>
                    </thead>
                    <tbody>
                        {pointages.length === 0 ? (
                            <tr><td colSpan="4" className="p-10 text-center font-black uppercase italic">Aucune donnée reçue.</td></tr>
                        ) : (
                            pointages.map((p) => {
                                const isLate = checkRetard(p.timestamp, p.type_pointage);
                                const dateObj = new Date(p.timestamp);
                                return (
                                    <tr key={p.id} className="border-b-4 last:border-b-0 border-black hover:bg-gray-50 transition-colors">
                                        <td className="p-4 border-r-4 border-black font-bold">
                                            {dateObj.toLocaleDateString('fr-FR')} 
                                            <span className="ml-2 font-black bg-black text-white px-2 py-0.5">
                                                {dateObj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </td>
                                        <td className="p-4 border-r-4 border-black">
                                            <div className="font-black uppercase">{p.employe_nom}</div>
                                            <div className="text-[10px] font-bold text-gray-400">ID: {p.matricule_display || p.employe}</div>
                                        </td>
                                        <td className="p-4 border-r-4 border-black">
                                            <span className={`px-3 py-1 text-[10px] font-black uppercase border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${
                                                p.type_pointage?.toUpperCase() === 'ENTREE' ? 'bg-blue-300' : 'bg-gray-200'
                                            }`}>
                                                {p.type_pointage}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            {isLate ? (
                                                <span className="bg-red-500 text-white px-3 py-1 text-[10px] font-black border-2 border-black animate-pulse">⚠️ RETARD</span>
                                            ) : (
                                                <span className="bg-white text-black px-3 py-1 text-[10px] font-black border-2 border-black uppercase">Conforme</span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AttendanceDashboard;