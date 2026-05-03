import { useState, useEffect } from 'react';
import axios from 'axios';

const EmployeList = ({ token, refreshTrigger }) => {
    const [employes, setEmployes] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        axios.get('http://127.0.0.1:8000/api/accounts/employes/', {
            headers: { Authorization: `Bearer ${token}` }
        }).then(r => setEmployes(r.data))
          .catch(e => console.error(e))
          .finally(() => setLoading(false));
    }, [token, refreshTrigger]);

    if (loading) return <div className="text-center py-20 font-black uppercase tracking-widest">Chargement...</div>;

    return (
        <div className="bg-white border-2 border-black rounded-xl p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
            <div className="mb-8 border-b border-gray-200 pb-6 flex justify-between items-end">
                <h2 className="text-2xl font-black tracking-tighter text-black flex items-center gap-3">
                    Annuaire Smart Enterprise
                </h2>
                <div className="px-5 py-3 border-2 border-black rounded-xl bg-yellow-300 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <span className="block text-2xl font-black font-mono leading-none">{employes.length}</span>
                    <span className="text-[10px] font-black uppercase">Membres</span>
                </div>
            </div>

            <div className="space-y-3">
                {employes.map((emp) => (
                    <div key={emp.id} className="bg-white border-2 border-gray-200 rounded-xl p-4 hover:border-black hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <img src={`https://ui-avatars.com/api/?name=${emp.username}&background=000&color=fff`} className="w-11 h-11 rounded-full border-2 border-black" />
                            <div>
                                <h4 className="font-black text-black leading-tight flex items-center gap-2">
                                    {emp.username}
                                    {emp.role === 'RH' && <span className="bg-blue-100 text-[9px] px-1.5 py-0.5 rounded border border-blue-400">RH</span>}
                                </h4>
                                <p className="text-xs text-gray-500 font-bold uppercase">{emp.poste_titre}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="text-right hidden md:block">
                                <span className="block font-mono font-black text-xs">{emp.matricule}</span>
                                <span className="text-[10px] font-bold text-gray-400 uppercase">Matricule</span>
                            </div>
                            <span className="px-3 py-1 bg-black text-white text-[10px] font-black uppercase rounded-lg">
                                {emp.departement_nom || 'Non assigné'}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default EmployeList;