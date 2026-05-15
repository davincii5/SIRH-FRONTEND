import { useState } from 'react';
import axios from 'axios';
import animationLogin from '../assets/animationLogin.svg'; // Vérifiez bien ce chemin

const Login = ({ onLoginSuccess }) => {
    const [credentials, setCredentials] = useState({ username: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => setCredentials({ ...credentials, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const response = await axios.post('http://127.0.0.1:8000/api/token/', credentials);
            const token = response.data.access;

            let role = 'EMPLOYE'; 
            let username = credentials.username;
            let is_chef = false; 

            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                if (payload.role) role = payload.role;
                if (payload.username) username = payload.username;
                if (payload.is_chef) is_chef = payload.is_chef; 
            } catch (e) {
                console.warn("Impossible de décoder le payload.");
            }

            const userData = { username, role, is_chef }; 
            onLoginSuccess(token, userData);

        } catch (err) {
            setError("Identifiants incorrects. Veuillez réessayer.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-8">
            
            {/* Conteneur principal élargi (max-w-4xl) avec Flexbox */}
            <div className="w-full max-w-4xl bg-white border-4 border-black rounded-xl shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] flex flex-col md:flex-row overflow-hidden">

                {/* ========================================== */}
                {/* PARTIE GAUCHE : LE FORMULAIRE              */}
                {/* ========================================== */}
                <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center bg-white relative z-10">
                    
                    <h3 className="text-3xl font-black tracking-tighter text-black mb-2 uppercase">Connexion</h3>
                    <p className="text-sm font-bold text-gray-500 mb-8 uppercase tracking-widest">
                        Entrez vos identifiants
                    </p>

                    {error && (
                        <div className="mb-6 p-3 bg-red-300 border-4 border-black text-black text-sm font-black uppercase rounded-none text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] animate-in fade-in slide-in-from-top-2">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="group">
                            <label className="block text-xs font-black uppercase tracking-widest text-black mb-2">
                                Nom d'utilisateur
                            </label>
                            <input
                                name="username" type="text" placeholder="ex: managerrh1"
                                value={credentials.username} onChange={handleChange} required
                                className="w-full bg-white border-4 border-black rounded-none p-4 text-black font-bold outline-none focus:bg-yellow-50 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:translate-x-[2px] focus:translate-y-[2px] focus:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] placeholder:text-gray-300"
                            />
                        </div>

                        <div className="group">
                            <label className="block text-xs font-black uppercase tracking-widest text-black mb-2">
                                Mot de passe
                            </label>
                            <input
                                name="password" type="password" placeholder="••••••••"
                                value={credentials.password} onChange={handleChange} required
                                className="w-full bg-white border-4 border-black rounded-none p-4 text-black font-bold outline-none focus:bg-yellow-50 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:translate-x-[2px] focus:translate-y-[2px] focus:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] placeholder:text-gray-300"
                            />
                        </div>

                        <button type="submit" disabled={loading}
                            className="w-full bg-black text-white font-black uppercase tracking-widest py-4 mt-4 border-4 border-black hover:bg-gray-800 transition-all active:translate-x-[4px] active:translate-y-[4px] active:shadow-none shadow-[6px_6px_0px_0px_rgba(253,224,71,1)] flex justify-center items-center gap-2 disabled:opacity-60">
                            {loading ? 'Connexion en cours...' : (
                                <>
                                    S'authentifier
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                    </svg>
                                </>
                            )}
                        </button>
                    </form>

                    <p className="text-center text-[10px] font-black uppercase tracking-widest text-gray-400 mt-10">
                        Accès réservé au personnel autorisé
                    </p>
                </div>

                {/* ========================================== */}
                {/* PARTIE DROITE : L'ANIMATION ET LE LOGO     */}
                {/* ========================================== */}
                <div className="w-full md:w-1/2 border-t-4 md:border-t-0 md:border-l-4 border-black p-8 md:p-12 flex flex-col items-center justify-center relative overflow-hidden">
                    
                    {/* Le grand logo SIRH intégré dans la partie droite */}
                    <div className="text-center mb-10 z-10">
                        <h1 className="text-7xl font-black tracking-tighter text-black drop-shadow-[4px_4px_0px_rgba(255,255,255,1)]">
                            SIRH
                        </h1>
                        <p className="text-sm font-black uppercase tracking-widest text-black mt-2 bg-white px-3 py-1 border-2 border-black inline-block shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                            Smart Enterprise
                        </p>
                    </div>

                    {/* L'image SVG */}
                    <div className="w-full max-w-[280px] z-10 transition-transform duration-500 hover:scale-105">
                        <img 
                            src={animationLogin} 
                            alt="Animation de connexion" 
                            className="w-full h-auto object-contain drop-shadow-xl"
                        />
                    </div>

                    {/* Décoration Néo-Brutaliste d'arrière-plan */}
                    <div className="absolute -bottom-10 -right-10 opacity-20 pointer-events-none">
                        <svg width="200" height="200" viewBox="0 0 100 100" fill="none">
                            <circle cx="50" cy="50" r="40" stroke="black" strokeWidth="8" strokeDasharray="10 10"/>
                        </svg>
                    </div>
                    
                </div>

            </div>
        </div>
    );
};

export default Login;