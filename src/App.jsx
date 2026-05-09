import { useState, useEffect } from 'react';
import Login from './components/Login';
import EvaluationManager from './components/EvaluationManager';
import PayrollDashboard from './components/PayrollDashboard';
import Layout from './components/Layout';
import AddEmploye from './components/AddEmploye';
import EmployeList from './components/EmployeList';
import DepartementList from './components/DepartementList';
import AttendanceDashboard from './components/AttendanceDashboard';
import Profile from './components/Profile';
import EmployeeLeave from './components/EmployeeLeave';
import HRLeaveManagement from './components/HRLeaveManagement';
import ManualAttendance from './components/ManualAttendance';

function App() {
    const [token, setToken] = useState(null);
    const [currentUser, setCurrentUser] = useState(null); // Gérer l'utilisateur connecté
    
    const [refreshList, setRefreshList] = useState(false);
    const [activeTab, setActiveTab] = useState('profile'); // 'list' par défaut au lieu de 'add'

    // À adapter selon la structure de retour de ton API Login
    const handleLoginSuccess = (tokenData, userData) => {
        setToken(tokenData);
        setCurrentUser(userData); // Ex: { username: 'admin', role: 'ADMIN' }
        setActiveTab('profile'); // 👈 NOUVEAU : On force la vue sur le profil à la connexion
    };

    const handleLogout = () => {
        setToken(null);
        setCurrentUser(null);
    };

    const handleEmployeAdded = () => {
        setRefreshList(prev => !prev);
        setActiveTab('list');
    };

    if (!token) return <Login onLoginSuccess={handleLoginSuccess} />;

    // Fonction pour afficher le bon composant selon l'onglet
    const renderActiveTab = () => {
        switch (activeTab) {
            case 'profile':
                return <Profile token={token} currentUser={currentUser} />;
            case 'employee_leaves':
                return <EmployeeLeave token={token} currentUser={currentUser} />;
            case 'hr_leaves':
                return <HRLeaveManagement token={token} />;
            case 'add':
                return <AddEmploye token={token} onEmployeAdded={handleEmployeAdded} />;
            case 'list':
                return <EmployeList token={token} refreshTrigger={refreshList} currentUser={currentUser} />;
            case 'departements':
                return <DepartementList token={token} />;
                
            // 👇 LES DEUX PAGES DE PRÉSENCE SONT LÀ 👇
            case 'attendance_iot':
                return <AttendanceDashboard token={token} />; // L'ancien dashboard MQTT
            case 'attendance_manual':
                return <ManualAttendance token={token} />;    // Le nouveau avec les bulles
            // 👆 ===================================== 👆
            
            case 'payroll':
                return <PayrollDashboard token={token} />;
            default:
                return <EmployeList token={token} refreshTrigger={refreshList} currentUser={currentUser} />;
        }
    };

    return (
        // Le Layout englobe tout, on lui passe les props nécessaires pour la navigation
        <Layout 
            activeTab={activeTab} 
            setActiveTab={setActiveTab} 
            handleLogout={handleLogout}
            currentUser={currentUser}
        >
            {/* renderActiveTab() va remplacer la prop "children" dans le Layout */}
            {renderActiveTab()}
        </Layout>
    );
}

export default App;