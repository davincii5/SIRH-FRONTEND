import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, UserMinus, UserX, Search } from 'lucide-react';

const EmployeList = ({ token, refreshTrigger, currentUser }) => {
    const userRole = currentUser?.role?.toUpperCase() || 'EMPLOYE';
    const canManageRH = (userRole === 'ADMIN' || userRole === 'ADMINISTRATEUR' || userRole === 'RH');

    const [viewMode, setViewMode] = useState('actifs');
    const [employesActifs, setEmployesActifs] = useState([]);
    const [employesArchives, setEmployesArchives] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    
    const [selectedEmp, setSelectedEmp] = useState(null);
    const [showInfo, setShowInfo] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({});
    
    const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
    
    const [archiveModal, setArchiveModal] = useState({ show: false, typeDepart: '', date: '' });

    const showNotif = (message, type = 'success') => {
        setNotification({ show: true, message, type });
        setTimeout(() => {
            setNotification(prev => ({ ...prev, show: false }));
        }, 3000);
    };

    const [showDelete, setShowDelete] = useState(false);
    const [confirmName, setConfirmName] = useState("");

    const fetchActifs = () => {
        setLoading(true);
        axios.get('http://127.0.0.1:8000/api/accounts/employes/', {
            headers: { Authorization: `Bearer ${token}` }
        }).then(r => {
            setEmployesActifs(r.data);
            setViewMode('actifs');
        })
        .catch(e => console.error("Erreur chargement employés :", e))
        .finally(() => setLoading(false));
    };

    const fetchArchives = (motif) => {
        setLoading(true);
        axios.get(`http://127.0.0.1:8000/api/accounts/archives/?motif=${motif}`, {
            headers: { Authorization: `Bearer ${token}` }
        }).then(r => {
            setEmployesArchives(r.data);
            setViewMode(motif.toLowerCase());
        })
        .catch(e => console.error(`Erreur chargement archives ${motif} :`, e))
        .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchActifs();
    }, [token, refreshTrigger]);

    const displayedList = viewMode === 'actifs' ? employesActifs : employesArchives;

    // ─── FILTRE PAR RECHERCHE ───
    const filteredList = displayedList.filter(emp => {
        const query = searchQuery.toLowerCase();
        return (
            (emp.username || '').toLowerCase().includes(query) ||
            (emp.poste_titre || '').toLowerCase().includes(query) ||
            (emp.matricule || '').toLowerCase().includes(query) ||
            (emp.departement_nom || '').toLowerCase().includes(query)
        );
    });

    const handleOpenInfo = (emp) => {
        setSelectedEmp(emp);
        const contrat = emp.contrat_actuel || {}; 

        let competencesArray = [];
        try {
            const rawData = typeof emp.matrice_competences === 'string' 
                ? JSON.parse(emp.matrice_competences) 
                : (emp.matrice_competences || {});

            if (Array.isArray(rawData)) {
                competencesArray = rawData;
            } 
            else if (typeof rawData === 'object' && rawData !== null) {
                competencesArray = Object.entries(rawData).map(([key, value]) => ({
                    competence: key,
                    level: typeof value === 'number' ? value : (value.level || value.niveau || 1)
                }));
            }
        } catch (e) {
            console.error("Erreur de parsing des compétences", e);
        }
        
        competencesArray = competencesArray.map(c => ({
            competence: c.competence || '',
            level: parseInt(c.level) || 1
        }));

        setFormData({
            username: emp.username || '',
            poste_titre: emp.poste_titre || '',
            matrice_competences: competencesArray,
            statut: emp.statut || 'ACTIF',
            contrat_id: contrat.id || null,
            salaire_mensuel: contrat.salaire_mensuel || '',
            type_contrat: contrat.type_contrat || 'CDI',
            date_debut: contrat.date_debut || '',
            date_fin: contrat.date_fin || '',
        });
        setIsEditing(false); 
        setShowInfo(true);
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const updateCompetence = (index, field, value) => {
        const nouvellesCompetences = [...formData.matrice_competences];
        nouvellesCompetences[index] = { ...nouvellesCompetences[index], [field]: value };
        setFormData({ ...formData, matrice_competences: nouvellesCompetences });
    };

    const addCompetence = () => {
        setFormData({
            ...formData,
            matrice_competences: [...formData.matrice_competences, { competence: '', level: 1 }]
        });
    };

    const removeCompetence = (index) => {
        const nouvellesCompetences = formData.matrice_competences.filter((_, i) => i !== index);
        setFormData({ ...formData, matrice_competences: nouvellesCompetences });
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            await axios.patch(`http://127.0.0.1:8000/api/accounts/employes/${selectedEmp.id}/`, {
                username: canManageRH ? formData.username : undefined,
                poste_titre: canManageRH ? formData.poste_titre : undefined,
                matrice_competences: JSON.stringify(formData.matrice_competences)
            }, { headers: { Authorization: `Bearer ${token}` }});

            if (canManageRH && formData.salaire_mensuel) {
                const contratPayload = {
                    employe: selectedEmp.id,
                    salaire_mensuel: formData.salaire_mensuel,
                    type_contrat: formData.type_contrat,
                    date_debut: formData.date_debut || new Date().toISOString().split('T')[0],
                    date_fin: formData.type_contrat !== 'CDI' ? formData.date_fin : null 
                };

                if (formData.contrat_id) {
                    await axios.put(`http://127.0.0.1:8000/api/payroll/contrats/${formData.contrat_id}/`, contratPayload, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                } else {
                    await axios.post(`http://127.0.0.1:8000/api/payroll/contrats/`, contratPayload, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                }
            }

            showNotif("Dossier mis à jour avec succès !", "success");
            setIsEditing(false);
            fetchActifs(); 
            setShowInfo(false);

        } catch (error) {
            console.error(error);
            showNotif("Erreur lors de la mise à jour des informations.", "error");
        }
    };

    const handleDelete = async () => {
        if (confirmName === selectedEmp.username) {
            try {
                await axios.delete(`http://127.0.0.1:8000/api/accounts/employes/${selectedEmp.id}/`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                showNotif("Employé supprimé de la base de données.", "success");
                setShowDelete(false);
                setSelectedEmp(null);
                setConfirmName("");
                fetchActifs();
            } catch (err) {
                showNotif("Erreur lors de la suppression.", "error");
            }
        } else {
            showNotif("Erreur : Le nom saisi ne correspond pas !", "error");
        }
    };

    const confirmDeparture = async () => {
        if (!archiveModal.date) {
            showNotif("Veuillez sélectionner une date de départ valide.", "error");
            return;
        }

        try {
            await axios.patch(`http://127.0.0.1:8000/api/accounts/employes/${selectedEmp.id}/`, {
                statut: archiveModal.typeDepart,
                date_depart: archiveModal.date
            }, { headers: { Authorization: `Bearer ${token}` }});

            showNotif(`Dossier archivé (${archiveModal.typeDepart}) avec succès !`, "success");
            fetchActifs(); 
            setShowInfo(false); 
            setArchiveModal({ show: false, typeDepart: '', date: '' });
        } catch (error) {
            console.error(error);
            showNotif("Erreur lors du traitement du départ.", "error");
        }
    };

    if (loading) return <div className="text-center py-20 font-black uppercase tracking-widest">Chargement...</div>;

    return (
        <>
            <div className={`transition-all duration-300 ${(showInfo || showDelete || archiveModal.show) ? 'blur-md pointer-events-none' : ''}`}>
                <div className="bg-white border-2 border-black rounded-xl p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
                    
                    <div className="mb-8 border-b-4 border-black pb-6 flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex items-center gap-4">
                            <h2 className="text-2xl font-black tracking-tighter text-black">
                                Annuaire Global
                            </h2>
                            <div className="px-4 py-2 border-2 border-black rounded-xl bg-yellow-300 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                <span className="block text-xl font-black font-mono leading-none text-center">{filteredList.length}</span>
                                <span className="text-[9px] font-black uppercase">Membres</span>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <button 
                                onClick={fetchActifs}
                                className={`px-4 py-2.5 font-black text-xs uppercase border-2 border-black transition-all flex items-center gap-2 ${
                                    viewMode === 'actifs' 
                                    ? 'bg-black text-white shadow-none translate-y-1' 
                                    : 'bg-green-300 text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 active:translate-y-1 active:shadow-none'
                                }`}
                            >
                                <Users className="w-4 h-4" />
                                Actifs
                            </button>

                            <button 
                                onClick={() => fetchArchives('Démission')}
                                className={`px-4 py-2.5 font-black text-xs uppercase border-2 border-black transition-all flex items-center gap-2 ${
                                    viewMode === 'démission' 
                                    ? 'bg-black text-white shadow-none translate-y-1' 
                                    : 'bg-yellow-300 text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 active:translate-y-1 active:shadow-none'
                                }`}
                            >
                                <UserMinus className="w-4 h-4" />
                                Démissions
                            </button>

                            <button 
                                onClick={() => fetchArchives('Licenciement')}
                                className={`px-4 py-2.5 font-black text-xs uppercase border-2 border-black transition-all flex items-center gap-2 ${
                                    viewMode === 'licenciement' 
                                    ? 'bg-black text-white shadow-none translate-y-1' 
                                    : 'bg-red-400 text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 active:translate-y-1 active:shadow-none'
                                }`}
                            >
                                <UserX className="w-4 h-4" />
                                Licenciements
                            </button>
                        </div>
                    </div>

                    {/* ─── BARRE DE RECHERCHE ─── */}
                    <div className="mb-6">
                        <div className="flex items-center gap-2 border-2 border-black bg-white px-4 py-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] max-w-md">
                            <Search className="w-5 h-5 text-gray-500" />
                            <input 
                                type="text"
                                placeholder="Rechercher par nom, poste, matricule..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="flex-1 bg-transparent outline-none font-bold text-sm uppercase placeholder:font-bold placeholder:text-gray-400"
                            />
                            {searchQuery && (
                                <button 
                                    onClick={() => setSearchQuery('')}
                                    className="text-gray-400 hover:text-black font-black text-xs"
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="space-y-4">
                        {filteredList.length === 0 ? (
                            <div className="p-8 text-center border-2 border-dashed border-gray-300 rounded-xl bg-gray-50">
                                <p className="font-black text-gray-400 uppercase tracking-widest">
                                    {searchQuery ? 'Aucun résultat trouvé.' : 'Aucun dossier trouvé dans cette catégorie.'}
                                </p>
                            </div>
                        ) : (
                            filteredList.map((emp) => (
                                <div key={emp.id} className="bg-white border-2 border-gray-200 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between hover:border-black hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all gap-4">
                                    
                                    <div className="flex items-center gap-4">
                                        <img src={`https://ui-avatars.com/api/?name=${emp.username}&background=000&color=fff`} className="w-12 h-12 rounded-full border-2 border-black" alt="avatar" />
                                        <div>
                                            <h4 className="font-black text-lg flex items-center gap-2">
                                                {emp.username}
                                                {viewMode === 'actifs' && emp.role === 'RH' && <span className="bg-blue-100 text-[10px] px-2 py-0.5 rounded border-2 border-blue-400 uppercase shadow-[1px_1px_0px_0px_rgba(59,130,246,1)]">RH</span>}
                                            </h4>
                                            <p className="text-sm text-gray-500 font-bold uppercase">{emp.poste_titre}</p>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-4 border-t-2 md:border-t-0 pt-4 md:pt-0 border-gray-100">
                                        <div className="text-left md:text-right border-r-2 border-gray-100 pr-4">
                                            <span className="block font-mono font-black text-sm">{emp.matricule}</span>
                                            <span className="text-[10px] font-bold text-gray-400 uppercase">Matricule</span>
                                        </div>

                                        <div className="hidden sm:block">
                                            <span className="px-3 py-1.5 bg-black text-white text-[10px] font-black uppercase rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_rgba(253,224,71,1)]">
                                                {viewMode === 'actifs' ? (emp.departement_nom || 'Non assigné') : (emp.departement_nom || 'Ancien Dept.')}
                                            </span>
                                        </div>
                                        
                                        {viewMode !== 'actifs' ? (
                                            <div className="ml-2 flex items-center gap-3 bg-gray-50 px-3 py-2 border-2 border-gray-300 rounded">
                                                <div className="text-center">
                                                    <span className="block text-red-600 font-black text-xs">
                                                        {emp.date_depart ? new Date(emp.date_depart).toLocaleDateString('fr-FR') : 'Date Inconnue'}
                                                    </span>
                                                    <span className="text-[9px] uppercase font-bold text-gray-400">Date Sortie</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex gap-2 ml-2">
                                                <button onClick={() => handleOpenInfo(emp)} className="bg-yellow-300 border-2 border-black px-4 py-2 font-black text-[10px] uppercase shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all">
                                                    INFO
                                                </button>
                                                {canManageRH && (
                                                    <button onClick={() => { setSelectedEmp(emp); setShowDelete(true); }} className="bg-red-500 text-white border-2 border-black px-3 py-2 font-black text-[10px] uppercase shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all">
                                                        SUPP
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* --- MODALE D'INFORMATIONS ET ÉDITION --- */}
            {showInfo && selectedEmp && viewMode === 'actifs' && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <div className="bg-white border-4 border-black p-8 w-full max-w-4xl shadow-[15px_15px_0px_0px_rgba(0,0,0,1)] animate-in fade-in zoom-in duration-200 overflow-y-auto max-h-[90vh] custom-scrollbar">
                        <div className="flex justify-between items-center mb-6 border-b-4 border-black pb-4">
                            <h3 className="text-3xl font-black uppercase tracking-tight">
                                {isEditing ? 'Édition du Dossier' : 'Dossier Employé'}
                            </h3>
                            {!isEditing && (
                                <button onClick={() => setIsEditing(true)} className="bg-blue-400 border-2 border-black px-5 py-2 font-black text-xs uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 active:translate-y-1 active:shadow-none transition-all">
                                    {canManageRH ? 'ÉDITER LE DOSSIER' : 'ÉVALUER COMPÉTENCES'}
                                </button>
                            )}
                        </div>

                        <form onSubmit={handleSave}>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                                
                                <div className="space-y-6">
                                    <div className="flex gap-4">
                                        <div className="flex-1">
                                            <label className="block text-xs font-black text-gray-500 uppercase mb-1">Nom Complet</label>
                                            {isEditing && canManageRH ? (
                                                <input type="text" name="username" value={formData.username} onChange={handleChange} className="w-full border-2 border-black p-3 font-bold focus:bg-yellow-50 outline-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]" />
                                            ) : (
                                                <p className="font-black text-xl uppercase border-b-2 border-gray-100 pb-2">{formData.username}</p>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <label className="block text-xs font-black text-gray-500 uppercase mb-1">Poste</label>
                                            {isEditing && canManageRH ? (
                                                <input type="text" name="poste_titre" value={formData.poste_titre} onChange={handleChange} className="w-full border-2 border-black p-3 font-bold focus:bg-yellow-50 outline-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]" />
                                            ) : (
                                                <p className="font-bold uppercase text-lg border-b-2 border-gray-100 pb-2">{formData.poste_titre}</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="mt-8 pt-6 border-t-4 border-black">
                                        <label className="block text-sm font-black text-blue-600 uppercase mb-4">
                                            Matrice des Compétences
                                        </label>
                                        
                                        {isEditing ? (
                                            <div className="space-y-3">
                                                {formData.matrice_competences.map((comp, index) => (
                                                    <div key={index} className="flex gap-2 items-center">
                                                        <input 
                                                            type="text" 
                                                            value={comp.competence} 
                                                            onChange={(e) => updateCompetence(index, 'competence', e.target.value)}
                                                            placeholder="Ex: Django, React..."
                                                            className="flex-1 border-2 border-black p-2.5 font-bold focus:bg-yellow-50 outline-none text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                                                        />
                                                        <select 
                                                            value={comp.level}
                                                            onChange={(e) => updateCompetence(index, 'level', parseInt(e.target.value))}
                                                            className="border-2 border-black p-2.5 font-bold focus:bg-yellow-50 outline-none text-sm w-24 cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                                                        >
                                                            <option value={1}>Niv 1</option>
                                                            <option value={2}>Niv 2</option>
                                                            <option value={3}>Niv 3</option>
                                                            <option value={4}>Niv 4</option>
                                                            <option value={5}>Niv 5</option>
                                                        </select>
                                                        <button 
                                                            type="button"
                                                            onClick={() => removeCompetence(index)}
                                                            className="bg-red-500 text-white border-2 border-black w-11 h-11 flex items-center justify-center font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-0.5 hover:shadow-none transition-all"
                                                            title="Supprimer"
                                                        >
                                                            X
                                                        </button>
                                                    </div>
                                                ))}
                                                <button 
                                                    type="button"
                                                    onClick={addCompetence}
                                                    className="mt-4 bg-blue-100 text-blue-800 border-2 border-black border-dashed px-4 py-3 font-black text-xs uppercase hover:bg-blue-200 w-full transition-colors"
                                                >
                                                    + Ajouter une compétence
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex flex-wrap gap-3">
                                                {formData.matrice_competences.length > 0 ? (
                                                    formData.matrice_competences.map((comp, index) => (
                                                        <div key={index} className="bg-yellow-300 border-2 border-black px-4 py-2 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex items-center gap-3">
                                                            <span className="font-black text-xs uppercase">{comp.competence}</span>
                                                            <span className="bg-black text-white px-2 py-1 text-[10px] font-bold rounded">
                                                                Niv. {comp.level}
                                                            </span>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <p className="text-sm italic text-gray-500 font-bold">Aucune compétence renseignée.</p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {canManageRH && (
                                    <div className="space-y-6 bg-gray-50 p-6 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] h-fit">
                                        <div className="border-b-4 border-black pb-5">
                                            <label className="block text-xs font-black text-gray-500 uppercase mb-3">Gestion du Statut Actuel</label>
                                            <div className="flex items-center gap-2 mb-4">
                                                <span className={`px-5 py-2 font-black text-xs border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] uppercase tracking-wide ${
                                                    formData.statut === 'ACTIF' ? 'bg-green-400 text-black' : 'bg-red-500 text-white'
                                                }`}>
                                                    {formData.statut}
                                                </span>
                                            </div>
                                            
                                            {isEditing && formData.statut === 'ACTIF' && (
                                                <div className="w-full flex flex-col gap-3 mt-5">
                                                    <p className="text-[10px] font-black text-red-600 uppercase italic">⚠️ Actions irréversibles :</p>
                                                    <button 
                                                        type="button" 
                                                        onClick={() => setArchiveModal({ show: true, typeDepart: 'DEMISSIONNAIRE', date: new Date().toISOString().split('T')[0] })} 
                                                        className="w-full bg-yellow-400 text-black border-2 border-black p-3 font-black text-[11px] uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none transition-all flex justify-center items-center gap-2 hover:bg-yellow-500"
                                                    >
                                                        <UserMinus className="w-4 h-4" />
                                                        ARCHIVER (DÉMISSION)
                                                    </button>
                                                    <button 
                                                        type="button" 
                                                        onClick={() => setArchiveModal({ show: true, typeDepart: 'LICENCIE', date: new Date().toISOString().split('T')[0] })} 
                                                        className="w-full bg-red-500 text-white border-2 border-black p-3 font-black text-[11px] uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none transition-all flex justify-center items-center gap-2 hover:bg-red-600"
                                                    >
                                                        <UserX className="w-4 h-4" />
                                                        ARCHIVER (LICENCIEMENT)
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        <h4 className="font-black text-red-600 uppercase text-sm border-b-2 border-red-200 pb-2">Données RH (Confidentiel)</h4>
                                        
                                        <div>
                                            <label className="block text-xs font-black text-gray-500 uppercase mb-1">Salaire Mensuel (DH)</label>
                                            {isEditing ? (
                                                <input type="number" name="salaire_mensuel" value={formData.salaire_mensuel} onChange={handleChange} className="w-full border-2 border-black p-2 font-bold focus:bg-yellow-50 outline-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]" />
                                            ) : (
                                                <p className="font-black text-2xl text-green-600 bg-green-50 p-2 border-2 border-green-200 inline-block">{formData.salaire_mensuel ? `${formData.salaire_mensuel} DH` : 'Non défini'}</p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-xs font-black text-gray-500 uppercase mb-1">Type Contrat</label>
                                            {isEditing ? (
                                                <select name="type_contrat" value={formData.type_contrat} onChange={handleChange} className="w-full border-2 border-black p-2 font-bold focus:bg-yellow-50 outline-none cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                                    <option value="CDI">CDI</option>
                                                    <option value="CDD">CDD</option>
                                                    <option value="STAGE">STAGE</option>
                                                </select>
                                            ) : (
                                                <p className="font-bold uppercase text-lg">{formData.type_contrat}</p>
                                            )}
                                        </div>

                                        <div className="flex gap-4 pt-2">
                                            <div className="flex-1">
                                                <label className="block text-xs font-black text-gray-500 uppercase mb-1">Date Début</label>
                                                {isEditing ? (
                                                    <input type="date" name="date_debut" value={formData.date_debut} onChange={handleChange} className="w-full border-2 border-black p-2 font-bold focus:bg-yellow-50 outline-none cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]" />
                                                ) : (
                                                    <p className="font-bold">{formData.date_debut || '-'}</p>
                                                )}
                                            </div>
                                            {(formData.type_contrat === 'CDD' || formData.type_contrat === 'STAGE') && (
                                                <div className="flex-1">
                                                    <label className="block text-xs font-black text-gray-500 uppercase mb-1">Date Fin</label>
                                                    {isEditing ? (
                                                        <input type="date" name="date_fin" value={formData.date_fin} onChange={handleChange} className="w-full border-2 border-black p-2 font-bold focus:bg-yellow-50 outline-none cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]" />
                                                    ) : (
                                                        <p className="font-bold text-red-600">{formData.date_fin || '-'}</p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-4 mt-10 pt-6 border-t-4 border-black">
                                {isEditing ? (
                                    <>
                                        <button type="submit" className="flex-1 bg-black text-white p-4 font-black uppercase text-sm shadow-[6px_6px_0px_0px_rgba(253,224,71,1)] hover:-translate-y-1 active:translate-y-1 active:shadow-none transition-all">Enregistrer les Modifications</button>
                                        <button type="button" onClick={() => setIsEditing(false)} className="flex-1 border-4 border-black p-4 font-black uppercase text-sm hover:bg-gray-100 transition-colors">Annuler</button>
                                    </>
                                ) : (
                                    <button type="button" onClick={() => setShowInfo(false)} className="w-full bg-black text-white p-4 font-black uppercase text-sm shadow-[6px_6px_0px_0px_rgba(100,100,100,1)] hover:-translate-y-1 active:translate-y-1 active:shadow-none transition-all">Fermer le Dossier</button>
                                )}
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* --- MODALE SUPPRIMER --- */}
            {showDelete && selectedEmp && canManageRH && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <div className="bg-white border-4 border-black p-8 w-full max-w-sm shadow-[15px_15px_0px_0px_rgba(0,0,0,1)] animate-in fade-in zoom-in duration-200">
                        <h3 className="text-2xl font-black uppercase text-red-600 mb-2 border-b-4 border-red-600 pb-2">Destruction</h3>
                        <p className="text-sm font-bold mt-4 mb-6 leading-relaxed">
                            Pour effacer définitivement <span className="bg-yellow-300 px-1 border border-black">{selectedEmp.username}</span>, veuillez taper son nom exact :
                        </p>
                        <input 
                            type="text" 
                            value={confirmName}
                            onChange={(e) => setConfirmName(e.target.value)}
                            className="w-full border-4 border-black p-3 mb-6 font-black bg-red-50 outline-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]" 
                            placeholder="Nom exact"
                        />
                        <div className="flex gap-4">
                            <button onClick={handleDelete} className="flex-1 bg-red-600 text-white p-3 font-black uppercase text-xs shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none transition-all">Supprimer</button>
                            <button onClick={() => { setShowDelete(false); setConfirmName(""); }} className="flex-1 border-4 border-black p-3 font-black uppercase text-xs hover:bg-gray-100 transition-colors">Annuler</button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- MODALE DATE ARCHIVAGE --- */}
            {archiveModal.show && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <div className="bg-white border-4 border-black p-6 w-full max-w-sm shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] animate-in zoom-in duration-200">
                        <h3 className="text-xl font-black uppercase border-b-4 border-black pb-2 mb-4">
                            {archiveModal.typeDepart === 'DEMISSIONNAIRE' ? 'Détails Démission' : 'Détails Licenciement'}
                        </h3>
                        
                        <label className="block text-xs font-black text-gray-500 uppercase mb-2">
                            Date effective du départ :
                        </label>
                        <input 
                            type="date" 
                            value={archiveModal.date}
                            onChange={(e) => setArchiveModal({ ...archiveModal, date: e.target.value })}
                            className="w-full border-4 border-black p-3 font-bold bg-yellow-50 outline-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] mb-6 cursor-pointer" 
                        />
                        
                        <div className="flex gap-4">
                            <button onClick={confirmDeparture} className="flex-1 bg-black text-white p-3 font-black uppercase text-xs shadow-[3px_3px_0px_0px_rgba(100,100,100,1)] active:translate-y-1 active:shadow-none transition-all">
                                Confirmer
                            </button>
                            <button onClick={() => setArchiveModal({ show: false, typeDepart: '', date: '' })} className="flex-1 border-4 border-black p-3 font-black uppercase text-xs hover:bg-gray-100 transition-colors">
                                Annuler
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- TOAST NOTIFICATION --- */}
            {notification.show && (
                <div className={`fixed bottom-8 right-8 z-[100] px-6 py-4 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex items-center gap-3 animate-in slide-in-from-bottom-10 fade-in duration-300 transition-all ${
                    notification.type === 'success' ? 'bg-green-400 text-black' : 'bg-red-500 text-white'
                }`}>
                    {notification.type === 'success' ? (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                    ) : (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"></path></svg>
                    )}
                    <p className="font-black uppercase text-sm tracking-wide">
                        {notification.message}
                    </p>
                </div>
            )}
        </>
    );
};

export default EmployeList;