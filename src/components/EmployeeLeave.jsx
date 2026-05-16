import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { CheckCircle2, XCircle } from 'lucide-react';

// 👇 TOAST COMPONENT
const Toast = ({ message, type, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(() => onClose(), 3000);
        return () => clearTimeout(timer);
    }, [onClose]);

    const styles = {
        success: 'bg-green-400 border-black text-black',
        error: 'bg-red-500 border-black text-white'
    };

    const icons = {
        success: <CheckCircle2 className="w-5 h-5" />,
        error: <XCircle className="w-5 h-5" />
    };

    return (
        <div className={`fixed top-6 right-6 z-[9999] flex items-center gap-3 px-5 py-3 border-4 font-black text-sm uppercase tracking-wider shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] animate-in slide-in-from-right-full fade-in duration-300 ${styles[type]}`}>
            {icons[type]}
            <span>{message}</span>
            <button onClick={onClose} className="ml-2 font-black hover:scale-110 transition-transform">✕</button>
        </div>
    );
};

const EmployeeLeave = ({ token, currentUser }) => {
    const [conges, setConges] = useState([]);
    const [toast, setToast] = useState(null);
    const [formData, setFormData] = useState({
        type_conge: 'ANNUEL',
        date_debut: '',
        date_fin: '',
        motif: ''
    });

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
    };

    const fetchConges = useCallback(() => {
        axios.get('http://127.0.0.1:8000/api/payroll/conges/', {
            headers: { Authorization: `Bearer ${token}` }
        })
        .then(res => {
            const currentUserId = currentUser?.id || currentUser?.user_id;
            const mesConges = res.data.filter(c => {
                if (c.employe === currentUserId) return true;
                if (c.employe && typeof c.employe === 'object' && c.employe.id === currentUserId) return true;
                if (c.employe_nom === currentUser?.username) return true;
                return false;
            });
            setConges(mesConges);
        })
        .catch(err => {
            console.error("Erreur lors du chargement des congés:", err);
            showToast('Erreur de chargement des congés', 'error');
        });
    }, [token, currentUser]);

    useEffect(() => {
        if (currentUser) fetchConges();
    }, [fetchConges, currentUser]);

    const handleSubmit = (e) => {
        e.preventDefault();
        
        axios.post('http://127.0.0.1:8000/api/payroll/conges/', 
            formData, 
            { headers: { Authorization: `Bearer ${token}` } }
        )
        .then(() => {
            showToast("Demande envoyée avec succès !", 'success');
            fetchConges();
            setFormData({ type_conge: 'ANNUEL', date_debut: '', date_fin: '', motif: '' }); 
        })
        .catch(err => {
            const msg = err.response?.data?.detail || err.response?.data?.error || "Erreur lors de l'envoi. Vérifiez les dates.";
            showToast(msg, 'error');
        });
    };

    return (
        <div className="flex flex-col gap-8 relative">
            {/* 👇 TOAST RENDU */}
            {toast && (
                <Toast 
                    message={toast.message} 
                    type={toast.type} 
                    onClose={() => setToast(null)} 
                />
            )}

            {/* FORMULAIRE DE DEMANDE */}
            <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                <h2 className="text-2xl font-black uppercase mb-4 italic">Nouvelle Demande de Congé</h2>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                            <label className="font-bold uppercase text-xs">Type</label>
                            <select className="w-full border-2 border-black p-2 font-bold uppercase" 
                                value={formData.type_conge} onChange={(e) => setFormData({...formData, type_conge: e.target.value})}>
                                <option value="ANNUEL">Congé Annuel</option>
                                <option value="MALADIE">Congé Maladie</option>
                                <option value="EXCEPTIONNEL">Congé Exceptionnel</option>
                            </select>
                        </div>
                        <div className="flex-1">
                            <label className="font-bold uppercase text-xs">Début</label>
                            <input type="date" required className="w-full border-2 border-black p-2 font-bold" 
                                value={formData.date_debut} onChange={(e) => setFormData({...formData, date_debut: e.target.value})} />
                        </div>
                        <div className="flex-1">
                            <label className="font-bold uppercase text-xs">Fin</label>
                            <input type="date" required className="w-full border-2 border-black p-2 font-bold" 
                                value={formData.date_fin} onChange={(e) => setFormData({...formData, date_fin: e.target.value})} />
                        </div>
                    </div>
                    <div>
                        <label className="font-bold uppercase text-xs">Motif (Optionnel)</label>
                        <textarea className="w-full border-2 border-black p-2" rows="2"
                            value={formData.motif} onChange={(e) => setFormData({...formData, motif: e.target.value})} />
                    </div>
                    <button type="submit" className="bg-yellow-300 border-4 border-black p-3 font-black uppercase hover:bg-yellow-400 transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] self-start active:translate-y-1 active:shadow-none">
                        Envoyer la demande
                    </button>
                </form>
            </div>

            {/* HISTORIQUE DES DEMANDES */}
            <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                <h2 className="text-2xl font-black uppercase mb-4 italic">Mon Historique</h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse border-4 border-black">
                        <thead>
                            <tr className="bg-gray-200 border-b-4 border-black text-xs uppercase">
                                <th className="p-3 border-r-4 border-black">Type</th>
                                <th className="p-3 border-r-4 border-black">Période</th>
                                <th className="p-3">Statut</th>
                            </tr>
                        </thead>
                        <tbody>
                            {conges.length === 0 ? (
                                <tr>
                                    <td colSpan="3" className="p-6 text-center font-bold italic text-gray-500 uppercase">
                                        Vous n'avez fait aucune demande de congé.
                                    </td>
                                </tr>
                            ) : (
                                conges.map((c) => (
                                    <tr key={c.id} className="border-b-4 last:border-b-0 border-black font-bold hover:bg-gray-50">
                                        <td className="p-3 border-r-4 border-black uppercase">{c.type_conge}</td>
                                        <td className="p-3 border-r-4 border-black">Du {c.date_debut} au {c.date_fin}</td>
                                        <td className="p-3">
                                            <span className={`px-2 py-1 text-xs border-2 border-black text-white ${
                                                c.statut === 'APPROUVE' ? 'bg-green-500' : c.statut === 'REFUSE' ? 'bg-red-500' : 'bg-gray-500 text-black'
                                            }`}>
                                                {c.statut}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default EmployeeLeave;