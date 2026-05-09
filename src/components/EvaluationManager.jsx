import { useState, useEffect } from 'react';
import axios from 'axios';

const EvaluationManager = ({ token }) => {
    const [employes, setEmployes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);

    // États du formulaire
    const [selectedEmploye, setSelectedEmploye] = useState('');
    const [note, setNote] = useState(3);
    const [commentaire, setCommentaire] = useState('');

    // Charger la liste des employés pour le menu déroulant
    useEffect(() => {
        axios.get('http://127.0.0.1:8000/api/accounts/employes/', {
            headers: { Authorization: `Bearer ${token}` }
        })
        .then(res => setEmployes(res.data))
        .catch(err => console.error("Erreur chargement employés", err));
    }, [token]);

    const handleSubmit = (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        // La date d'aujourd'hui au format YYYY-MM-DD
        const dateEvaluation = new Date().toISOString().split('T')[0];

        const payload = {
            employe: selectedEmploye,
            date_evaluation: dateEvaluation,
            note_comportementale: note,
            commentaire: commentaire
        };

        axios.post('http://127.0.0.1:8000/api/payroll/evaluations/', payload, {
            headers: { Authorization: `Bearer ${token}` }
        })
        .then(() => {
            setMessage({ type: 'success', text: "Évaluation enregistrée avec succès !" });
            // Reset du formulaire
            setSelectedEmploye('');
            setNote(3);
            setCommentaire('');
        })
        .catch(err => {
            console.error(err);
            setMessage({ type: 'error', text: "Erreur lors de l'enregistrement." });
        })
        .finally(() => setLoading(false));
    };

    return (
        <div className="bg-white border-4 border-black p-6 md:p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] max-w-2xl">
            <div className="border-b-4 border-black pb-4 mb-6">
                <h2 className="text-3xl font-black uppercase italic">Évaluer un Employé</h2>
                <p className="font-bold text-gray-600 mt-1 uppercase tracking-widest text-xs">Saisie des notes comportementales</p>
            </div>

            {message && (
                <div className={`mb-6 p-4 font-black uppercase border-4 border-black ${message.type === 'success' ? 'bg-green-300 text-black' : 'bg-red-500 text-white'}`}>
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                {/* Sélection de l'employé */}
                <div className="flex flex-col gap-2">
                    <label className="font-black uppercase text-sm">Collaborateur à évaluer *</label>
                    <select 
                        required
                        value={selectedEmploye}
                        onChange={(e) => setSelectedEmploye(e.target.value)}
                        className="border-4 border-black p-3 font-bold bg-gray-50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-yellow-300 transition-all"
                    >
                        <option value="" disabled>-- Choisir un employé --</option>
                        {employes.map(emp => (
                            <option key={emp.id} value={emp.id}>
                                {emp.matricule} - {emp.username.toUpperCase()}
                            </option>
                        ))}
                    </select>
                </div>

                {/* La Note */}
                <div className="flex flex-col gap-2">
                    <label className="font-black uppercase text-sm">Note / 5 *</label>
                    <input 
                        type="number" 
                        required
                        min="1" 
                        max="5" 
                        step="0.5"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        className="border-4 border-black p-3 font-black text-2xl w-32 bg-gray-50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-yellow-300 transition-all"
                    />
                    <p className="text-xs font-bold text-gray-500">Rappel : Une note ≥ 4.5 donne 10% de prime. Une note ≥ 3.5 donne 5%.</p>
                </div>

                {/* Le Commentaire */}
                <div className="flex flex-col gap-2">
                    <label className="font-black uppercase text-sm">Commentaire du Manager</label>
                    <textarea 
                        rows="4"
                        value={commentaire}
                        onChange={(e) => setCommentaire(e.target.value)}
                        placeholder="Points forts, axes d'amélioration..."
                        className="border-4 border-black p-3 font-bold bg-gray-50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-yellow-300 transition-all resize-none"
                    ></textarea>
                </div>

                {/* Bouton de soumission */}
                <button 
                    type="submit" 
                    disabled={loading}
                    className="mt-4 bg-black text-white border-4 border-black px-6 py-4 font-black text-lg uppercase transition-all shadow-[6px_6px_0px_0px_rgba(253,224,71,1)] hover:translate-x-1 hover:-translate-y-1 active:translate-x-0 active:translate-y-0 active:shadow-none"
                >
                    {loading ? 'Enregistrement...' : 'Valider l\'évaluation 🎯'}
                </button>
            </form>
        </div>
    );
};

export default EvaluationManager;