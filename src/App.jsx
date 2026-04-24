import { useState } from 'react';
import axios from 'axios';
import AddEmploye from './components/AddEmploye';
import EmployeList from './components/EmployeList';

function App() {
  // États pour la session et le rafraîchissement
  const [message, setMessage] = useState("En attente de connexion...");
  const [token, setToken] = useState(null);
  const [refreshList, setRefreshList] = useState(false); 

  // Fonction pour simuler la connexion et récupérer le JWT
  const testConnection = async () => {
    try {
      // On utilise les identifiants du Manager RH créés précédemment
      const response = await axios.post('http://127.0.0.1:8000/api/token/', {
        username: 'managerrh1', 
        password: 'managerrh123'
      });

      setToken(response.data.access);
      setMessage("✅ Connexion Réussie ! Mode Manager RH activé.");
      console.log("Token récupéré :", response.data.access);

    } catch (error) {
      console.error("Erreur de connexion:", error);
      setMessage("❌ Échec de la connexion. Vérifiez que Django tourne sur le port 8000.");
    }
  };

  // Cette fonction sera passée au formulaire d'ajout
  // Elle permet de dire à la liste de se recharger après un ajout réussi
  const handleEmployeAdded = () => {
      setRefreshList(prev => !prev); 
      console.log("Nouvel employé détecté, rafraîchissement de la liste...");
  };

  return (
    <div style={{ padding: '40px', fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif', backgroundColor: '#1a1a1a', minHeight: '100vh', color: 'white' }}>
      <header style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h2 style={{ color: '#646cff' }}>Smart Enterprise - SIRH Management</h2>
        <p style={{ fontSize: '1.1em', color: token ? '#4caf50' : '#ff9800' }}>{message}</p>
        
        {!token && (
          <button 
            onClick={testConnection} 
            style={{ padding: '12px 24px', fontSize: '16px', borderRadius: '8px', border: 'none', backgroundColor: '#646cff', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}
          >
            Se connecter en tant que Manager RH
          </button>
        )}
      </header>
      
      <hr style={{ borderColor: '#333', margin: '30px 0' }}/>

      {token && (
        <div style={{ display: 'flex', gap: '40px', flexWrap: 'wrap', justifyContent: 'center' }}>
            
            {/* Colonne de gauche : Formulaire d'ajout */}
            <div style={{ flex: '1', minWidth: '350px', backgroundColor: '#ffffff', padding: '25px', borderRadius: '12px', color: '#333', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
                <AddEmploye token={token} onEmployeAdded={handleEmployeAdded} />
            </div>
            
            {/* Colonne de droite : Liste des employés */}
            <div style={{ flex: '1.5', minWidth: '400px' }}>
                <EmployeList token={token} refreshTrigger={refreshList} />
            </div>
            
        </div>
      )}
    </div>
  );
}

export default App;