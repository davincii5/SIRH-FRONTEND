import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, Banknote, UserCheck, TrendingUp, BellRing } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid } from 'recharts';

const DashboardAdmin = ({ token, currentUser }) => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axios.get('http://127.0.0.1:8000/api/accounts/dashboard-stats/', {
            headers: { Authorization: `Bearer ${token}` }
        })
        .then(response => {
            setStats(response.data);
            setLoading(false);
        })
        .catch(error => {
            console.error("Erreur chargement dashboard", error);
            setLoading(false);
        });
    }, [token]);

    // 👇 NOUVELLE FONCTION : Validation/Refus Rapide
    // 👇 NOUVELLE FONCTION : Validation/Refus Rapide
    const handleUpdateConge = async (id, newStatus) => {
        try {
            await axios.patch(`http://127.0.0.1:8000/api/payroll/conges/${id}/`, {
                statut: newStatus
            }, { headers: { Authorization: `Bearer ${token}` }});
            
            // Mise à jour instantanée de l'UI
            setStats(prev => ({
                ...prev,
                conges_attente: prev.conges_attente.filter(c => c.id !== id)
            }));
        } catch (error) {
            // SÉCURITÉ : On affiche l'erreur EXACTE renvoyée par Django
            console.error("Détail de l'erreur 400 :", error.response?.data);
            
            const messageErreur = error.response?.data?.statut 
                ? error.response.data.statut[0] 
                : "Les données envoyées ont été refusées par le serveur.";
                
            alert(`Impossible de passer en "${newStatus}".\nRaison : ${messageErreur}`);
        }
    };

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white border-2 border-black p-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <p className="font-black text-sm uppercase mb-1">{label}</p>
                    {payload.map((entry, index) => (
                        <p key={index} className="text-xs font-bold" style={{ color: entry.color || '#000' }}>
                            {entry.name} : {entry.value}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    if (loading) return <div className="text-center py-20 font-black tracking-widest uppercase">Chargement de la Tour de Contrôle...</div>;
    if (!stats) return <div className="text-center py-20 font-black text-red-500">Erreur de connexion radar.</div>;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* --- HEADER --- */}
            <div className="flex justify-between items-end border-b-4 border-black pb-4">
                <div>
                    <h1 className="text-4xl font-black uppercase tracking-tighter">Tour de Contrôle</h1>
                    <p className="font-bold text-gray-500 mt-1 uppercase tracking-widest text-xs">Vue Globale Smart Enterprise</p>
                </div>
                <div className="bg-purple-200 border-2 border-black px-4 py-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hidden md:flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-purple-800" />
                    <span className="font-black text-xs uppercase">Rapport du {new Date().toLocaleDateString('fr-FR')}</span>
                </div>
            </div>

            {/* --- KPI CARDS --- */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-yellow-300 border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between hover:-translate-y-1 hover:shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] transition-all">
                    <div className="flex justify-between items-start">
                        <Users className="w-8 h-8 text-black" />
                        <span className="bg-black text-white text-[10px] font-black uppercase px-2 py-1 rounded-full">
                            +{stats.kpis.nouveaux_ce_mois} ce mois
                        </span>
                    </div>
                    <div className="mt-6">
                        <h3 className="text-5xl font-black tracking-tighter">{stats.kpis.total_actifs}</h3>
                        <p className="font-bold text-sm uppercase mt-1">Employés Actifs</p>
                    </div>
                </div>

                <div className="bg-green-400 border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between hover:-translate-y-1 hover:shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] transition-all">
                    <div className="flex justify-between items-start">
                        <Banknote className="w-8 h-8 text-black" />
                    </div>
                    <div className="mt-6">
                        <h3 className="text-4xl font-black tracking-tighter">
                            {(stats.kpis.masse_salariale / 1000).toFixed(1)} K
                        </h3>
                        <p className="font-bold text-sm uppercase mt-1">Masse Salariale (DH)</p>
                    </div>
                </div>

                <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between hover:-translate-y-1 hover:shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] transition-all">
                    <div className="flex justify-between items-start">
                        <UserCheck className="w-8 h-8 text-black" />
                        {stats.kpis.absents_jour > 0 && (
                            <span className="bg-red-500 text-white text-[10px] font-black uppercase px-2 py-1 rounded-full border border-black">
                                {stats.kpis.absents_jour} Absent(s)
                            </span>
                        )}
                    </div>
                    <div className="mt-6">
                        <h3 className="text-5xl font-black tracking-tighter">{stats.kpis.taux_presence}%</h3>
                        <p className="font-bold text-sm uppercase mt-1">Taux de Présence (Ajd)</p>
                    </div>
                </div>
            </div>

            {/* --- CHARTS ROW 1 --- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                    <h3 className="font-black uppercase text-sm mb-6 border-b-2 border-gray-100 pb-2">Répartition par Département</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.charts.departements} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#000' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#000' }} />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f3f4f6' }} />
                                <Bar dataKey="effectif" fill="#000" radius={[4, 4, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col">
                    <h3 className="font-black uppercase text-sm mb-2 border-b-2 border-gray-100 pb-2">Types de Contrats</h3>
                    <div className="flex-1 min-h-[200px] flex items-center justify-center relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={stats.charts.contrats} innerRadius={60} outerRadius={80} paddingAngle={2} dataKey="value" stroke="black" strokeWidth={2}>
                                    {stats.charts.contrats.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-3xl font-black">{stats.kpis.total_actifs}</span>
                            <span className="text-[9px] font-black uppercase">Total</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- CHARTS ROW 2 (MODIFIÉE) --- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* 2/3 de l'espace : Graphique des présences */}
                <div className="lg:col-span-2 bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                    <h3 className="font-black uppercase text-sm mb-6 border-b-2 border-gray-100 pb-2">Suivi des Présences (5 Derniers Jours)</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={stats.charts.presences_semaine} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#000' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#000' }} />
                                <Tooltip content={<CustomTooltip />} />
                                <Line type="monotone" dataKey="presents" stroke="#4ade80" strokeWidth={4} dot={{ stroke: '#000', strokeWidth: 2, r: 4, fill: '#4ade80' }} activeDot={{ r: 6, stroke: '#000', strokeWidth: 2 }} name="Présents" />
                                <Line type="monotone" dataKey="absents" stroke="#ef4444" strokeWidth={4} dot={{ stroke: '#000', strokeWidth: 2, r: 4, fill: '#ef4444' }} activeDot={{ r: 6, stroke: '#000', strokeWidth: 2 }} name="Absents" />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 1/3 de l'espace : Actions Rapides Congés */}
                <div className="bg-cyan-200 border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col max-h-[350px]">
    <div className="flex justify-between items-center border-b-4 border-black pb-3 mb-4">
        <h3 className="font-black uppercase text-sm flex items-center gap-2">
            <BellRing className="w-4 h-4" /> Demandes
        </h3>
        <span className="bg-black text-white px-2 py-0.5 font-black text-xs">
            {/* 👇 SÉCURITÉ ICI */}
            {(stats.conges_attente || []).length}
        </span>
    </div>

    <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
        {/* 👇 SÉCURITÉ ICI */}
        {(stats.conges_attente || []).length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-4">
                <span className="text-3xl mb-2">🎉</span>
                <p className="font-black text-xs uppercase text-gray-600">Aucune demande en attente.</p>
            </div>
        ) : (
            (stats.conges_attente || []).map(conge => (
                <div key={conge.id} className="bg-white border-2 border-black p-3 hover:-translate-y-1 transition-transform">
                    <div className="mb-2">
                        <span className="block font-black text-xs uppercase truncate" title={conge.employe_nom}>
                            {conge.employe_nom}
                        </span>
                        <span className="text-[10px] font-bold text-gray-500">
                            Du {new Date(conge.date_debut).toLocaleDateString()} au {new Date(conge.date_fin).toLocaleDateString()}
                        </span>
                    </div>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => handleUpdateConge(conge.id, 'APPROUVE')} 
                            className="flex-1 bg-green-400 border-2 border-black text-[10px] font-black uppercase py-1 hover:bg-green-500 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-none transition-all"
                        >
                            OUI
                        </button>
                        <button 
                            onClick={() => handleUpdateConge(conge.id, 'REFUSE')} 
                            className="flex-1 bg-red-500 text-white border-2 border-black text-[10px] font-black uppercase py-1 hover:bg-red-600 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-none transition-all"
                        >
                            NON
                        </button>
                    </div>
                </div>
            ))
        )}
    </div>
</div>
                </div>
            </div>
    );
};

export default DashboardAdmin;