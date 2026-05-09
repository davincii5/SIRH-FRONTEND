import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const PayrollDashboard = ({ token }) => {
    const [fiches, setFiches] = useState([]);

    const fetchFiches = useCallback(() => {
        axios.get('http://127.0.0.1:8000/api/payroll/fiches/', {
            headers: { Authorization: `Bearer ${token}` }
        })
        .then(res => setFiches(res.data))
        .catch(err => console.error(err));
    }, [token]);

    useEffect(() => {
        fetchFiches();
    }, [fetchFiches]);

    const handleGenererPaie = () => {
        axios.post('http://127.0.0.1:8000/api/payroll/generer-paie/', 
            { mois: 5, annee: 2026 }, 
            { headers: { Authorization: `Bearer ${token}` } }
        )
        .then(res => {
            alert(res.data.message);
            fetchFiches(); // Rafraîchit le tableau automatiquement
        })
        .catch(err => alert("Erreur lors de la génération des fiches de paie."));
    };

    // 👇 LA NOUVELLE FONCTION DE RÉINITIALISATION 👇
    const handleResetPaie = () => {
        if (window.confirm("⚠️ DANGER : Voulez-vous vraiment supprimer définitivement TOUTES les fiches de paie de Mai 2026 ?")) {
            axios.delete('http://127.0.0.1:8000/api/payroll/generer-paie/?mois=5&annee=2026', {
                headers: { Authorization: `Bearer ${token}` }
            })
            .then(res => {
                alert(res.data.message);
                fetchFiches(); // Rafraîchit le tableau (qui sera vide)
            })
            .catch(err => alert("Erreur lors de la suppression des fiches."));
        }
    };

    return (
        <div className="bg-white border-4 border-black p-6 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <h2 className="text-3xl font-black uppercase italic">Gestion de la Paie</h2>
                
                {/* 👇 LES DEUX BOUTONS CÔTE À CÔTE 👇 */}
                <div className="flex gap-4">
                    <button 
                        onClick={handleGenererPaie}
                        className="bg-yellow-300 border-4 border-black px-4 py-2 font-black uppercase hover:bg-yellow-400 transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-1"
                    >
                        Calculer la paie (Mai 2026)
                    </button>

                    <button 
                        onClick={handleResetPaie}
                        className="bg-red-500 text-white border-4 border-black px-4 py-2 font-black uppercase hover:bg-red-600 transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-1"
                    >
                        🗑️ Vider
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto border-4 border-black">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-200 border-b-4 border-black text-xs md:text-sm uppercase tracking-widest font-black">
                            <th className="p-4 border-r-4 border-black">Employé</th>
                            <th className="p-4 border-r-4 border-black text-center">Période</th>
                            <th className="p-4 border-r-4 border-black text-right">Salaire Base</th>
                            <th className="p-4 border-r-4 border-black text-right text-red-600">Déductions (Abs)</th>
                            <th className="p-4 border-r-4 border-black text-right text-green-600">Primes (Supp)</th>
                            <th className="p-4 text-right bg-yellow-300">Net à Payer</th>
                        </tr>
                    </thead>
                    <tbody>
                        {fiches.length === 0 ? (
                            <tr><td colSpan="6" className="p-10 text-center font-black uppercase italic">Aucune fiche de paie générée.</td></tr>
                        ) : (
                            fiches.map((fiche) => (
                                <tr key={fiche.id} className="border-b-4 last:border-b-0 border-black hover:bg-gray-50 transition-colors font-bold">
                                    <td className="p-4 border-r-4 border-black uppercase">{fiche.employe}</td>
                                    <td className="p-4 border-r-4 border-black text-center">{fiche.periode_mois}/{fiche.periode_annee}</td>
                                    <td className="p-4 border-r-4 border-black text-right">{fiche.salaire_base} DH</td>
                                    <td className="p-4 border-r-4 border-black text-right text-red-500">- {fiche.deductions_absences} DH</td>
                                    <td className="p-4 border-r-4 border-black text-right text-green-500">+ {fiche.primes_supp} DH</td>
                                    <td className="p-4 text-right bg-yellow-100 font-black text-lg">{fiche.net_a_payer} DH</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default PayrollDashboard;