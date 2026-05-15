import React, { useState } from 'react';
import { 
    User, CalendarDays, Users, Radio, ClipboardList, 
    Building2, UserPlus, Banknote, CalendarCheck, LogOut, ChevronDown, ChevronRight, Folder, Shield, Settings
} from 'lucide-react';

const Layout = ({ children, activeTab, setActiveTab, handleLogout, currentUser }) => {
    const role = currentUser?.role?.toUpperCase() || 'EMPLOYE';
    
    // Définition stricte des rôles
    const isAdmin = role === 'ADMIN' || role === 'ADMINISTRATEUR';
    const isRH = role === 'RH';
    const isChef = currentUser?.is_chef === true;

    const [openMenu, setOpenMenu] = useState('Gestion des Temps'); 

    // ==========================================
    // 1. MENU ADMIN STRICT (Plat, sans profil)
    // ==========================================
    const adminFlatItems = [
        { id: 'attendance_iot', label: 'Pointage Live (IoT)', icon: Radio },
        { id: 'attendance_manual', label: 'Saisie Présences', icon: ClipboardList },
        { id: 'hr_leaves', label: 'Validation Congés', icon: CalendarCheck },
        { id: 'list', label: 'Annuaire Global', icon: Users },
        { id: 'departements', label: 'Départements', icon: Building2 },
        { id: 'add', label: 'Ajouter Employé', icon: UserPlus },
        { id: 'payroll', label: 'Gestion Paie', icon: Banknote },
    ];

    // ==========================================
    // 2. MENU DE BASE (Pour Employé, Chef, RH)
    // ==========================================
    const baseNavItems = [
        { id: 'profile', label: 'Mon Profil', icon: User }, 
        { id: 'employee_leaves', label: 'Mes Congés', icon: CalendarDays },
    ];

    if (isChef && !isAdmin && !isRH) {
        baseNavItems.push({ id: 'list', label: 'Annuaire Équipe', icon: Users });
    }

    // ==========================================
    // 3. MENU RH COMPLEXE (Avec Accordéon)
    // ==========================================
    const rhCategories = [];
    if (isRH) {
        rhCategories.push({
            title: 'Gestion des Temps',
            icon: Radio,
            items: [
                { id: 'attendance_iot', label: 'Pointage Live (IoT)', icon: Radio },
                { id: 'attendance_manual', label: 'Saisie Présences', icon: ClipboardList },
                { id: 'hr_leaves', label: 'Validation Congés', icon: CalendarCheck },
            ]
        });

        rhCategories.push({
            title: 'Administration RH',
            icon: Folder,
            items: [
                { id: 'list', label: 'Annuaire Global', icon: Users },
                { id: 'departements', label: 'Départements', icon: Building2 },
                { id: 'add', label: 'Ajouter Employé', icon: UserPlus },
                { id: 'payroll', label: 'Gestion Paie', icon: Banknote },
            ]
        });
    }

    return (
        <div className="h-screen w-full overflow-hidden bg-white flex flex-col font-sans selection:bg-yellow-300 selection:text-black">
            
            {/* --- TOP HEADER --- */}
            <header className="border-b-4 border-black p-4 flex justify-between items-center bg-white z-10 shrink-0">
                <div className="flex items-center gap-4">
                    <span className="bg-black text-white px-3 py-1.5 font-black text-xl tracking-tighter shadow-[3px_3px_0px_0px_rgba(253,224,71,1)]">
                        SIRH
                    </span>
                    <h1 className="font-black text-xl tracking-tight hidden sm:block text-gray-900">
                        Smart Enterprise
                    </h1>
                </div>
                
                <div className="flex items-center gap-6">
                    <div className="text-right hidden sm:block">
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">
                            Session active
                        </p>
                        <p className="font-black text-sm uppercase bg-yellow-300 px-3 py-1 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] inline-block">
                            {currentUser?.username || 'Utilisateur'} ({role})
                        </p>
                    </div>
                    <button 
                        onClick={handleLogout}
                        className="group border-2 border-black bg-white px-4 py-2 font-black text-xs uppercase hover:bg-red-500 hover:text-white transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none flex items-center gap-2"
                    >
                        <span>Se déconnecter</span>
                        <LogOut className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </header>

            {/* --- CORPS DE LA PAGE --- */}
            <div className="flex flex-1 overflow-hidden">
                
                {/* SIDEBAR NAVIGATION */}
                <aside className="w-72 border-r-4 border-black bg-gray-50 flex flex-col p-6 gap-6 hidden md:flex overflow-y-auto shrink-0">
                    
                    {isAdmin ? (
                        /* ====================================================
                           VUE ADMINISTRATEUR STRICTE (Plat, pas de profil) 
                           ==================================================== */
                        <div className="flex flex-col gap-3">
                            <h2 className="font-black text-[10px] text-gray-400 uppercase tracking-widest px-1 flex items-center gap-2">
                                <Settings className="w-4 h-4 text-black" /> Panneau de Contrôle
                            </h2>
                            {adminFlatItems.map((item) => {
                                const Icon = item.icon;
                                const isActive = activeTab === item.id;
                                
                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => setActiveTab(item.id)}
                                        className={`text-left px-4 py-3.5 font-black text-sm border-2 border-black transition-all flex items-center gap-3 ${
                                            isActive 
                                            ? 'bg-black text-white shadow-[4px_4px_0px_0px_rgba(253,224,71,1)] translate-x-1 -translate-y-1' 
                                            : 'bg-white text-black hover:bg-gray-100 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 active:translate-y-1 active:shadow-none'
                                        }`}
                                    >
                                        <Icon className={`w-5 h-5 ${isActive ? 'text-yellow-300' : 'text-black'}`} />
                                        {item.label.toUpperCase()}
                                    </button>
                                );
                            })}
                        </div>
                    ) : (
                        /* ====================================================
                           VUE EMPLOYÉ / CHEF / RH (Avec Espace Personnel) 
                           ==================================================== */
                        <>
                            {/* SECTION 1: Espace Personnel */}
                            <div className="flex flex-col gap-3">
                                <h2 className="font-black text-[10px] text-gray-400 uppercase tracking-widest px-1">
                                    Mon Espace
                                </h2>
                                {baseNavItems.map((item) => {
                                    const Icon = item.icon;
                                    const isActive = activeTab === item.id;
                                    
                                    return (
                                        <button
                                            key={item.id}
                                            onClick={() => setActiveTab(item.id)}
                                            className={`text-left px-4 py-3.5 font-black text-sm border-2 border-black transition-all flex items-center gap-3 ${
                                                isActive 
                                                ? 'bg-black text-white shadow-[4px_4px_0px_0px_rgba(253,224,71,1)] translate-x-1 -translate-y-1' 
                                                : 'bg-white text-black hover:bg-gray-100 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 active:translate-y-1 active:shadow-none'
                                            }`}
                                        >
                                            <Icon className={`w-5 h-5 ${isActive ? 'text-yellow-300' : 'text-black'}`} />
                                            {item.label.toUpperCase()}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* SECTION 2: Outils RH (Accordéon) */}
                            {isRH && rhCategories.length > 0 && (
                                <div className="flex flex-col gap-3 pt-4 border-t-4 border-gray-200">
                                    <h2 className="font-black text-[10px] text-gray-400 uppercase tracking-widest px-1 flex items-center gap-2">
                                        <Shield className="w-3 h-3" /> Espace RH
                                    </h2>
                                    
                                    {rhCategories.map((category) => {
                                        const CategoryIcon = category.icon;
                                        const isOpen = openMenu === category.title;

                                        return (
                                            <div key={category.title} className="flex flex-col gap-2">
                                                <button
                                                    onClick={() => setOpenMenu(isOpen ? null : category.title)}
                                                    className="w-full text-left px-4 py-3 font-black text-sm border-2 border-black bg-white flex items-center justify-between hover:bg-gray-100 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 active:translate-y-1 active:shadow-none transition-all"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <CategoryIcon className="w-5 h-5 text-black" />
                                                        {category.title.toUpperCase()}
                                                    </div>
                                                    {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                                </button>

                                                {isOpen && (
                                                    <div className="flex flex-col gap-2 pl-4 mt-1 border-l-4 border-black ml-2">
                                                        {category.items.map((item) => {
                                                            const ItemIcon = item.icon;
                                                            const isActive = activeTab === item.id;

                                                            return (
                                                                <button
                                                                    key={item.id}
                                                                    onClick={() => setActiveTab(item.id)}
                                                                    className={`text-left px-4 py-2.5 font-bold text-xs border-2 border-black transition-all flex items-center gap-3 ${
                                                                        isActive 
                                                                        ? 'bg-black text-white shadow-[3px_3px_0px_0px_rgba(253,224,71,1)] translate-x-1 -translate-y-0.5' 
                                                                        : 'bg-white text-black hover:bg-gray-100 hover:-translate-y-0.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none'
                                                                    }`}
                                                                >
                                                                    <ItemIcon className={`w-4 h-4 ${isActive ? 'text-yellow-300' : 'text-gray-700'}`} />
                                                                    {item.label.toUpperCase()}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </>
                    )}

                    {/* Espace Info Système (Affiché pour Admin et RH) */}
                    {(isAdmin || isRH) && (
                        <div className="mt-auto pt-6 border-t-4 border-black">
                            <div className="bg-purple-200 p-4 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden">
                                <div className="absolute -right-4 -top-4 bg-purple-300 w-12 h-12 rounded-full opacity-50"></div>
                                <p className="font-black text-[10px] uppercase mb-2 text-black tracking-wider flex items-center gap-2">
                                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                                    Accès Privilégié
                                </p>
                                <p className="text-xs font-bold text-gray-800 leading-relaxed">
                                    Vous avez accès aux données sensibles de l'entreprise.
                                </p>
                            </div>
                        </div>
                    )}
                </aside>

                {/* CONTENU PRINCIPAL */}
                <main className="flex-1 p-8 overflow-y-auto bg-slate-50 relative">
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none opacity-50"></div>
                    <div className="relative z-0 min-h-full pb-10">
                        {children}
                    </div>
                </main>
                
            </div>
        </div>
    );
};

export default Layout;