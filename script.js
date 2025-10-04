// Agreement Tracker Application
class AgreementTracker {
    constructor() {
        this.agreements = [];
        this.baseTokenNo = 1;
        this.init();
    }

    init() {
        this.loadFromStorage();
        this.setupEventListeners();
        this.updateTokenNoField();
        this.renderAgreements();
    }

    setupEventListeners() {
        // Form submission
        document.getElementById('agreementForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addAgreement();
        });

        // Base token number change
        document.getElementById('baseTokenNo').addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            if (value && value > 0) {
                this.baseTokenNo = value;
                this.saveToStorage();
                this.updateTokenNoField();
            }
        });

        // Export data
        document.getElementById('exportBtn').addEventListener('click', () => {
            this.exportData();
        });

        // Import data
        document.getElementById('importBtn').addEventListener('click', () => {
            document.getElementById('importFile').click();
        });

        document.getElementById('importFile').addEventListener('change', (e) => {
            this.importData(e);
        });

        // Update base token number from storage
        const savedBaseToken = localStorage.getItem('baseTokenNo');
        if (savedBaseToken) {
            this.baseTokenNo = parseInt(savedBaseToken);
            document.getElementById('baseTokenNo').value = this.baseTokenNo;
        }
    }

    updateTokenNoField() {
        const nextTokenNo = this.getNextTokenNo();
        document.getElementById('tokenNo').value = nextTokenNo;
    }

    getNextTokenNo() {
        if (this.agreements.length === 0) {
            return this.baseTokenNo;
        }
        // Get the highest token number and increment
        const highestToken = Math.max(...this.agreements.map(a => parseInt(a.tokenNo) || 0));
        return Math.max(this.baseTokenNo, highestToken + 1);
    }

    addAgreement() {
        const address = document.getElementById('address').value.trim();
        const flatNo = document.getElementById('flatNo').value.trim();
        const location = document.getElementById('location').value.trim();
        const paidCustomer = document.getElementById('paidCustomer').checked;
        const paidSelf = document.getElementById('paidSelf').checked;
        const tokenNo = this.getNextTokenNo();

        if (!address || !flatNo || !location) {
            this.showToast('Please fill in all required fields!', 'error');
            return;
        }

        const agreement = {
            id: Date.now(),
            tokenNo: tokenNo,
            address: address,
            flatNo: flatNo,
            location: location,
            paidCustomer: paidCustomer,
            paidSelf: paidSelf
        };

        this.agreements.push(agreement);
        this.saveToStorage();
        this.renderAgreements();
        this.resetForm();
        this.updateTokenNoField();
        this.showToast('Agreement added successfully!', 'success');
    }

    deleteAgreement(id) {
        const row = document.querySelector(`tr[data-id="${id}"]`);
        if (row) {
            row.classList.add('removing');
            setTimeout(() => {
                this.agreements = this.agreements.filter(a => a.id !== id);
                this.saveToStorage();
                this.renderAgreements();
                this.showToast('Agreement deleted successfully!', 'info');
            }, 500);
        }
    }

    togglePaymentStatus(id, field) {
        const agreement = this.agreements.find(a => a.id === id);
        if (agreement) {
            agreement[field] = !agreement[field];
            this.saveToStorage();
            
            // Check if both are paid and auto-remove
            if (agreement.paidCustomer && agreement.paidSelf) {
                setTimeout(() => {
                    const row = document.querySelector(`tr[data-id="${id}"]`);
                    if (row) {
                        row.classList.add('removing');
                        setTimeout(() => {
                            this.agreements = this.agreements.filter(a => a.id !== id);
                            this.saveToStorage();
                            this.renderAgreements();
                            this.showToast('Agreement completed and removed!', 'success');
                        }, 500);
                    }
                }, 300);
            } else {
                this.renderAgreements();
            }
        }
    }

    renderAgreements() {
        const tbody = document.getElementById('agreementsBody');
        
        if (this.agreements.length === 0) {
            tbody.innerHTML = `
                <tr class="empty-state">
                    <td colspan="7">
                        <div class="empty-state-content">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="12" y1="8" x2="12" y2="12"></line>
                                <line x1="12" y1="16" x2="12.01" y2="16"></line>
                            </svg>
                            <p>No agreements found. Add your first agreement to get started!</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = this.agreements.map(agreement => `
            <tr data-id="${agreement.id}">
                <td><strong>${agreement.tokenNo}</strong></td>
                <td>${agreement.address}</td>
                <td>${agreement.flatNo}</td>
                <td>${agreement.location}</td>
                <td>
                    <label class="checkbox-label" style="margin: 0;">
                        <input type="checkbox" 
                               ${agreement.paidCustomer ? 'checked' : ''} 
                               onchange="app.togglePaymentStatus(${agreement.id}, 'paidCustomer')">
                        <span class="checkbox-custom"></span>
                        ${agreement.paidCustomer ? 
                            '<span class="status-badge status-paid">✓ Paid</span>' : 
                            '<span class="status-badge status-unpaid">✗ Unpaid</span>'}
                    </label>
                </td>
                <td>
                    <label class="checkbox-label" style="margin: 0;">
                        <input type="checkbox" 
                               ${agreement.paidSelf ? 'checked' : ''} 
                               onchange="app.togglePaymentStatus(${agreement.id}, 'paidSelf')">
                        <span class="checkbox-custom"></span>
                        ${agreement.paidSelf ? 
                            '<span class="status-badge status-paid">✓ Paid</span>' : 
                            '<span class="status-badge status-unpaid">✗ Unpaid</span>'}
                    </label>
                </td>
                <td>
                    <button class="btn btn-danger" onclick="app.deleteAgreement(${agreement.id})">
                        <svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                        Delete
                    </button>
                </td>
            </tr>
        `).join('');
    }

    resetForm() {
        document.getElementById('agreementForm').reset();
        this.updateTokenNoField();
    }

    saveToStorage() {
        localStorage.setItem('agreements', JSON.stringify(this.agreements));
        localStorage.setItem('baseTokenNo', this.baseTokenNo.toString());
    }

    loadFromStorage() {
        const savedAgreements = localStorage.getItem('agreements');
        const savedBaseToken = localStorage.getItem('baseTokenNo');
        
        if (savedAgreements) {
            try {
                this.agreements = JSON.parse(savedAgreements);
            } catch (e) {
                console.error('Error loading agreements:', e);
                this.agreements = [];
            }
        }
        
        if (savedBaseToken) {
            this.baseTokenNo = parseInt(savedBaseToken);
            document.getElementById('baseTokenNo').value = this.baseTokenNo;
        }
    }

    exportData() {
        const data = {
            agreements: this.agreements,
            baseTokenNo: this.baseTokenNo,
            exportDate: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `agreements-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showToast('Data exported successfully!', 'success');
    }

    importData(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                
                if (data.agreements && Array.isArray(data.agreements)) {
                    this.agreements = data.agreements;
                    if (data.baseTokenNo) {
                        this.baseTokenNo = data.baseTokenNo;
                        document.getElementById('baseTokenNo').value = this.baseTokenNo;
                    }
                    this.saveToStorage();
                    this.renderAgreements();
                    this.updateTokenNoField();
                    this.showToast('Data imported successfully!', 'success');
                } else {
                    this.showToast('Invalid file format!', 'error');
                }
            } catch (error) {
                console.error('Import error:', error);
                this.showToast('Error importing data!', 'error');
            }
        };
        reader.readAsText(file);
        
        // Reset file input
        event.target.value = '';
    }

    showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = `toast ${type} show`;
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
}

// Initialize the app
const app = new AgreementTracker();

// Add some helpful console messages
console.log('%c🎉 Agreement Tracker Loaded Successfully!', 'color: #6366f1; font-size: 16px; font-weight: bold;');
console.log('%c📝 Use the form to add agreements', 'color: #8b5cf6; font-size: 12px;');
console.log('%c💾 Data is automatically saved to localStorage', 'color: #10b981; font-size: 12px;');
