import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const HRLeaveManagement = ({ token }) => {
    const [conges, setConges] = useState([]);

    const fetchConges = useCallback(() => {
        axios.get('http://127.0.0.1:8000/api/payroll/conges/', {
            headers: { Authorization: `Bearer ${token}` }
        })
        .then(res => setConges(res.data))
        .catch(err => console.error(err));
    }, [token]);

    useEffect(() => {
        fetchConges();
    }, [fetchConges]);

    const handleValidation = (id, nouveauStatut) => {
        console.log(`Tentative de validation : ${id} -> ${nouveauStatut}`);
        
        axios.patch(`http://127.0.0.1:8000/api/payroll/conges/${id}/`, 
            { statut: nouveauStatut },
            { headers: { 
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json' // Très important pour les PATCH
            } }
        )
        .then((res) => {
            console.log("Validation réussie :", res.data);
            alert(`Congé ${nouveauStatut} avec succès !`);
            fetchConges(); // On rafraîchit la liste pour voir le changement
        })
        .catch(err => {
            console.error("Erreur complète :", err.response || err);
            alert(`Erreur de validation: ${err.response?.data?.error || 'Vérifiez la console'}`);
        });
    };

    return (
        <div className="bg-white border-4 border-black p-6 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
            <h2 className="text-3xl font-black uppercase mb-6 italic">Validation des Congés</h2>
            
            <div className="overflow-x-auto border-4 border-black">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-yellow-300 border-b-4 border-black text-xs md:text-sm uppercase tracking-widest">
                            <th className="p-4 border-r-4 border-black font-black">Employé</th>
                            <th className="p-4 border-r-4 border-black font-black">Type & Motif</th>
                            <th className="p-4 border-r-4 border-black font-black">Période</th>
                            <th className="p-4 font-black text-center">Action / Statut</th>
                        </tr>
                    </thead>
                    <tbody>
                        {conges.length === 0 ? (
                            <tr><td colSpan="4" className="p-10 text-center font-black uppercase italic">Aucune demande trouvée.</td></tr>
                        ) : (
                            conges.map((c) => (
                                <tr key={c.id} className="border-b-4 last:border-b-0 border-black hover:bg-gray-50 transition-colors">
                                    <td className="p-4 border-r-4 border-black font-black uppercase">
                                        {c.employe_nom}
                                    </td>
                                    <td className="p-4 border-r-4 border-black">
                                        <div className="font-bold uppercase">{c.type_conge}</div>
                                        <div className="text-xs text-gray-500 italic mt-1">{c.motif || "Aucun motif fourni"}</div>
                                    </td>
                                    <td className="p-4 border-r-4 border-black font-bold">
                                        {c.date_debut} ➔ {c.date_fin}
                                    </td>
                                    <td className="p-4 text-center">
                                        {c.statut === 'EN_ATTENTE' ? (
                                            <div className="flex justify-center gap-2">
                                                <button onClick={() => handleValidation(c.id, 'APPROUVE')} 
                                                    className="bg-green-400 border-2 border-black px-3 py-1 font-black uppercase hover:bg-green-500 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                                    ✅ Oui
                                                </button>
                                                <button onClick={() => handleValidation(c.id, 'REFUSE')} 
                                                    className="bg-red-400 border-2 border-black px-3 py-1 font-black uppercase hover:bg-red-500 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-white">
                                                    ❌ Non
                                                </button>
                                            </div>
                                        ) : (
                                            <span className={`px-3 py-1 text-[10px] font-black uppercase border-2 border-black text-white ${
                                                c.statut === 'APPROUVE' ? 'bg-green-600' : 'bg-red-600'
                                            }`}>
                                                {c.statut}
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default HRLeaveManagement;