import { useState } from 'react';
import axios from 'axios';

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
            // Appel à l'API Django pour obtenir le token
            const response = await axios.post('http://127.0.0.1:8000/api/token/', credentials);
            const token = response.data.access;

            // ... (après avoir reçu la réponse de l'API avec le token)
            let role = 'EMPLOYE'; 
            let username = credentials.username;
            let is_chef = false; // 👈 NOUVEAU : On prépare la variable

            try {
                // On décode le token JWT
                const payload = JSON.parse(atob(token.split('.')[1]));
                if (payload.role) role = payload.role;
                if (payload.username) username = payload.username;
                
                // 🚨 LA PIÈCE MANQUANTE EST ICI : On lit is_chef depuis le token !
                if (payload.is_chef) is_chef = payload.is_chef; 
                
            } catch (e) {
                console.warn("Impossible de décoder le payload.");
            }

            // On met is_chef dans userData pour que Layout.jsx puisse l'utiliser !
            const userData = { username, role, is_chef }; 
            
            onLoginSuccess(token, userData);

        } catch (err) {
            setError("Identifiants incorrects. Veuillez réessayer.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white flex items-center justify-center p-4">
            <div className="w-full max-w-md">

                {/* Header SIRH */}
                <div className="text-center mb-8">
                    <h1 className="text-6xl font-black tracking-tighter text-black">SIRH</h1>
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mt-1">
                        Système d'Information RH
                    </p>
                </div>

                {/* Carte de Connexion Style Néo-Brutaliste */}
                <div className="bg-white border-2 border-black rounded-xl p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">

                    {/* Icône de cadenas */}
                    <div className="flex justify-center mb-6">
                        <div className="bg-gray-100 p-4 rounded-full border-2 border-black">
                            <svg className="w-8 h-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                    </div>

                    <h3 className="text-2xl font-black tracking-tighter text-center text-black mb-1">Connexion</h3>
                    <p className="text-sm text-gray-500 text-center font-medium mb-8">
                        Entrez vos identifiants pour continuer
                    </p>

                    {error && (
                        <div className="mb-6 p-3 bg-red-50 border-2 border-red-500 text-red-600 text-sm font-bold rounded-lg text-center">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="group">
                            <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2 group-focus-within:text-black transition-colors">
                                Nom d'utilisateur
                            </label>
                            <input
                                name="username" type="text" placeholder="ex: managerrh1"
                                value={credentials.username} onChange={handleChange} required
                                className="w-full bg-gray-50 border-2 border-gray-200 rounded-lg p-3 text-black font-bold outline-none focus:bg-white focus:border-black transition-all duration-200 placeholder:text-gray-300"
                            />
                        </div>

                        <div className="group">
                            <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2 group-focus-within:text-black transition-colors">
                                Mot de passe
                            </label>
                            <input
                                name="password" type="password" placeholder="••••••••"
                                value={credentials.password} onChange={handleChange} required
                                className="w-full bg-gray-50 border-2 border-gray-200 rounded-lg p-3 text-black font-bold outline-none focus:bg-white focus:border-black transition-all duration-200 placeholder:text-gray-300"
                            />
                        </div>

                        <button type="submit" disabled={loading}
                            className="w-full bg-black text-white font-bold py-3 rounded-lg border-2 border-black hover:bg-gray-800 transition-all active:translate-y-1 active:shadow-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex justify-center items-center gap-2 disabled:opacity-60">
                            {loading ? 'Connexion...' : (
                                <>
                                    S'authentifier
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                    </svg>
                                </>
                            )}
                        </button>
                    </form>
                </div>

                <p className="text-center text-xs font-bold uppercase tracking-widest text-gray-400 mt-6">
                    Accès réservé au personnel autorisé
                </p>
            </div>
        </div>
    );
};

export default Login;