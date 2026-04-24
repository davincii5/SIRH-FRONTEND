import { useState } from 'react';
import axios from 'axios';

const AddEmploye = ({ token, onEmployeAdded }) => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        matricule: '',
        poste_titre: ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post(
                'http://127.0.0.1:8000/api/accounts/create-employe/',
                formData,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            alert("Employé créé avec succès ! ID: " + response.data.id);
            onEmployeAdded(); // On informe le parent pour rafraîchir la liste
        } catch (error) {
            console.error("Erreur lors de la création:", error.response?.data);
            alert("Échec de la création. Vérifiez la console.");
        }
    };

    return (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '300px' }}>
            <h3>Ajouter un Employé</h3>
            <input name="username" placeholder="Nom d'utilisateur" onChange={handleChange} required />
            <input name="email" type="email" placeholder="Email" onChange={handleChange} required />
            <input name="password" type="password" placeholder="Mot de passe" onChange={handleChange} required />
            <input name="matricule" placeholder="Matricule (ex: EMP-002)" onChange={handleChange} required />
            <input name="poste_titre" placeholder="Poste" onChange={handleChange} required />
            <button type="submit" style={{ background: '#28a745', color: 'white', padding: '10px', cursor: 'pointer' }}>
                Enregistrer l'Employé
            </button>
        </form>
    );
};

export default AddEmploye;