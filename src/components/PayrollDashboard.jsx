import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { CheckCircle2, XCircle, Trash2, AlertTriangle, FileDown, Loader } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// 👇 TOAST
const Toast = ({ message, type, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(() => onClose(), 3000);
        return () => clearTimeout(timer);
    }, [onClose]);

    const styles = {
        success: 'bg-green-400 border-black text-black',
        error: 'bg-red-500 border-black text-white'
    };
    const icons = {
        success: <CheckCircle2 className="w-5 h-5" />,
        error: <XCircle className="w-5 h-5" />
    };

    return (
        <div className={`fixed top-6 right-6 z-[9999] flex items-center gap-3 px-5 py-3 border-4 font-black text-sm uppercase tracking-wider shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] animate-in slide-in-from-right-full fade-in duration-300 ${styles[type]}`}>
            {icons[type]}
            <span>{message}</span>
            <button onClick={onClose} className="ml-2 font-black hover:scale-110 transition-transform">✕</button>
        </div>
    );
};

// 👇 MODALE DE CONFIRMATION
const ConfirmModal = ({ isOpen, title, message, onConfirm, onCancel }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white border-4 border-black p-6 max-w-sm w-full shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] animate-in zoom-in-95 fade-in duration-200">
                <div className="flex items-center gap-3 mb-4">
                    <div className="bg-red-500 border-2 border-black p-1.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                        <AlertTriangle className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-lg font-black uppercase tracking-tight">{title}</h3>
                </div>
                
                <p className="font-bold text-sm mb-6 leading-relaxed text-gray-800">
                    {message}
                </p>
                
                <div className="flex gap-3">
                    <button 
                        onClick={onConfirm}
                        className="flex-1 bg-red-500 text-white border-2 border-black px-4 py-2.5 font-black text-xs uppercase hover:bg-red-600 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-0.5 transition-all"
                    >
                        Confirmer
                    </button>
                    <button 
                        onClick={onCancel}
                        className="flex-1 bg-white border-2 border-black px-4 py-2.5 font-black text-xs uppercase hover:bg-gray-100 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-0.5 transition-all"
                    >
                        Annuler
                    </button>
                </div>
            </div>
        </div>
    );
};

const PayrollDashboard = ({ token }) => {
    const [fiches, setFiches] = useState([]);
    const [toast, setToast] = useState(null);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [pdfLoading, setPdfLoading] = useState(false);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
    };

    const fetchFiches = useCallback(() => {
        axios.get('http://127.0.0.1:8000/api/payroll/fiches/', {
            headers: { Authorization: `Bearer ${token}` }
        })
        .then(res => setFiches(res.data))
        .catch(err => {
            console.error(err);
            showToast('Erreur de chargement des fiches', 'error');
        });
    }, [token]);

    useEffect(() => {
        fetchFiches();
    }, [fetchFiches]);

    const handleGenererPaie = () => {
        axios.post('http://127.0.0.1:8000/api/payroll/generer-paie/', 
            { mois: 5, annee: 2026 }, 
            { headers: { Authorization: `Bearer ${token}` } }
        )
        .then(res => {
            showToast(res.data.message, 'success');
            fetchFiches();
        })
        .catch(err => {
            const msg = err.response?.data?.error || err.response?.data?.detail || "Erreur lors de la génération.";
            showToast(msg, 'error');
        });
    };

    const handleResetPaie = () => {
        setConfirmOpen(true);
    };

    const confirmReset = () => {
        setConfirmOpen(false);
        axios.delete('http://127.0.0.1:8000/api/payroll/generer-paie/?mois=5&annee=2026', {
            headers: { Authorization: `Bearer ${token}` }
        })
        .then(res => {
            showToast(res.data.message, 'success');
            fetchFiches();
        })
        .catch(err => {
            const msg = err.response?.data?.error || err.response?.data?.detail || "Erreur lors de la suppression.";
            showToast(msg, 'error');
        });
    };

    // 👇 FONCTION PDF CORRIGÉE AVEC TRY-CATCH ET LOGS
    const handleDownloadPDF = () => {
        if (fiches.length === 0) {
            showToast("Aucune fiche à exporter", 'error');
            return;
        }

        setPdfLoading(true);

        try {
            const doc = new jsPDF();
            
            // Vérification que autoTable est bien chargé
            if (typeof autoTable !== 'function') {
                throw new Error("jspdf-autotable n'est pas correctement chargé");
            }

            // Bandeau noir brutaliste
            doc.setFillColor(0, 0, 0);
            doc.rect(0, 0, 210, 28, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(18);
            doc.setFont('helvetica', 'bold');
            doc.text("FICHES DE PAIE - MAI 2026", 105, 18, { align: 'center' });
            
            // Infos
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text(`Généré le : ${new Date().toLocaleDateString('fr-FR')}`, 14, 38);
            doc.text(`Nombre d'employés : ${fiches.length}`, 14, 44);

            // Données tableau
            const tableData = fiches.map(f => [
                (f.employe || 'N/A').toUpperCase(),
                `${f.periode_mois || '-'}/${f.periode_annee || '-'}`,
                `${parseFloat(f.salaire_base || 0).toFixed(2)} DH`,
                `${parseFloat(f.deductions_absences || 0).toFixed(2)} DH`,
                `${parseFloat(f.primes_supp || 0).toFixed(2)} DH`,
                `${parseFloat(f.net_a_payer || 0).toFixed(2)} DH`
            ]);

            // Totaux
            const totalDeductions = fiches.reduce((sum, f) => sum + (parseFloat(f.deductions_absences) || 0), 0);
            const totalPrimes = fiches.reduce((sum, f) => sum + (parseFloat(f.primes_supp) || 0), 0);
            const totalNet = fiches.reduce((sum, f) => sum + (parseFloat(f.net_a_payer) || 0), 0);

            // Tableau avec autoTable (appel fonctionnel)
            autoTable(doc, {
                head: [['EMPLOYÉ', 'PÉRIODE', 'SALAIRE BASE', 'DÉDUCTIONS', 'PRIMES', 'NET À PAYER']],
                body: tableData,
                startY: 52,
                theme: 'grid',
                styles: { 
                    fontSize: 9, 
                    font: 'helvetica',
                    lineColor: [0, 0, 0],
                    lineWidth: 0.5,
                    cellPadding: 3
                },
                headStyles: { 
                    fillColor: [0, 0, 0], 
                    textColor: [255, 255, 255],
                    fontStyle: 'bold',
                    halign: 'center'
                },
                columnStyles: {
                    0: { fontStyle: 'bold' },
                    2: { halign: 'right' },
                    3: { halign: 'right', textColor: [220, 38, 38] },
                    4: { halign: 'right', textColor: [34, 197, 94] },
                    5: { halign: 'right', fontStyle: 'bold' }
                },
                alternateRowStyles: { fillColor: [250, 250, 250] }
            });

            // Position après tableau
            const finalY = doc.lastAutoTable.finalY + 12;
            
            // Ligne séparatrice
            doc.setDrawColor(0, 0, 0);
            doc.setLineWidth(1.5);
            doc.line(120, finalY - 6, 200, finalY - 6);
            
            // Titre récap
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(12);
            doc.setTextColor(0, 0, 0);
            doc.text("RÉCAPITULATIF", 120, finalY);
            
            // Total Déductions
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);
            doc.setTextColor(0, 0, 0);
            doc.text(`Total Déductions :`, 120, finalY + 10);
            doc.setTextColor(220, 38, 38);
            doc.setFont('helvetica', 'bold');
            doc.text(`-${totalDeductions.toFixed(2)} DH`, 200, finalY + 10, { align: 'right' });
            
            // Total Primes
            doc.setTextColor(0, 0, 0);
            doc.setFont('helvetica', 'normal');
            doc.text(`Total Primes :`, 120, finalY + 18);
            doc.setTextColor(34, 197, 94);
            doc.setFont('helvetica', 'bold');
            doc.text(`+${totalPrimes.toFixed(2)} DH`, 200, finalY + 18, { align: 'right' });
            
            // Total Net (encadré jaune)
            const netY = finalY + 30;
            doc.setFillColor(253, 224, 71); // Jaune
            doc.setDrawColor(0, 0, 0);
            doc.setLineWidth(2);
            doc.rect(118, netY - 8, 84, 14, 'FD');
            
            doc.setTextColor(0, 0, 0);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(11);
            doc.text(`TOTAL NET :`, 122, netY + 1);
            doc.text(`${totalNet.toFixed(2)} DH`, 198, netY + 1, { align: 'right' });

            // Téléchargement
            doc.save('fiches-paie-mai-2026.pdf');
            showToast("PDF téléchargé avec succès", 'success');

        } catch (error) {
            console.error("Erreur PDF:", error);
            showToast(`Erreur PDF: ${error.message}`, 'error');
        } finally {
            setPdfLoading(false);
        }
    };

    return (
        <div className="bg-white border-4 border-black p-6 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] relative">
            {/* TOAST */}
            {toast && (
                <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
            )}

            {/* MODALE */}
            <ConfirmModal 
                isOpen={confirmOpen}
                title="Suppression"
                message="Voulez-vous vraiment supprimer définitivement TOUTES les fiches de paie de Mai 2026 ?"
                onConfirm={confirmReset}
                onCancel={() => setConfirmOpen(false)}
            />

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <h2 className="text-3xl font-black uppercase italic">Gestion de la Paie</h2>
                
                <div className="flex flex-wrap gap-3">
                    <button 
                        onClick={handleGenererPaie}
                        className="bg-yellow-300 border-4 border-black px-4 py-2 font-black uppercase hover:bg-yellow-400 transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-1"
                    >
                        Calculer la paie (Mai 2026)
                    </button>

                    <button 
                        onClick={handleDownloadPDF}
                        disabled={pdfLoading}
                        className={`bg-blue-500 text-white border-4 border-black px-4 py-2 font-black uppercase transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-1 flex items-center gap-2 ${pdfLoading ? 'opacity-60 cursor-not-allowed' : 'hover:bg-blue-600'}`}
                    >
                        {pdfLoading ? <Loader className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
                        {pdfLoading ? 'Génération...' : 'Export PDF'}
                    </button>

                    <button 
                        onClick={handleResetPaie}
                        className="bg-red-500 text-white border-4 border-black px-4 py-2 font-black uppercase hover:bg-red-600 transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-1 flex items-center gap-2"
                    >
                        <Trash2 className="w-4 h-4" /> Vider
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto border-4 border-black">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-200 border-b-4 border-black text-xs md:text-sm uppercase tracking-widest font-black">
                            <th className="p-4 border-r-4 border-black">Employé</th>
                            <th className="p-4 border-r-4 border-black text-center">Période</th>
                            <th className="p-4 border-r-4 border-black text-right">Salaire Base</th>
                            <th className="p-4 border-r-4 border-black text-right text-red-600">Déductions (Abs)</th>
                            <th className="p-4 border-r-4 border-black text-right text-green-600">Primes (Supp)</th>
                            <th className="p-4 text-right bg-yellow-300">Net à Payer</th>
                        </tr>
                    </thead>
                    <tbody>
                        {fiches.length === 0 ? (
                            <tr><td colSpan="6" className="p-10 text-center font-black uppercase italic">Aucune fiche de paie générée.</td></tr>
                        ) : (
                            fiches.map((fiche) => (
                                <tr key={fiche.id} className="border-b-4 last:border-b-0 border-black hover:bg-gray-50 transition-colors font-bold">
                                    <td className="p-4 border-r-4 border-black uppercase">{fiche.employe}</td>
                                    <td className="p-4 border-r-4 border-black text-center">{fiche.periode_mois}/{fiche.periode_annee}</td>
                                    <td className="p-4 border-r-4 border-black text-right">{fiche.salaire_base} DH</td>
                                    <td className="p-4 border-r-4 border-black text-right text-red-500">- {fiche.deductions_absences} DH</td>
                                    <td className="p-4 border-r-4 border-black text-right text-green-500">+ {fiche.primes_supp} DH</td>
                                    <td className="p-4 text-right bg-yellow-100 font-black text-lg">{fiche.net_a_payer} DH</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default PayrollDashboard;