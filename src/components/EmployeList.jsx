import { useState, useEffect } from 'react';
import axios from 'axios';

const EmployeList = ({ token, refreshTrigger }) => {
    const [employes, setEmployes] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEmployes = async () => {
            try {
                // On appelle la vue EmployeListView de Django
                const response = await axios.get('http://127.0.0.1:8000/api/accounts/employes/', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setEmployes(response.data);
                setLoading(false);
            } catch (error) {
                console.error("Erreur lors de la récupération:", error);
                setLoading(false);
            }
        };

        fetchEmployes();
    }, [token, refreshTrigger]); // Se recharge si le token ou refreshTrigger change

    if (loading) return <p>Chargement des employés...</p>;

    return (
        <div style={{ padding: '20px', backgroundColor: '#333', borderRadius: '8px', color: 'white' }}>
            <h3>Liste des employés ({employes.length})</h3>
            {employes.length === 0 ? (
                <p>Aucun employé trouvé dans la base de données.</p>
            ) : (
                <ul style={{ listStyleType: 'none', padding: 0 }}>
                    {employes.map((emp) => (
                        <li key={emp.id} style={{ background: '#444', padding: '15px', margin: '10px 0', borderRadius: '5px' }}>
                            <strong style={{ fontSize: '1.2em' }}>{emp.username}</strong> - {emp.poste_titre} <br/>
                            <span style={{ fontSize: '0.9em', color: '#ccc' }}>
                                Matricule: {emp.matricule} | Email: {emp.email}
                            </span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default EmployeList;