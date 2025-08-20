// 🔄 MNS Group - Sistema Sincronizzazione Real-Time
// File: sync-config.js

class MNSRealTimeSync {
    constructor() {
        this.systems = {
            crm: 'https://gianlucamadeddu.github.io/mns-crm-marchi/',
            perizie: 'https://gianlucamadeddu.github.io/sistema-perizie-marchi/',
            portal: 'https://gianlucamadeddu.github.io/mns-portal/',
            anagrafica: 'https://gianlucamadeddu.github.io/anagrafica-clienti/'
        };
        
        this.syncInterval = 30000; // 30 secondi
        this.lastSync = {};
        this.isOnline = true;
        this.cache = new Map();
        
        this.initSync();
    }

    // 🚀 Inizializza sistema sincronizzazione
    initSync() {
        console.log('🔄 Avvio sistema sincronizzazione MNS Group...');
        
        // Check connessione
        this.checkConnection();
        
        // Avvia sync periodico
        this.startPeriodicSync();
        
        // Event listeners
        this.setupEventListeners();
        
        // Prima sincronizzazione
        this.fullSync();
    }

    // 🌐 Verifica connessione sistemi
    async checkConnection() {
        const status = {};
        
        for (const [name, url] of Object.entries(this.systems)) {
            try {
                const response = await fetch(url, { 
                    method: 'HEAD',
                    mode: 'no-cors',
                    timeout: 5000 
                });
                status[name] = {
                    online: true,
                    lastCheck: new Date(),
                    url: url
                };
                console.log(`✅ ${name} - Online`);
            } catch (error) {
                status[name] = {
                    online: false,
                    lastCheck: new Date(),
                    error: error.message,
                    url: url
                };
                console.log(`❌ ${name} - Offline: ${error.message}`);
            }
        }
        
        this.updateSystemStatus(status);
        return status;
    }

    // 📊 Sincronizzazione completa dati
    async fullSync() {
        console.log('📊 Avvio sincronizzazione completa...');
        
        try {
            const syncPromises = [
                this.syncCRMData(),
                this.syncPerizieData(),
                this.syncAnagraficaData(),
                this.syncPortalData()
            ];
            
            const results = await Promise.allSettled(syncPromises);
            
            // Processa risultati
            results.forEach((result, index) => {
                const systemName = Object.keys(this.systems)[index];
                if (result.status === 'fulfilled') {
                    console.log(`✅ Sync ${systemName} completato`);
                    this.lastSync[systemName] = new Date();
                } else {
                    console.error(`❌ Errore sync ${systemName}:`, result.reason);
                }
            });
            
            // Aggiorna dashboard
            this.updateDashboard();
            
            // Notifica utenti
            this.notifyUsers('sync_complete');
            
        } catch (error) {
            console.error('❌ Errore sincronizzazione:', error);
            this.handleSyncError(error);
        }
    }

    // 🏛️ Sincronizza CRM Marchi
    async syncCRMData() {
        try {
            // Simula API call al CRM
            const crmData = await this.fetchWithFallback('crm', '/api/stats');
            
            const data = {
                domandeAttive: this.calculateTotalDomande(),
                domandePerUtente: this.getDomandePerUtente(),
                scadenzeImminenti: this.getScadenzeImminenti(),
                ultimaAttivita: this.getUltimaAttivitaCRM(),
                timestamp: new Date()
            };
            
            // Cache e aggiorna
            this.cache.set('crm_data', data);
            this.updateCRMDisplay(data);
            
            return data;
        } catch (error) {
            console.error('❌ Errore sync CRM:', error);
            return this.getCachedData('crm_data');
        }
    }

    // 💰 Sincronizza Sistema Perizie
    async syncPerizieData() {
        try {
            const perizieData = await this.fetchWithFallback('perizie', '/api/valuations');
            
            const data = {
                perizieAttive: this.calculatePerizieAttive(),
                valorePortfolio: this.calculateValorePortfolio(),
                periziePerUtente: this.getPeriziePerUtente(),
                ultimePerizie: this.getUltiePerizie(),
                timestamp: new Date()
            };
            
            this.cache.set('perizie_data', data);
            this.updatePerizieDisplay(data);
            
            return data;
        } catch (error) {
            console.error('❌ Errore sync Perizie:', error);
            return this.getCachedData('perizie_data');
        }
    }

    // 👥 Sincronizza Anagrafica Clienti
    async syncAnagraficaData() {
        try {
            const anagraficaData = await this.fetchWithFallback('anagrafica', '/api/clients');
            
            const data = {
                clientiTotali: this.calculateClientiTotali(),
                nuoviClienti: this.getNuoviClienti(),
                clientiPerUtente: this.getClientiPerUtente(),
                ultimiClienti: this.getUltimiClienti(),
                timestamp: new Date()
            };
            
            this.cache.set('anagrafica_data', data);
            this.updateAnagraficaDisplay(data);
            
            return data;
        } catch (error) {
            console.error('❌ Errore sync Anagrafica:', error);
            return this.getCachedData('anagrafica_data');
        }
    }

    // 🎓 Sincronizza Portale Formazione
    async syncPortalData() {
        try {
            const portalData = await this.fetchWithFallback('portal', '/api/progress');
            
            const data = {
                progressoMedio: this.calculateProgressoMedio(),
                moduliCompletati: this.getModuliCompletati(),
                progressoPerUtente: this.getProgressoPerUtente(),
                ultimiCompletamenti: this.getUltimiCompletamenti(),
                timestamp: new Date()
            };
            
            this.cache.set('portal_data', data);
            this.updatePortalDisplay(data);
            
            return data;
        } catch (error) {
            console.error('❌ Errore sync Portal:', error);
            return this.getCachedData('portal_data');
        }
    }

    // 🔄 Avvia sincronizzazione periodica
    startPeriodicSync() {
        setInterval(async () => {
            if (this.isOnline) {
                console.log('🔄 Sync automatico...');
                await this.fullSync();
            }
        }, this.syncInterval);
        
        console.log(`⏰ Sync automatico attivato ogni ${this.syncInterval/1000} secondi`);
    }

    // 📱 Setup event listeners
    setupEventListeners() {
        // Online/Offline detection
        window.addEventListener('online', () => {
            this.isOnline = true;
            console.log('🌐 Connessione ripristinata');
            this.fullSync();
        });
        
        window.addEventListener('offline', () => {
            this.isOnline = false;
            console.log('📴 Modalità offline attivata');
        });
        
        // Visibilità pagina
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && this.isOnline) {
                this.fullSync();
            }
        });
        
        // Storage sync cross-tab
        window.addEventListener('storage', (e) => {
            if (e.key === 'mns_sync_trigger') {
                this.fullSync();
            }
        });
    }

    // 🎯 Metodi di calcolo dati
    calculateTotalDomande() {
        // Calcola da tutti gli utenti
        const users = ['gianluca', 'simone', 'andrea', 'nicola', 'gabriele'];
        return users.reduce((total, user) => {
            return total + (this.getUserData(user)?.domandeAttive || 0);
        }, 0);
    }

    calculateValorePortfolio() {
        // Calcola valore totale dalle perizie
        const perizie = this.getCachedData('perizie_list') || [];
        return perizie.reduce((total, perizia) => {
            return total + (perizia.valore || 0);
        }, 0);
    }

    calculateClientiTotali() {
        // Database unificato clienti (no duplicazioni)
        const clienti = this.getCachedData('clienti_list') || [];
        return new Set(clienti.map(c => c.id)).size;
    }

    // 📊 Aggiornamento display dashboard
    updateDashboard() {
        const totalDomande = this.calculateTotalDomande();
        const totalClienti = this.calculateClientiTotali();
        const totalValore = this.calculateValorePortfolio();
        const totalScadenze = this.getScadenzeImminenti().length;
        
        // Aggiorna elementi DOM
        this.updateElement('totalDomande', totalDomande);
        this.updateElement('totalClienti', totalClienti);
        this.updateElement('totalValore', this.formatCurrency(totalValore));
        this.updateElement('totalScadenze', totalScadenze);
        
        // Aggiorna timestamp ultimo sync
        this.updateElement('lastSyncTime', new Date().toLocaleTimeString('it-IT'));
        
        console.log(`📊 Dashboard aggiornata: ${totalDomande} domande, ${totalClienti} clienti, ${this.formatCurrency(totalValore)}`);
    }

    // 🔧 Utility methods
    async fetchWithFallback(system, endpoint) {
        try {
            // In produzione, implementare API reali
            // Per ora simula dati
            return this.simulateAPIResponse(system, endpoint);
        } catch (error) {
            return this.getCachedData(`${system}_data`);
        }
    }

    simulateAPIResponse(system, endpoint) {
        // Simula risposta API per sviluppo
        const mockData = {
            crm: { domande: 127, scadenze: 15 },
            perizie: { attive: 28, valore: 7800000 },
            anagrafica: { clienti: 65, nuovi: 12 },
            portal: { progresso: 71, moduli: 35 }
        };
        return mockData[system] || {};
    }

    getCachedData(key) {
        return this.cache.get(key) || {};
    }

    updateElement(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('it-IT', {
            style: 'currency',
            currency: 'EUR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    }

    // 📢 Sistema notifiche
    notifyUsers(type, data = {}) {
        const notifications = {
            sync_complete: '✅ Dati sincronizzati',
            sync_error: '❌ Errore sincronizzazione',
            new_activity: '🔔 Nuova attività',
            deadline_alert: '⚠️ Scadenza imminente'
        };
        
        const message = notifications[type] || 'Notifica';
        console.log(`📢 ${message}`, data);
        
        // Aggiorna badge notifiche
        this.updateNotificationBadge();
    }

    updateNotificationBadge() {
        const badge = document.getElementById('notificationCount');
        if (badge) {
            const count = this.getUnreadNotifications();
            badge.textContent = count;
            badge.style.display = count > 0 ? 'flex' : 'none';
        }
    }

    getUnreadNotifications() {
        // Calcola notifiche non lette
        const scadenze = this.getScadenzeImminenti().length;
        const nuoveAttivita = this.getNuoveAttivita().length;
        return scadenze + nuoveAttivita;
    }

    // 📋 Gestione errori
    handleSyncError(error) {
        console.error('🚨 Errore critico sincronizzazione:', error);
        
        // Fallback ai dati cached
        this.notifyUsers('sync_error', { error: error.message });
        
        // Retry automatico dopo 60 secondi
        setTimeout(() => {
            if (this.isOnline) {
                this.fullSync();
            }
        }, 60000);
    }
}

// 🚀 Inizializza sistema al caricamento
window.addEventListener('DOMContentLoaded', () => {
    window.mnsSync = new MNSRealTimeSync();
    console.log('🏛️ MNS Group Portal - Sistema Real-Time attivato!');
});

// 🔧 Export per utilizzo esterno
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MNSRealTimeSync;
}
