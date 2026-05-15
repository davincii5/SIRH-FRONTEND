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
import FloatingChat from './components/Floatingchat';

function App() {
    const [token, setToken] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    
    const [refreshList, setRefreshList] = useState(false);
    const [activeTab, setActiveTab] = useState('profile');

    const handleLoginSuccess = (tokenData, userData) => {
        setToken(tokenData);
        setCurrentUser(userData); 
        
        const role = userData?.role?.toUpperCase();
        if (role === 'ADMIN' || role === 'ADMINISTRATEUR') {
            setActiveTab('dashboard');
        } else {
            setActiveTab('profile');
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

    const renderActiveTab = () => {
        switch (activeTab) {
            case 'dashboard':
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
                return <Profile token={token} currentUser={currentUser} />;
        }
    };

    return (
        <>
            <Layout 
                activeTab={activeTab} 
                setActiveTab={setActiveTab} 
                handleLogout={handleLogout}
                currentUser={currentUser}
            >
                {renderActiveTab()}
            </Layout>
            <FloatingChat token={token} currentUser={currentUser} />
        </>
    );
}

export default App;