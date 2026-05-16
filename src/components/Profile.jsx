import React, { useState, useEffect } from 'react';
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

const Profile = ({ token, currentUser }) => {
    const [profileData, setProfileData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null); // 👈 Gestion du toast

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
    };

    useEffect(() => {
        axios.get('http://127.0.0.1:8000/api/accounts/employes/', {
            headers: { Authorization: `Bearer ${token}` }
        }).then(response => {
            const myData = response.data.find(emp => emp.username === currentUser.username);
            setProfileData(myData);
        }).catch(error => {
            console.error("Erreur chargement profil :", error);
            showToast("Erreur lors du chargement du profil", 'error');
        }).finally(() => setLoading(false));
    }, [token, currentUser]);

    const handlePointageVirtuel = () => {
        axios.post('http://127.0.0.1:8000/api/payroll/pointage-virtuel/', {}, {
            headers: { Authorization: `Bearer ${token}` }
        })
        .then(res => {
            showToast(res.data.message || "Pointage réussi !", 'success');
        })
        .catch(err => {
            console.error(err);
            const msg = err.response?.data?.error || err.response?.data?.detail || "Erreur lors du pointage virtuel. L'API est-elle bien configurée ?";
            showToast(msg, 'error');
        });
    };
    
    if (!profileData && !loading && (currentUser.role === 'ADMIN' || currentUser.role === 'ADMINISTRATEUR')) {
        return (
            <div className="max-w-3xl mx-auto bg-white border-4 border-black p-12 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] text-center">
                <h2 className="text-4xl font-black uppercase tracking-tighter mb-2">Profil Système</h2>
                <p className="font-black text-2xl text-purple-600 uppercase bg-purple-100 inline-block px-4 py-1 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    {currentUser.username} ({currentUser.role})
                </p>
                <div className="mt-10 bg-gray-50 border-2 border-black p-6 text-left">
                    <p className="font-black text-sm uppercase mb-2">Statut Spécial</p>
                    <p className="text-sm font-bold text-gray-600">En tant qu'administrateur, vous n'avez pas de fiche employé classique (matrice de compétences, contrat, etc.). Utilisez le menu latéral pour gérer l'entreprise.</p>
                </div>
            </div>
        );
    }

    if (loading) return <div className="text-center py-20 font-black uppercase tracking-widest">Chargement de votre profil...</div>;

    if (!profileData) return <div className="text-center py-20 font-black text-red-500 uppercase">Erreur : Impossible de charger le profil.</div>;

    let competences = [];
    try {
        const rawData = typeof profileData.matrice_competences === 'string' 
            ? JSON.parse(profileData.matrice_competences) 
            : (profileData.matrice_competences || {});

        if (Array.isArray(rawData)) {
            competences = rawData;
        } 
        else if (typeof rawData === 'object' && rawData !== null) {
            competences = Object.entries(rawData).map(([key, value]) => ({
                competence: key,
                level: typeof value === 'number' ? value : (value.level || value.niveau || 1)
            }));
        }
    } catch (e) {
        console.error("Erreur parsing compétences", e);
    }

    return (
        <div className="max-w-4xl mx-auto bg-white border-4 border-black p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] relative">
            {/* 👇 TOAST RENDU */}
            {toast && (
                <Toast 
                    message={toast.message} 
                    type={toast.type} 
                    onClose={() => setToast(null)} 
                />
            )}

            <div className="border-b-4 border-black pb-6 mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex items-center gap-6">
                    <img 
                        src={`https://ui-avatars.com/api/?name=${profileData.username}&background=000&color=fff&size=128`} 
                        className="w-24 h-24 rounded-full border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]" 
                        alt="avatar" 
                    />
                    <div>
                        <h2 className="text-4xl font-black uppercase tracking-tighter">{profileData.username}</h2>
                        <p className="text-xl font-bold text-gray-600 uppercase mt-1">{profileData.poste_titre || 'Poste non défini'}</p>
                        <span className="inline-block mt-2 px-3 py-1 bg-yellow-300 border-2 border-black font-black text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                            {profileData.departement_nom || 'Département non assigné'}
                        </span>
                    </div>
                </div>

                <button 
                    onClick={handlePointageVirtuel}
                    className="bg-green-500 text-white font-black px-6 py-4 uppercase tracking-wider border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-green-400 active:translate-y-1 active:shadow-none transition-all"
                >
                    👆 Badger (Aujourd'hui)
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-6">
                    <div>
                        <h3 className="font-black text-sm uppercase tracking-widest text-gray-400 mb-2">Informations Générales</h3>
                        <div className="bg-gray-50 border-2 border-black p-4 space-y-3">
                            <div>
                                <p className="text-[10px] font-black uppercase text-gray-500">Matricule</p>
                                <p className="font-mono font-black">{profileData.matricule}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase text-gray-500">Statut</p>
                                <span className={`px-2 py-1 inline-block font-black text-[10px] border-2 border-black mt-1 ${profileData.statut === 'ACTIF' ? 'bg-green-400' : 'bg-red-400'}`}>
                                    {profileData.statut || 'ACTIF'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {profileData.contrat_actuel && (
                        <div>
                            <h3 className="font-black text-sm uppercase tracking-widest text-gray-400 mb-2">Détails du contrat</h3>
                            <div className="bg-blue-50 border-2 border-black p-4 grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-[10px] font-black uppercase text-gray-500">Type</p>
                                    <p className="font-black">{profileData.contrat_actuel.type_contrat}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase text-gray-500">Salaire</p>
                                    <p className="font-black text-green-700">{profileData.contrat_actuel.salaire_mensuel} DH</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase text-gray-500">Embauche</p>
                                    <p className="font-bold text-sm">{profileData.contrat_actuel.date_debut}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div>
                    <h3 className="font-black text-sm uppercase tracking-widest text-blue-600 mb-4 border-b-4 border-black pb-2">
                        Mes Compétences (Matrice)
                    </h3>
                    <div className="flex flex-col gap-3">
                        {competences.length > 0 ? (
                            competences.map((comp, index) => (
                                <div key={index} className="flex justify-between items-center bg-white border-2 border-black p-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 transition-transform">
                                    <span className="font-black uppercase text-sm">{comp.competence}</span>
                                    <div className="flex gap-1">
                                        {[1, 2, 3, 4, 5].map(niveau => (
                                            <div 
                                                key={niveau} 
                                                className={`w-4 h-6 border border-black ${niveau <= (comp.level || comp.niveau) ? 'bg-black' : 'bg-gray-200'}`}
                                            />
                                        ))}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm italic font-bold text-gray-500 border-2 border-dashed border-gray-300 p-4 text-center">
                                Aucune compétence n'a encore été validée pour votre profil.
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;