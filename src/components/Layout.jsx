import React from 'react';

const Layout = ({ children, activeTab, setActiveTab, handleLogout, currentUser }) => {
   const role = currentUser?.role?.toUpperCase() || 'EMPLOYE';
    const isAdminOrRH = role === 'ADMIN' || role === 'ADMINISTRATEUR' || role === 'RH';
    const isChef = currentUser?.is_chef===true;

    // 1. Le menu de base (Visible par TOUT LE MONDE)
    const navItems = [
        { id: 'profile', label: 'Mon Profil', icon: '👤' }, // 👈 NOUVEAU
    ];

    // 2. Les menus sensibles (Visibles UNIQUEMENT par Admin et RH)
    if (isAdminOrRH || isChef) {
        navItems.push({ id: 'list', label: 'Annuaire', icon: '👥' });
    }
    if (isAdminOrRH) {
        navItems.push({ id: 'attendance', label: 'Présences', icon: '📅' });
        navItems.push({ id: 'departements', label: 'Départements', icon: '🏢' });
        navItems.push({ id: 'add', label: 'Ajouter Employé', icon: '➕' });
    }

    return (
        <div className="min-h-screen bg-white flex flex-col font-sans">
            
            {/* --- TOP HEADER (Barre du haut) --- */}
            <header className="border-b-4 border-black p-4 flex justify-between items-center bg-white z-10 sticky top-0">
                <div className="flex items-center gap-4">
                    <span className="bg-black text-white px-3 py-1 font-black text-xl tracking-tighter">SIRH</span>
                    <h1 className="font-black text-xl tracking-tight hidden sm:block">Smart Enterprise</h1>
                </div>
                
                <div className="flex items-center gap-6">
                    <div className="text-right hidden sm:block">
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Session active</p>
                        <p className="font-black text-sm uppercase bg-yellow-300 px-2 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] inline-block">
                            {currentUser?.username} ({role})
                        </p>
                    </div>
                    <button 
                        onClick={handleLogout}
                        className="border-2 border-black px-4 py-2 font-black text-xs uppercase hover:bg-red-500 hover:text-white transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none flex items-center gap-2"
                    >
                        Se déconnecter
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                    </button>
                </div>
            </header>

            {/* --- CORPS DE LA PAGE --- */}
            <div className="flex flex-1 overflow-hidden">
                
                {/* SIDEBAR NAVIGATION (Barre latérale) */}
                <aside className="w-64 border-r-4 border-black bg-gray-50 flex flex-col p-6 gap-3 hidden md:flex overflow-y-auto">
                    <h2 className="font-black text-[10px] text-gray-400 uppercase tracking-widest mb-2">Menu Principal</h2>
                    
                    {navItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`text-left px-4 py-3 font-black text-sm border-2 border-black transition-all flex items-center gap-3 ${
                                activeTab === item.id 
                                ? 'bg-black text-white shadow-[4px_4px_0px_0px_rgba(253,224,71,1)] translate-x-1 -translate-y-1' 
                                : 'bg-white text-black hover:bg-gray-100 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none'
                            }`}
                        >
                            <span>{item.icon}</span>
                            {item.label.toUpperCase()}
                        </button>
                    ))}

                    {/* Espace Info Admin */}
                    {isAdminOrRH && (
                        <div className="mt-auto pt-6 border-t-4 border-black">
                            <div className="bg-purple-100 p-4 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                <p className="font-black text-[10px] uppercase mb-1">Mode Admin Actif</p>
                                <p className="text-xs font-bold text-gray-600">Vous avez accès à la modification des contrats et aux suppressions.</p>
                            </div>
                        </div>
                    )}
                </aside>

                {/* CONTENU PRINCIPAL (Là où les autres composants s'affichent) */}
                <main className="flex-1 p-8 overflow-y-auto bg-white relative">
                    {children}
                </main>
                
            </div>
        </div>
    );
};

export default Layout;