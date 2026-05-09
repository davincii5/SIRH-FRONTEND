import { useState, useEffect } from 'react';
import axios from 'axios';

const AttendanceDashboard = ({ token }) => {
    const [pointages, setPointages] = useState([]);

    const fetchPointages = () => {
        axios.get('http://127.0.0.1:8000/api/attendance/pointages/', {
            headers: { Authorization: `Bearer ${token}` }
        })
        .then(res => {
            // 👇 PLUS DE FILTRE : On affiche directement tous les employés de l'entreprise
            setPointages(res.data);
        })
        .catch(err => console.error(err));
    };

    useEffect(() => {
        fetchPointages();
        const interval = setInterval(fetchPointages, 3000); // Refresh toutes les 3s
        return () => clearInterval(interval);
    }, [token]);

    const handleClearHistory = () => {
        if (window.confirm("Voulez-vous supprimer tous les anciens pointages de test ?")) {
            axios.delete('http://127.0.0.1:8000/api/attendance/pointages/', {
                headers: { Authorization: `Bearer ${token}` }
            })
            .then(() => {
                setPointages([]);
                alert("Historique vidé !");
            });
        }
    };

    return (
        <div className="bg-white border-4 border-black p-6 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex justify-between items-center mb-8 border-b-4 border-black pb-4">
                <h2 className="text-3xl font-black uppercase italic">Flux IoT Temps Réel</h2>
                <button 
                    onClick={handleClearHistory}
                    className="bg-red-500 text-white border-4 border-black px-4 py-2 font-black uppercase hover:bg-black transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none"
                >
                    🗑️ Vider l'historique
                </button>
            </div>

            <div className="overflow-x-auto border-4 border-black">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-yellow-300 border-b-4 border-black font-black uppercase text-sm">
                            <th className="p-4 border-r-4 border-black">Date & Heure</th>
                            <th className="p-4 border-r-4 border-black">Collaborateur</th>
                            <th className="p-4 border-r-4 border-black text-center">Mouvement</th>
                            <th className="p-4 text-center">Statut</th>
                        </tr>
                    </thead>
                    <tbody>
                        {pointages.length === 0 ? (
                            <tr><td colSpan="4" className="p-10 text-center font-black italic uppercase">En attente de pointage Wokwi...</td></tr>
                        ) : (
                            pointages.map((p, index) => {
                                // 👇 LA LOGIQUE D'INTELLIGENCE ARTIFICIELLE (Règles RH) 👇
                                const datePointage = new Date(p.timestamp);
                                const heure = datePointage.getHours();
                                
                                // Si c'est une ENTRÉE et qu'il est 9h00 ou plus, c'est un RETARD
                                const estEnRetard = p.type_pointage === 'ENTREE' && heure >= 9;

                                return (
                                    <tr key={index} className="border-b-4 last:border-b-0 border-black hover:bg-gray-50 font-bold">
                                        <td className="p-4 border-r-4 border-black font-black">
                                            {datePointage.toLocaleString()}
                                        </td>
                                        <td className="p-4 border-r-4 border-black uppercase text-xs">
                                            {p.employe_name} <br/>
                                            <span className="text-gray-400">ID: {p.matricule}</span>
                                        </td>
                                        <td className="p-4 border-r-4 border-black text-center">
                                            <span className={`px-3 py-1 text-[10px] border-2 border-black ${p.type_pointage === 'ENTREE' ? 'bg-blue-200 text-blue-900' : 'bg-purple-200 text-purple-900'}`}>
                                                {p.type_pointage}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center uppercase text-[10px] font-black">
                                            {/* 👇 AFFICHAGE DYNAMIQUE DU BADGE 👇 */}
                                            {estEnRetard ? (
                                                <span className="text-red-600 bg-red-100 px-2 py-1 border-2 border-red-600">⚠️ Retard</span>
                                            ) : (
                                                <span className="text-green-600 bg-green-100 px-2 py-1 border-2 border-green-600">✅ Conforme</span>
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