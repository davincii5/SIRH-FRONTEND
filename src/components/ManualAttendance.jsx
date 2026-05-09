import { useState, useEffect } from 'react';
import axios from 'axios';

const ManualAttendance = ({ token }) => {
    const [employes, setEmployes] = useState([]);
    const [grid, setGrid] = useState({});

    // --- CONFIGURATION DU CALENDRIER (Mai 2026) ---
    const annee = 2026;
    const mois = 4; 
    const joursDansMois = new Date(annee, mois + 1, 0).getDate();
    const days = Array.from({ length: joursDansMois }, (_, i) => i + 1);

    const getJourSemaine = (jour) => {
        const date = new Date(annee, mois, jour);
        return date.toLocaleDateString('fr-FR', { weekday: 'short' }).charAt(0).toUpperCase();
    };

    const isWeekend = (jour) => {
        const date = new Date(annee, mois, jour);
        return date.getDay() === 0; // 0 = Dimanche
    };

    useEffect(() => {
        // 1. Récupérer TOUS les employés (sans aucun filtre)
        axios.get('http://127.0.0.1:8000/api/accounts/employes/', {
            headers: { Authorization: `Bearer ${token}` }
        })
        .then(res => {
            // On met directement res.data pour afficher tout le monde !
            setEmployes(res.data); 
        })
        .catch(err => console.error(err));

        // 2. Récupérer la mémoire des bulles cliquées
        axios.get('http://127.0.0.1:8000/api/payroll/presences-manuelles/toggle/?mois=5&annee=2026', {
            headers: { Authorization: `Bearer ${token}` }
        })
        .then(res => setGrid(res.data))
        .catch(err => console.error(err));
        
    }, [token]);

    const handleBubbleClick = (employeId, day) => {
        const key = `${employeId}-${day}`;
        const repos = isWeekend(day);
        
        // 👇 NOUVEAU : Le statut par défaut est ABSENT (Rouge) pour la semaine
        const currentStatut = grid[key] || (repos ? 'REPOS' : 'ABSENT');
        let nextStatut;

        if (repos) {
            nextStatut = currentStatut === 'REPOS' ? 'SUPP' : 'REPOS';
        } else {
            // 👇 NOUVELLE LOGIQUE DE CLIC (Absent -> Présent -> Supp -> Repos)
            if (currentStatut === 'ABSENT') nextStatut = 'PRESENT';
            else if (currentStatut === 'PRESENT') nextStatut = 'SUPP';
            else if (currentStatut === 'SUPP') nextStatut = 'REPOS';
            else nextStatut = 'ABSENT';
        }

        setGrid(prev => ({ ...prev, [key]: nextStatut }));

        const formattedDate = `${annee}-05-${day.toString().padStart(2, '0')}`;

        axios.post('http://127.0.0.1:8000/api/payroll/presences-manuelles/toggle/', {
            employe_id: employeId,
            date_jour: formattedDate,
            statut: nextStatut
        }, { headers: { Authorization: `Bearer ${token}` } })
        .catch(err => alert("Erreur lors de la sauvegarde du statut."));
    };

    const getBubbleColor = (statut) => {
        if (statut === 'REPOS') return 'bg-gray-300 border-gray-400 hover:bg-gray-400';
        if (statut === 'ABSENT') return 'bg-red-500 hover:bg-red-400';
        if (statut === 'SUPP') return 'bg-yellow-400 hover:bg-yellow-300';
        return 'bg-green-500 hover:bg-green-400'; 
    };

    const handleSauvegarder = () => {
        alert("✅ Présences validées ! Allez dans 'Gestion Paie' pour calculer les salaires.");
    };

    const handleReset = () => {
        if (window.confirm("⚠️ Attention : Voulez-vous effacer toutes les saisies de Mai 2026 ?")) {
            axios.delete('http://127.0.0.1:8000/api/payroll/presences-manuelles/toggle/?mois=5&annee=2026', {
                headers: { Authorization: `Bearer ${token}` }
            })
            .then(res => {
                setGrid({}); 
                alert("Mois réinitialisé. Tout le monde est ABSENT par défaut !");
            })
            .catch(err => alert("Erreur lors de la réinitialisation."));
        }
    };

    return (
        <div className="bg-white border-4 border-black p-6 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex justify-between items-end mb-6 border-b-4 border-black pb-4">
                <h2 className="text-3xl font-black uppercase italic">Saisie des Présences (Mai 2026)</h2>
                <div className="flex gap-4 text-xs font-black uppercase">
                    <div className="flex items-center gap-1"><div className="w-4 h-4 rounded-full bg-green-500 border-2 border-black"></div> Présent</div>
                    <div className="flex items-center gap-1"><div className="w-4 h-4 rounded-full bg-red-500 border-2 border-black"></div> Absent</div>
                    <div className="flex items-center gap-1"><div className="w-4 h-4 rounded-full bg-yellow-400 border-2 border-black"></div> Supp / Férié</div>
                    <div className="flex items-center gap-1"><div className="w-4 h-4 rounded-full bg-gray-300 border-2 border-gray-400"></div> Repos</div>
                </div>
            </div>

            <div className="overflow-x-auto border-4 border-black">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr>
                            <th className="p-3 border-r-4 border-b-4 border-black bg-yellow-300 font-black uppercase text-sm sticky left-0 z-20 min-w-[150px]">
                                Employé
                            </th>
                            {days.map(d => {
                                const repos = isWeekend(d);
                                return (
                                    <th key={d} className={`p-1 border-r-4 border-b-4 border-black text-center font-black text-xs min-w-[40px] ${repos ? 'bg-gray-800 text-white' : 'bg-gray-200 text-black'}`}>
                                        <div className="text-[10px] opacity-80">{getJourSemaine(d)}</div>
                                        <div className="text-sm">{d}</div>
                                    </th>
                                );
                            })}
                        </tr>
                    </thead>
                    <tbody>
                        {employes.map(emp => (
                            <tr key={emp.id} className="hover:bg-gray-50 transition-colors">
                                <td className="p-3 border-r-4 border-b-4 border-black font-black uppercase sticky left-0 bg-white z-10 text-xs">
                                    {emp.username}
                                </td>
                                {days.map(d => {
                                    const repos = isWeekend(d);
                                    const key = `${emp.id}-${d}`;
                                    // 👇 NOUVEAU : ABSENT PAR DÉFAUT
                                    const statut = grid[key] || (repos ? 'REPOS' : 'ABSENT'); 
                                    
                                    return (
                                        <td key={d} className={`p-1 border-r-4 border-b-4 border-black text-center ${repos ? 'bg-gray-100' : 'bg-white'}`}>
                                            <button 
                                                onClick={() => handleBubbleClick(emp.id, d)}
                                                className={`w-6 h-6 rounded-full border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-1 transition-all mx-auto block ${getBubbleColor(statut)}`}
                                                title={`${emp.username} - ${getJourSemaine(d)} ${d} : ${statut}`}
                                            ></button>
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            
            <div className="mt-6 flex gap-4">
                <button 
                    onClick={handleSauvegarder}
                    className="bg-black text-white px-6 py-3 font-black uppercase border-4 border-black hover:bg-green-500 transition-colors shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none"
                >
                    💾 Valider les Présences
                </button>
                
                <button 
                    onClick={handleReset}
                    className="bg-red-500 text-white px-6 py-3 font-black uppercase border-4 border-black hover:bg-red-600 transition-colors shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none"
                >
                    🗑️ Réinitialiser le mois
                </button>
            </div>
        </div>
    );
};

export default ManualAttendance;