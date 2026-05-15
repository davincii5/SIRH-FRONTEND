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
import DashboardAdmin from './components/DashboardAdmin';

function App() {
    const [token, setToken] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    
    const [refreshList, setRefreshList] = useState(false);
    const [activeTab, setActiveTab] = useState('profile');

    const handleLoginSuccess = (tokenData, userData) => {
        setToken(tokenData);
        setCurrentUser(userData); 
        
        // 💡 REDIRECTION INTELLIGENTE SELON LE RÔLE
        const role = userData?.role?.toUpperCase();
        if (role === 'ADMIN' || role === 'ADMINISTRATEUR') {
            setActiveTab('dashboard'); // L'admin atterrit direct sur ses stats
        } else {
            setActiveTab('profile'); // Les employés et RH atterrissent sur leur profil
        }
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
            case 'dashboard': // 👈 AJOUT DU TABLEAU DE BORD
                return <DashboardAdmin token={token} currentUser={currentUser} />;
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
            case 'attendance_iot':
                return <AttendanceDashboard token={token} />;
            case 'attendance_manual':
                return <ManualAttendance token={token} />;
            case 'payroll':
                return <PayrollDashboard token={token} />;
            default:
                // Fallback de sécurité
                const role = currentUser?.role?.toUpperCase();
                if (role === 'ADMIN' || role === 'ADMINISTRATEUR') {
                    return <DashboardAdmin token={token} currentUser={currentUser} />;
                }
                return <Profile token={token} currentUser={currentUser} />;
        }
    };

    return (
        <Layout 
            activeTab={activeTab} 
            setActiveTab={setActiveTab} 
            handleLogout={handleLogout}
            currentUser={currentUser}
        >
            {renderActiveTab()}
        </Layout>
    );
}

export default App;