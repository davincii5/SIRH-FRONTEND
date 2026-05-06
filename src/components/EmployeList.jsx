import { useState, useEffect } from 'react';
import axios from 'axios';

const EmployeList = ({ token, refreshTrigger, currentUser }) => {
    // 👑 1. GESTION DES RÔLES DÈS LE DÉBUT
    // On met en majuscules pour éviter les erreurs de casse
    const userRole = currentUser?.role?.toUpperCase() || 'EMPLOYE';
    
    // 🚨 LA CORRECTION EST ICI : On accepte ADMIN, ADMINISTRATEUR et RH
    const canManageRH = (userRole === 'ADMIN' || userRole === 'ADMINISTRATEUR' || userRole === 'RH');

    // 2. ÉTATS GLOBAUX
    const [employes, setEmployes] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // États Modale Info/Édition
    const [selectedEmp, setSelectedEmp] = useState(null);
    const [showInfo, setShowInfo] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({});
    
    // État de la notification
    const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

    const showNotif = (message, type = 'success') => {
        setNotification({ show: true, message, type });
        setTimeout(() => {
            setNotification(prev => ({ ...prev, show: false }));
        }, 3000);
    };

    // États Modale Suppression
    const [showDelete, setShowDelete] = useState(false);
    const [confirmName, setConfirmName] = useState("");

    // 3. RÉCUPÉRATION DES DONNÉES
    const fetchEmployes = () => {
        setLoading(true);
        axios.get('http://127.0.0.1:8000/api/accounts/employes/', {
            headers: { Authorization: `Bearer ${token}` }
        }).then(r => setEmployes(r.data))
          .catch(e => console.error("Erreur chargement employés :", e))
          .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchEmployes();
    }, [token, refreshTrigger]);

    // 4. OUVRIR LA FENÊTRE INFO ET PRÉPARER LES DONNÉES
    const handleOpenInfo = (emp) => {
    setSelectedEmp(emp);
    const contrat = emp.contrat_actuel || {}; 

    let competencesArray = [];
    try {
        // On récupère la donnée brute (qu'elle soit string ou objet)
        const rawData = typeof emp.matrice_competences === 'string' 
            ? JSON.parse(emp.matrice_competences) 
            : (emp.matrice_competences || {});

        // 🟢 CAS 1 : C'est un tableau (donnée sauvegardée depuis ce formulaire React)
        if (Array.isArray(rawData)) {
            competencesArray = rawData;
        } 
        // 🟢 CAS 2 : C'est un objet (donnée générée par ton seed.py)
        else if (typeof rawData === 'object' && rawData !== null) {
            competencesArray = Object.entries(rawData).map(([key, value]) => ({
                competence: key,
                // On s'assure de récupérer le niveau, que ce soit un format {"React": 5} ou {"React": {"level": 5}}
                level: typeof value === 'number' ? value : (value.level || value.niveau || 1)
            }));
        }
    } catch (e) {
        console.error("Erreur de parsing des compétences", e);
    }
    
    // Normalisation finale pour le formulaire
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

    // 5. GESTION DU FORMULAIRE CLASSIQUE
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // 6. GESTION DYNAMIQUE DES COMPÉTENCES
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

    // 7. SAUVEGARDER LES MODIFICATIONS
    const handleSave = async (e) => {
        e.preventDefault(); // Ajout pour éviter le rechargement de la page
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
            fetchEmployes(); 
            setShowInfo(false);

        } catch (error) {
            console.error(error);
            showNotif("Erreur lors de la mise à jour des informations.", "error");
        }
    };

    // 8. SUPPRIMER UN EMPLOYÉ
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
                fetchEmployes();
            } catch (err) {
                showNotif("Erreur lors de la suppression.", "error");
            }
        } else {
            showNotif("Erreur : Le nom saisi ne correspond pas !", "error");
        }
    };

    // 9. DÉCLENCHEUR N8N
   const handleDeparture = async (typeDepart) => {
        // typeDepart sera soit 'DEMISSIONNAIRE' soit 'LICENCIE'
        try {
            await axios.patch(`http://127.0.0.1:8000/api/accounts/employes/${selectedEmp.id}/`, {
                statut: typeDepart
            }, { headers: { Authorization: `Bearer ${token}` }});

            showNotif(`Dossier archivé (${typeDepart}) et n8n déclenché !`, "success");
            fetchEmployes(); 
            setShowInfo(false); // Ferme la fenêtre instantanément
        } catch (error) {
            console.error(error);
            showNotif("Erreur lors du traitement du départ.", "error");
        }
    };

    if (loading) return <div className="text-center py-20 font-black uppercase tracking-widest">Chargement...</div>;

    return (
        <>
            {/* --- LISTE DES EMPLOYÉS --- */}
            <div className={`transition-all duration-300 ${(showInfo || showDelete) ? 'blur-md pointer-events-none' : ''}`}>
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
                            <div key={emp.id} className="bg-white border-2 border-gray-200 rounded-xl p-4 flex items-center justify-between hover:border-black hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all">
                                <div className="flex items-center gap-4">
                                    <img src={`https://ui-avatars.com/api/?name=${emp.username}&background=000&color=fff`} className="w-11 h-11 rounded-full border-2 border-black" alt="avatar" />
                                    <div>
                                        <h4 className="font-black flex items-center gap-2">
                                            {emp.username}
                                            {emp.role === 'RH' && <span className="bg-blue-100 text-[9px] px-1.5 py-0.5 rounded border border-blue-400">RH</span>}
                                        </h4>
                                        <p className="text-xs text-gray-500 font-bold uppercase">{emp.poste_titre}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <div className="text-right hidden md:block border-r-2 border-gray-100 pr-4">
                                        <span className="block font-mono font-black text-xs">{emp.matricule}</span>
                                        <span className="text-[10px] font-bold text-gray-400 uppercase">Matricule</span>
                                    </div>
                                    <span className="px-3 py-1 bg-black text-white text-[10px] font-black uppercase rounded-lg hidden sm:block">
                                        {emp.departement_nom || 'Non assigné'}
                                    </span>
                                    
                                    <div className="flex gap-2 ml-2">
                                        <button onClick={() => handleOpenInfo(emp)} className="bg-yellow-300 border-2 border-black px-4 py-1 font-black text-[10px] uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:shadow-none">
                                            INFO
                                        </button>
                                        {canManageRH && (
                                            <button onClick={() => { setSelectedEmp(emp); setShowDelete(true); }} className="bg-red-500 text-white border-2 border-black px-3 py-1 font-black text-[10px] uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:shadow-none">
                                                SUPP
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* --- MODALE D'INFORMATIONS ET ÉDITION --- */}
            {showInfo && selectedEmp && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20">
                    <div className="bg-white border-4 border-black p-8 w-full max-w-4xl shadow-[15px_15px_0px_0px_rgba(0,0,0,1)] animate-in fade-in zoom-in duration-200 overflow-y-auto max-h-[90vh] custom-scrollbar">
                        <div className="flex justify-between items-center mb-6 border-b-4 border-black pb-2">
                            <h3 className="text-2xl font-black uppercase">
                                {isEditing ? 'Édition du Dossier' : 'Dossier Employé'}
                            </h3>
                            {!isEditing && (
                                <button onClick={() => setIsEditing(true)} className="bg-blue-400 border-2 border-black px-4 py-1 font-black text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                    {canManageRH ? 'ÉDITER LE DOSSIER' : 'ÉVALUER COMPÉTENCES'}
                                </button>
                            )}
                        </div>

                        <form onSubmit={handleSave}>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                
                                {/* --- COLONNE GAUCHE --- */}
                                <div className="space-y-4">
                                    <div className="flex gap-4">
                                        <div className="flex-1">
                                            <label className="block text-xs font-black text-gray-500 uppercase">Nom Complet</label>
                                            {isEditing && canManageRH ? (
                                                <input type="text" name="username" value={formData.username} onChange={handleChange} className="w-full border-2 border-black p-2 font-bold focus:bg-yellow-50 outline-none" />
                                            ) : (
                                                <p className="font-black text-lg uppercase">{formData.username}</p>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <label className="block text-xs font-black text-gray-500 uppercase">Poste</label>
                                            {isEditing && canManageRH ? (
                                                <input type="text" name="poste_titre" value={formData.poste_titre} onChange={handleChange} className="w-full border-2 border-black p-2 font-bold focus:bg-yellow-50 outline-none" />
                                            ) : (
                                                <p className="font-bold uppercase">{formData.poste_titre}</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* COMPÉTENCES */}
                                    <div className="mt-6 pt-4 border-t-4 border-black">
                                        <label className="block text-sm font-black text-blue-600 uppercase mb-3">
                                            Compétences (Matrice)
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
                                                            className="flex-1 border-2 border-black p-2 font-bold focus:bg-yellow-50 outline-none text-sm"
                                                        />
                                                        <select 
                                                            value={comp.level}
                                                            onChange={(e) => updateCompetence(index, 'level', parseInt(e.target.value))}
                                                            className="border-2 border-black p-2 font-bold focus:bg-yellow-50 outline-none text-sm w-24 cursor-pointer"
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
                                                            className="bg-red-500 text-white border-2 border-black w-10 h-10 flex items-center justify-center font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-0.5 hover:shadow-none"
                                                            title="Supprimer"
                                                        >
                                                            X
                                                        </button>
                                                    </div>
                                                ))}
                                                <button 
                                                    type="button"
                                                    onClick={addCompetence}
                                                    className="mt-2 bg-blue-100 text-blue-800 border-2 border-black px-4 py-2 font-black text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-0.5 hover:shadow-none w-full"
                                                >
                                                    + Ajouter une compétence
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex flex-wrap gap-2">
                                                {formData.matrice_competences.length > 0 ? (
                                                    formData.matrice_competences.map((comp, index) => (
                                                        <div key={index} className="bg-yellow-300 border-2 border-black px-3 py-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2">
                                                            <span className="font-black text-xs uppercase">{comp.competence}</span>
                                                            <span className="bg-black text-white px-1.5 py-0.5 text-[10px] font-bold rounded-sm">
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

                                {/* --- COLONNE DROITE : Paie et Contrat --- */}
                                {canManageRH && (
                                    <div className="space-y-4 bg-gray-50 p-6 border-4 border-black h-fit">
                                        <div className="mt-2 border-b-4 border-black pb-4 mb-4">
                                            <label className="block text-xs font-black text-gray-500 uppercase mb-2">Statut Actuel</label>
                                            <div className="flex items-center gap-2">
                                                <span className={`px-4 py-2 font-black text-xs border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${
                                                    formData.statut === 'ACTIF' ? 'bg-green-400 text-black' : 'bg-red-500 text-white'
                                                }`}>
                                                    {formData.statut}
                                                </span>
                                            </div>
                                            {isEditing && formData.statut === 'ACTIF' && (
                                                <div className="w-full mt-3 flex flex-col gap-2">
                                                    <button 
                                                        type="button" 
                                                        onClick={() => handleDeparture('DEMISSIONNAIRE')} 
                                                        className="w-full bg-purple-600 text-white border-2 border-black p-2 font-black text-[10px] uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none transition-all flex justify-center items-center gap-2"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12h-6"></path></svg>
                                                        DÉMISSION (ARCHIVER)
                                                    </button>
                                                    <button 
                                                        type="button" 
                                                        onClick={() => handleDeparture('LICENCIE')} 
                                                        className="w-full bg-orange-500 text-white border-2 border-black p-2 font-black text-[10px] uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none transition-all flex justify-center items-center gap-2"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12h-6"></path></svg>
                                                        LICENCIEMENT (ARCHIVER)
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        <h4 className="font-black text-red-600 uppercase text-sm border-b-4 border-black pb-2 mb-4">Données RH (Confidentiel)</h4>
                                        
                                        <div>
                                            <label className="block text-xs font-black text-gray-500 uppercase">Salaire Mensuel (DH)</label>
                                            {isEditing ? (
                                                <input type="number" name="salaire_mensuel" value={formData.salaire_mensuel} onChange={handleChange} className="w-full border-2 border-black p-2 font-bold focus:bg-yellow-50 outline-none" />
                                            ) : (
                                                <p className="font-black text-2xl text-green-600">{formData.salaire_mensuel ? `${formData.salaire_mensuel} DH` : 'Non défini'}</p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-xs font-black text-gray-500 uppercase">Type Contrat</label>
                                            {isEditing ? (
                                                <select name="type_contrat" value={formData.type_contrat} onChange={handleChange} className="w-full border-2 border-black p-2 font-bold focus:bg-yellow-50 outline-none cursor-pointer">
                                                    <option value="CDI">CDI</option>
                                                    <option value="CDD">CDD</option>
                                                    <option value="STAGE">STAGE</option>
                                                </select>
                                            ) : (
                                                <p className="font-bold uppercase">{formData.type_contrat}</p>
                                            )}
                                        </div>

                                        <div className="flex gap-4 pt-2">
                                            <div className="flex-1">
                                                <label className="block text-xs font-black text-gray-500 uppercase">Date Début</label>
                                                {isEditing ? (
                                                    <input type="date" name="date_debut" value={formData.date_debut} onChange={handleChange} className="w-full border-2 border-black p-2 font-bold focus:bg-yellow-50 outline-none cursor-pointer" />
                                                ) : (
                                                    <p className="font-bold">{formData.date_debut || '-'}</p>
                                                )}
                                            </div>
                                            {(formData.type_contrat === 'CDD' || formData.type_contrat === 'STAGE') && (
                                                <div className="flex-1">
                                                    <label className="block text-xs font-black text-gray-500 uppercase">Date Fin</label>
                                                    {isEditing ? (
                                                        <input type="date" name="date_fin" value={formData.date_fin} onChange={handleChange} className="w-full border-2 border-black p-2 font-bold focus:bg-yellow-50 outline-none cursor-pointer" />
                                                    ) : (
                                                        <p className="font-bold text-red-600">{formData.date_fin || '-'}</p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Actions du bas */}
                            <div className="flex gap-4 mt-8 pt-6 border-t-4 border-black">
                                {isEditing ? (
                                    <>
                                        <button type="submit" className="flex-1 bg-black text-white p-3 font-black uppercase text-sm shadow-[4px_4px_0px_0px_rgba(100,100,100,1)] active:translate-y-1">Enregistrer</button>
                                        <button type="button" onClick={() => setIsEditing(false)} className="flex-1 border-2 border-black p-3 font-black uppercase text-sm hover:bg-gray-100">Annuler</button>
                                    </>
                                ) : (
                                    <button type="button" onClick={() => setShowInfo(false)} className="w-full bg-black text-white p-3 font-black uppercase text-sm shadow-[4px_4px_0px_0px_rgba(100,100,100,1)] active:translate-y-1">Fermer</button>
                                )}
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* --- MODALE SUPPRIMER --- */}
            {showDelete && selectedEmp && canManageRH && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20">
                    <div className="bg-white border-4 border-black p-8 w-full max-w-sm shadow-[15px_15px_0px_0px_rgba(0,0,0,1)] animate-in fade-in zoom-in duration-200">
                        <h3 className="text-xl font-black uppercase text-red-600 mb-4 italic">Confirmation Critique</h3>
                        <p className="text-xs font-bold uppercase mb-4 leading-tight">
                            Pour supprimer <span className="underline">{selectedEmp.username}</span>, veuillez saisir son nom ci-dessous :
                        </p>
                        <input 
                            type="text" 
                            value={confirmName}
                            onChange={(e) => setConfirmName(e.target.value)}
                            className="w-full border-2 border-black p-2 mb-6 font-bold bg-red-50 outline-none" 
                            placeholder="Nom exact"
                        />
                        <div className="flex gap-4">
                            <button onClick={handleDelete} className="flex-1 bg-red-600 text-white p-3 font-black uppercase text-xs shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] active:translate-y-1">Supprimer</button>
                            <button onClick={() => { setShowDelete(false); setConfirmName(""); }} className="flex-1 border-2 border-black p-3 font-black uppercase text-xs hover:bg-gray-100">Annuler</button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- TOAST NOTIFICATION NEO-BRUTALISTE --- */}
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