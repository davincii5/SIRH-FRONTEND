import { useState, useEffect } from 'react';
import axios from 'axios';

const AddEmploye = ({ token, onEmployeAdded }) => {
    const [departements, setDepartements] = useState([]);
    const [formData, setFormData] = useState({
        username: '', email: '', password: '', 
        matricule: '', poste_titre: '', 
        departement: '', est_manager: false
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        axios.get('http://127.0.0.1:8000/api/organization/departements/', {
            headers: { Authorization: `Bearer ${token}` }
        }).then(res => setDepartements(res.data))
          .catch(err => console.error("Erreur depps:", err));
    }, [token]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({ 
            ...formData, 
            [name]: type === 'checkbox' ? checked : value 
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await axios.post('http://127.0.0.1:8000/api/accounts/create-employe/', formData,
                { headers: { Authorization: `Bearer ${token}` } });
            onEmployeAdded();
            setFormData({ username: '', email: '', password: '', matricule: '', poste_titre: '', departement: '', est_manager: false });
        } catch (err) {
            setError("Échec de la création. Vérifiez que le matricule est unique.");
        } finally {
            setLoading(false);
        }
    };

    const inputClass = "w-full bg-gray-50 border-2 border-gray-200 rounded-lg p-3 text-black font-bold outline-none focus:bg-white focus:border-black transition-all duration-200 placeholder:text-gray-400";
    const labelClass = "block text-xs font-black uppercase tracking-widest text-black mb-2";

    return (
        <div className="bg-white border-2 border-black rounded-xl p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
            <div className="mb-8 border-b border-gray-200 pb-6 flex items-center gap-4">
                <div className="bg-black p-3 border-2 border-black rounded-xl flex-shrink-0">
                    <svg className="w-6 h-6" fill="none" stroke="white" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                </div>
                <div>
                    <h3 className="text-2xl font-black tracking-tighter text-black">Ajouter un Employé</h3>
                    <p className="text-xs font-black uppercase tracking-widest text-black mt-0.5">Configuration du profil et affectation</p>
                </div>
            </div>

            {error && <div className="mb-6 p-3 bg-red-50 border-2 border-red-500 text-red-600 text-sm font-bold rounded-lg">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="group">
                        <label className={labelClass}>Nom d'utilisateur</label>
                        <input name="username" type="text" value={formData.username} onChange={handleChange} required className={inputClass} />
                    </div>
                    <div className="group">
                        <label className={labelClass}>Adresse Email</label>
                        <input name="email" type="email" value={formData.email} onChange={handleChange} required className={inputClass} />
                    </div>
                </div>

                <div className="group">
                    <label className={labelClass}>Mot de passe</label>
                    <input name="password" type="password" value={formData.password} onChange={handleChange} required className={inputClass} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="group">
                        <label className={labelClass}>Département</label>
                        <select name="departement" value={formData.departement} onChange={handleChange} required className={inputClass}>
                            <option value="">Sélectionner...</option>
                            {departements.map(dept => (
                                <option key={dept.id} value={dept.id}>{dept.nom_departement}</option>
                            ))}
                        </select>
                    </div>
                    <div className="group">
                        <label className={labelClass}>Poste occupé</label>
                        <input name="poste_titre" type="text" value={formData.poste_titre} onChange={handleChange} required className={inputClass} />
                    </div>
                </div>

                <div className="group p-4 border-2 border-black rounded-lg bg-yellow-50 flex items-center justify-between">
                    <div>
                        <label className="font-black text-xs uppercase text-black">Désigner comme Manager ?</label>
                        <p className="text-[10px] font-bold text-gray-500">L'employé deviendra le chef officiel du département choisi.</p>
                    </div>
                    <input name="est_manager" type="checkbox" checked={formData.est_manager} onChange={handleChange} className="w-6 h-6 accent-black cursor-pointer" />
                </div>

                <div className="flex gap-3 pt-2">
                    <button type="submit" disabled={loading} className="flex-1 bg-black text-white font-bold py-3 rounded-lg border-2 border-black hover:bg-gray-800 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex justify-center items-center gap-2">
                        {loading ? 'Enregistrement...' : 'Confirmer la création'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AddEmploye;