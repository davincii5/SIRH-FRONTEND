import { useState, useEffect } from 'react';
import axios from 'axios';

const DepartementList = ({ token }) => {
    const [departements, setDepartements] = useState([]);
    const [newDept, setNewDept] = useState({ nom_departement: '', description: '' });
    const [loading, setLoading] = useState(true);

    const fetchDepartements = () => {
        axios.get('http://127.0.0.1:8000/api/organization/departements/', {
            headers: { Authorization: `Bearer ${token}` }
        })
        .then(res => setDepartements(res.data))
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchDepartements();
    }, [token]);

    const handleAddDepartement = async (e) => {
        e.preventDefault();
        try {
            await axios.post('http://127.0.0.1:8000/api/organization/departements/', newDept, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNewDept({ nom_departement: '', description: '' });
            fetchDepartements(); // Rafraîchir la liste
        } catch (err) {
            alert("Erreur lors de la création du département.");
        }
    };

    if (loading) return <div className="p-10 font-black uppercase">Chargement...</div>;

    const inputClass = "w-full border-2 border-black p-3 font-bold outline-none focus:bg-yellow-50 mb-4";

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Colonne de gauche : Formulaire d'ajout rapide */}
            <div className="lg:col-span-1">
                <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                    <h3 className="text-xl font-black uppercase mb-4 italic border-b-4 border-black pb-2">
                        Nouveau Département
                    </h3>
                    <form onSubmit={handleAddDepartement}>
                        <input 
                            placeholder="Nom (ex: Informatique)" 
                            value={newDept.nom_departement}
                            onChange={e => setNewDept({...newDept, nom_departement: e.target.value})}
                            required 
                            className={inputClass}
                        />
                        <textarea 
                            placeholder="Description de l'activité..." 
                            value={newDept.description}
                            onChange={e => setNewDept({...newDept, description: e.target.value})}
                            className={`${inputClass} resize-none h-24`}
                        />
                        <button type="submit" className="w-full bg-black text-white p-3 font-black uppercase shadow-[4px_4px_0px_0px_rgba(34,197,94,1)] hover:translate-y-1 hover:shadow-none transition-all">
                            Créer
                        </button>
                    </form>
                </div>
            </div>

            {/* Colonne de droite : Liste des départements */}
            <div className="lg:col-span-2">
                <div className="bg-white border-4 border-black p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] min-h-[400px]">
                    <div className="flex justify-between items-center mb-8 border-b-4 border-black pb-4">
                        <h2 className="text-3xl font-black uppercase italic">Structure Organisationnelle</h2>
                        <div className="bg-yellow-300 border-2 border-black px-4 py-1 font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                            {departements.length} PÔLES
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {departements.map(dept => (
                            <div key={dept.id} className="p-5 border-4 border-black bg-gray-50 hover:bg-yellow-100 transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] group">
                                <h4 className="font-black uppercase text-xl mb-1">{dept.nom_departement}</h4>
                                <p className="text-xs font-bold text-gray-500 uppercase">{dept.description || 'Aucune description'}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            
        </div>
    );
};

export default DepartementList;