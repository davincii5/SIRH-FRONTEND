import { useState } from 'react';
import Login from './components/Login';
import AddEmploye from './components/AddEmploye';
import EmployeList from './components/EmployeList';

function App() {
    const [token, setToken] = useState(null);
    const [refreshList, setRefreshList] = useState(false);
    const [activeTab, setActiveTab] = useState('add');

    const handleLoginSuccess = (t) => setToken(t);
    const handleLogout = () => setToken(null);
    const handleEmployeAdded = () => {
        setRefreshList(prev => !prev);
        setActiveTab('list');
    };

    if (!token) return <Login onLoginSuccess={handleLoginSuccess} />;

    return (
        <div className="min-h-screen bg-gray-50">

            {/* Header */}
            <header className="bg-white border-b-2 border-black px-6 py-4 flex justify-between items-center sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <span className="bg-black text-white font-black text-xs px-3 py-1.5 rounded-lg uppercase tracking-widest">
                        SIRH
                    </span>
                    <span className="font-black tracking-tighter text-lg text-black">
                        Smart Enterprise
                    </span>
                </div>
                <button onClick={handleLogout}
                    className="bg-white text-black font-bold py-2 px-5 rounded-lg border-2 border-black hover:bg-gray-100 transition-all active:translate-y-0.5 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] text-xs uppercase tracking-widest flex items-center gap-2">
                    Se déconnecter
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                </button>
            </header>

            {/* Main */}
            <main className="w-full mx-auto px-4 md:px-12 py-10">

                {/* Page title */}
                <div className="mb-8 border-b border-gray-200 pb-6">
                    <h1 className="text-4xl font-black tracking-tighter text-black">Tableau de Bord RH</h1>
                    <p className="text-black font-bold mt-1 text-sm">Gérez vos employés et consultez l'annuaire.</p>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-8">
                    <button onClick={() => setActiveTab('add')}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-lg border-2 font-bold text-xs uppercase tracking-widest transition-all
                            ${activeTab === 'add'
                                ? 'bg-black text-white border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,0.2)]'
                                : 'bg-white text-black border-black hover:bg-gray-100'
                            }`}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5"
                                d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                        </svg>
                        Ajouter
                    </button>
                    <button onClick={() => setActiveTab('list')}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-lg border-2 font-bold text-xs uppercase tracking-widest transition-all
                            ${activeTab === 'list'
                                ? 'bg-black text-white border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,0.2)]'
                                : 'bg-white text-black border-black hover:bg-gray-100'
                            }`}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Annuaire
                    </button>
                </div>

                {/* Content */}
                {activeTab === 'add'
                    ? <AddEmploye token={token} onEmployeAdded={handleEmployeAdded} />
                    : <EmployeList token={token} refreshTrigger={refreshList} />
                }
            </main>
        </div>
    );
}

export default App;