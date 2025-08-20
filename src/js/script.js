class SubscriptionManager {
    constructor() {
        this.subscriptions = [];
        this.currentEditId = null;
        // Exchange rate settings (relative to Malaysian Ringgit)
        this.exchangeRates = this.loadExchangeRates();
        this.lastRateUpdate = this.getLastRateUpdate();
        
        // Check if cached USD rate looks incorrect (like 1.00) and clear cache if so
        if (this.exchangeRates.USD && this.exchangeRates.USD < 2.0) {
            console.log('Detected incorrect USD exchange rate, clearing cache and using defaults');
            localStorage.removeItem('exchangeRates');
            localStorage.removeItem('lastRateUpdate');
            this.exchangeRates = this.loadExchangeRates();
            this.lastRateUpdate = null;
        }
        this.database = null;
        this.userId = window.ENV?.VITE_DEFAULT_USER_ID || 'default-user'; // Simple user identifier, should use Firebase Auth in production
        
        console.log('SubscriptionManager constructor started');
        
        // Initialize UI and event binding immediately
        this.init();
        
        // Add refresh rates button event listener
        document.addEventListener('DOMContentLoaded', () => {
            const refreshButton = document.getElementById('refresh-rates');
            if (refreshButton) {
                refreshButton.addEventListener('click', () => {
                    refreshButton.textContent = 'Updating...';
                    refreshButton.disabled = true;
                    this.forceUpdateExchangeRates().finally(() => {
                        refreshButton.textContent = 'Refresh Rates';
                        refreshButton.disabled = false;
                    });
                });
            }
        });
        
        // Load data asynchronously
        this.loadData();
    }
    
    async loadData() {
        try {
            console.log('Starting to load data...');
            await this.waitForFirebase();
            await this.loadSubscriptionsFromFirebase();
            
            // If no subscription data, load sample data
            if (this.subscriptions.length === 0) {
                await this.loadSampleData();
            }
            
            this.renderSubscriptions();
            this.updateStats();
            this.updateExchangeRates();
        } catch (error) {
            console.error('Firebase initialization failed, using local storage:', error);
            // If Firebase initialization fails, use local storage directly
            this.loadSubscriptionsFromLocalStorage();
            this.renderSubscriptions();
            this.updateStats();
            this.updateExchangeRates();
        }
    }
    
    async waitForFirebase() {
        console.log('Waiting for Firebase initialization...');
        // Wait for Firebase instance to be available, max 5 seconds
        let attempts = 0;
        const maxAttempts = 50; // 5 seconds (50 * 100ms)
        
        while (!window.firebaseDatabase && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
            if (attempts % 10 === 0) {
                console.log(`Waiting for Firebase initialization... Attempt: ${attempts}`);
            }
        }
        
        if (!window.firebaseDatabase) {
            console.error('Firebase initialization timeout');
            throw new Error('Firebase initialization timeout');
        }
        
        console.log('Firebase initialization successful');
        this.database = window.firebaseDatabase;
    }

    init() {
        console.log('Starting UI initialization and event binding...');
        this.bindEvents();
        console.log('Event binding completed');
        this.displayExchangeRateInfo();
        console.log('UI initialization completed');
    }

    bindEvents() {
        // Add subscription button
        const addBtn = document.getElementById('addSubscriptionBtn');
        if (addBtn) {
            console.log('Add subscription button found, binding event');
            addBtn.addEventListener('click', () => {
                console.log('Add subscription button clicked');
                this.openModal();
            });
        } else {
            console.error('Add subscription button not found');
        }

        // Manual exchange rate update button
        document.getElementById('updateRatesBtn').addEventListener('click', () => {
            this.forceUpdateExchangeRates();
        });

        // Close modal
        document.getElementById('closeModal').addEventListener('click', () => {
            this.closeModal();
        });

        document.getElementById('cancelBtn').addEventListener('click', () => {
            this.closeModal();
        });

        // Close when clicking outside modal
        document.getElementById('subscriptionModal').addEventListener('click', (e) => {
            if (e.target.id === 'subscriptionModal') {
                this.closeModal();
            }
        });

        // Form submission
        document.getElementById('subscriptionForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveSubscription();
        });

        // Search and filter
        document.getElementById('searchInput').addEventListener('input', () => {
            this.filterSubscriptions();
        });

        document.getElementById('categoryFilter').addEventListener('change', () => {
            this.filterSubscriptions();
        });

        document.getElementById('statusFilter').addEventListener('change', () => {
            this.filterSubscriptions();
        });


    }

    async loadSubscriptionsFromFirebase() {
        try {
            const { ref, get, child } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js');
            
            const subscriptionsRef = ref(this.database, `users/${this.userId}/subscriptions`);
            const snapshot = await get(subscriptionsRef);
            
            this.subscriptions = [];
            if (snapshot.exists()) {
                const data = snapshot.val();
                Object.keys(data).forEach(key => {
                    this.subscriptions.push({ id: key, ...data[key] });
                });
            }
            
            this.renderSubscriptions();
            this.updateStats();
            
        } catch (error) {
            console.error('Failed to load subscription data:', error);
            // Falling back to localStorage
            this.loadSubscriptionsFromLocalStorage();
        }
    }
    
    loadSubscriptionsFromLocalStorage() {
        const saved = localStorage.getItem('subscriptions');
        this.subscriptions = saved ? JSON.parse(saved) : [];
        if (this.subscriptions.length === 0) {
            this.loadSampleDataLocal();
        }
        this.renderSubscriptions();
        this.updateStats();
    }

    async saveSubscriptionToFirebase(subscription) {
        try {
            const { ref, set, push } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js');
            
            subscription.userId = this.userId;
            subscription.updatedAt = new Date().toISOString();
            
            if (subscription.id && typeof subscription.id === 'string' && subscription.id.length > 10) {
                // Update existing record
                const subscriptionRef = ref(this.database, `users/${this.userId}/subscriptions/${subscription.id}`);
                await set(subscriptionRef, subscription);
            } else {
                // Create new record
                subscription.createdAt = new Date().toISOString();
                const subscriptionsRef = ref(this.database, `users/${this.userId}/subscriptions`);
                const newSubscriptionRef = push(subscriptionsRef);
                subscription.id = newSubscriptionRef.key;
                await set(newSubscriptionRef, subscription);
            }
            
            return subscription;
        } catch (error) {
            console.error('Failed to save subscription data:', error);
            // Falling back to localStorage
            this.saveSubscriptionsToLocalStorage();
            throw error;
        }
    }
    
    async deleteSubscriptionFromFirebase(subscriptionId) {
        try {
            const { ref, remove } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js');
            
            const subscriptionRef = ref(this.database, `users/${this.userId}/subscriptions/${subscriptionId}`);
            await remove(subscriptionRef);
        } catch (error) {
            console.error('Failed to delete subscription data:', error);
            // Falling back to localStorage
            this.saveSubscriptionsToLocalStorage();
            throw error;
        }
    }
    
    saveSubscriptionsToLocalStorage() {
        localStorage.setItem('subscriptions', JSON.stringify(this.subscriptions));
    }

    loadExchangeRates() {
        const saved = localStorage.getItem('exchangeRates');
        return saved ? JSON.parse(saved) : {
            'MYR': 1.0,
            'USD': 4.5,  // Default: 1 USD = 4.5 MYR (updated default)
            'CNY': 0.65  // Default: 1 CNY = 0.65 MYR
        };
    }

    saveExchangeRates() {
        localStorage.setItem('exchangeRates', JSON.stringify(this.exchangeRates));
        localStorage.setItem('lastRateUpdate', new Date().toISOString());
    }

    getLastRateUpdate() {
        return localStorage.getItem('lastRateUpdate');
    }

    async updateExchangeRates() {
        try {
            // Check if update is needed (update every hour)
            const now = new Date();
            const lastUpdate = this.lastRateUpdate ? new Date(this.lastRateUpdate) : null;
            const hoursSinceUpdate = lastUpdate ? (now - lastUpdate) / (1000 * 60 * 60) : 24;
            
            if (hoursSinceUpdate < 1) {
                console.log('Exchange rate data is still valid, no update needed');
                return;
            }

            this.showRateUpdateStatus('Updating exchange rates...');
            
            // Use free exchange rate API (exchangerate-api.com)
            const apiUrl = window.ENV?.VITE_EXCHANGE_RATE_API_URL;
            if (!apiUrl) {
                throw new Error('Exchange rate API URL not configured');
            }
            const response = await fetch(apiUrl);
            
            if (!response.ok) {
                throw new Error('Exchange rate API request failed');
            }
            
            const data = await response.json();
            
            // Update exchange rates (convert to rates relative to MYR)
            // API returns rates from MYR to other currencies, so we need to invert for USD/CNY to MYR
            const usdRate = data.rates.USD ? (1 / data.rates.USD) : 4.5;
            const cnyRate = data.rates.CNY ? (1 / data.rates.CNY) : 0.65;
            
            this.exchangeRates = {
                'MYR': 1.0,
                'USD': usdRate,  // 1 USD = ? MYR
                'CNY': cnyRate   // 1 CNY = ? MYR
            };
            
            console.log('Updated exchange rates:', this.exchangeRates);
            
            this.saveExchangeRates();
            this.lastRateUpdate = new Date().toISOString();
            
            // Update display
             this.renderSubscriptions();
             this.updateStats();
             this.displayExchangeRateInfo();
             
             this.showRateUpdateStatus('Exchange rate update successful', 'success');
            
        } catch (error) {
            console.error('Exchange rate update failed:', error);
            this.showRateUpdateStatus('Exchange rate update failed, using cached data', 'error');
        }
    }

    showRateUpdateStatus(message, type = 'info') {
        // Create or update status message
        let statusEl = document.getElementById('rateUpdateStatus');
        if (!statusEl) {
            statusEl = document.createElement('div');
            statusEl.id = 'rateUpdateStatus';
            statusEl.className = 'rate-update-status';
            document.querySelector('.header').appendChild(statusEl);
        }
        
        statusEl.textContent = message;
        statusEl.className = `rate-update-status ${type}`;
        
        // Hide success or error message after 3 seconds
        if (type !== 'info') {
            setTimeout(() => {
                if (statusEl) {
                    statusEl.style.opacity = '0';
                    setTimeout(() => {
                        if (statusEl && statusEl.parentNode) {
                            statusEl.parentNode.removeChild(statusEl);
                        }
                    }, 300);
                }
            }, 3000);
        }
     }

     async forceUpdateExchangeRates() {
         // Force update exchange rates, ignore time limit
         try {
             this.showRateUpdateStatus('Updating exchange rates...');
             
             // Use free exchange rate API (exchangerate-api.com)
            const apiUrl = window.ENV?.VITE_EXCHANGE_RATE_API_URL;
            if (!apiUrl) {
                throw new Error('Exchange rate API URL not configured');
            }
             const response = await fetch(apiUrl);
             
             if (!response.ok) {
                 throw new Error('Exchange rate API request failed');
             }
             
             const data = await response.json();
             
             // Update exchange rates (convert to rates relative to MYR)
             // API returns rates from MYR to other currencies, so we need to invert for USD/CNY to MYR
             const usdRate = data.rates.USD ? (1 / data.rates.USD) : 4.5;
             const cnyRate = data.rates.CNY ? (1 / data.rates.CNY) : 0.65;
             
             this.exchangeRates = {
                 'MYR': 1.0,
                 'USD': usdRate,  // 1 USD = ? MYR
                 'CNY': cnyRate   // 1 CNY = ? MYR
             };
             
             console.log('Updated exchange rates:', this.exchangeRates);
             
             this.saveExchangeRates();
             this.lastRateUpdate = new Date().toISOString();
             
             // Update display
             this.renderSubscriptions();
             this.updateStats();
             this.displayExchangeRateInfo();
             
             this.showRateUpdateStatus('Exchange rate update successful', 'success');
             
         } catch (error) {
             console.error('Exchange rate update failed:', error);
             this.showRateUpdateStatus('Exchange rate update failed, using cached data', 'error');
         }
     }

     displayExchangeRateInfo() {
         const infoEl = document.getElementById('exchangeRateInfo');
         if (!infoEl) return;
         
         const usdRate = this.exchangeRates.USD.toFixed(2);
         const cnyRate = this.exchangeRates.CNY.toFixed(2);
         
         let lastUpdateText = '';
         if (this.lastRateUpdate) {
             const updateDate = new Date(this.lastRateUpdate);
             const now = new Date();
             const diffHours = Math.floor((now - updateDate) / (1000 * 60 * 60));
             
             if (diffHours < 1) {
                 lastUpdateText = 'Just updated';
             } else if (diffHours < 24) {
                 lastUpdateText = `Updated ${diffHours} hours ago`;
             } else {
                 const diffDays = Math.floor(diffHours / 24);
                 lastUpdateText = `Updated ${diffDays} days ago`;
             }
         } else {
             lastUpdateText = 'Using default rates';
         }
         
         infoEl.innerHTML = `
             <div>
                 <span class="rate-item">1 USD = RM ${usdRate}</span>
                 <span class="rate-item">1 CNY = RM ${cnyRate}</span>
             </div>
             <div class="last-update">Exchange Rate: ${lastUpdateText}</div>
         `;
     }

     openModal(subscription = null) {
        console.log('openModal method called');
        const modal = document.getElementById('subscriptionModal');
        const form = document.getElementById('subscriptionForm');
        const title = document.getElementById('modalTitle');
        
        if (!modal) {
            console.error('Modal element not found');
            return;
        }

        if (subscription) {
            // Edit mode
            title.textContent = 'Edit Subscription';
            this.currentEditId = subscription.id;
            this.fillForm(subscription);
        } else {
            // Add mode
            title.textContent = 'Add Subscription';
            this.currentEditId = null;
            form.reset();
            // Set default next billing date to next month's today
            const nextMonth = new Date();
            nextMonth.setMonth(nextMonth.getMonth() + 1);
            document.getElementById('nextBilling').value = nextMonth.toISOString().split('T')[0];
        }

        modal.classList.add('active');
    }

    closeModal() {
        const modal = document.getElementById('subscriptionModal');
        modal.classList.remove('active');
        this.currentEditId = null;
    }

    fillForm(subscription) {
        document.getElementById('serviceName').value = subscription.name;
        document.getElementById('category').value = subscription.category;
        document.getElementById('currency').value = subscription.currency || 'MYR';
        document.getElementById('monthlyPrice').value = subscription.price;
        document.getElementById('billingCycle').value = subscription.billingCycle;
        document.getElementById('nextBilling').value = subscription.nextBilling;
        document.getElementById('description').value = subscription.description || '';
        document.getElementById('status').value = subscription.status || 'active';
    }

    async saveSubscription() {
        console.log('=== saveSubscription method started ===');
        
        // Declare originalText variable at the beginning to ensure access in finally block
        const saveBtn = document.querySelector('#subscriptionForm button[type="submit"]');
        const originalText = saveBtn ? saveBtn.textContent : '';
        
        try {
            // Check Firebase connection status
            console.log('Checking Firebase connection status...');
            if (!this.database) {
                console.error('Firebase database not initialized');
                alert('Database connection failed, please refresh the page and try again');
                return;
            }
            console.log('Firebase database connected');
            
            // Collect form data
            console.log('Starting to collect form data...');
            const formElements = {
                serviceName: document.getElementById('serviceName'),
                category: document.getElementById('category'),
                currency: document.getElementById('currency'),
                monthlyPrice: document.getElementById('monthlyPrice'),
                billingCycle: document.getElementById('billingCycle'),
                nextBilling: document.getElementById('nextBilling'),
                description: document.getElementById('description'),
                status: document.getElementById('status')
            };
            
            // Check if form elements exist
            for (const [key, element] of Object.entries(formElements)) {
                if (!element) {
                    console.error(`Form element ${key} not found`);
                    alert(`Form error: ${key} field not found`);
                    return;
                }
            }
            console.log('All form elements found');
            
            const formData = {
                name: formElements.serviceName.value.trim(),
                category: formElements.category.value,
                currency: formElements.currency.value,
                price: parseFloat(formElements.monthlyPrice.value),
                billingCycle: formElements.billingCycle.value,
                nextBilling: formElements.nextBilling.value,
                description: formElements.description.value.trim(),
                status: formElements.status.value
            };
            
            console.log('Form data collection completed:', formData);
            
            // Validate form data
            console.log('Starting form data validation...');
            if (!formData.name) {
                alert('Please enter service name');
                return;
            }
            if (!formData.price || isNaN(formData.price) || formData.price <= 0) {
                alert('Please enter a valid price');
                return;
            }
            if (!formData.nextBilling) {
                alert('Please select next billing date');
                return;
            }
            console.log('Form data validation passed');

            // Show save status
            if (saveBtn) {
                saveBtn.textContent = 'Saving...';
                saveBtn.disabled = true;
            }

            let subscription;
            if (this.currentEditId) {
                console.log('Editing existing subscription, ID:', this.currentEditId);
                // Edit existing subscription
                formData.id = this.currentEditId;
                formData.createdAt = this.subscriptions.find(s => s.id === this.currentEditId)?.createdAt || new Date().toISOString();
                formData.updatedAt = new Date().toISOString();
                
                subscription = await this.saveSubscriptionToFirebase(formData);
                console.log('Firebase save successful (edit):', subscription);
                
                const index = this.subscriptions.findIndex(sub => sub.id === this.currentEditId);
                if (index !== -1) {
                    this.subscriptions[index] = subscription;
                    console.log('Local data update successful (edit)');
                } else {
                    console.error('Subscription to edit not found');
                }
            } else {
                console.log('Adding new subscription');
                // Add new subscription
                subscription = await this.saveSubscriptionToFirebase(formData);
                console.log('Firebase save successful (new):', subscription);
                
                this.subscriptions.push(subscription);
                console.log('Local data update successful (new)');
            }

            // Update UI
            console.log('Starting UI update...');
            this.renderSubscriptions();
            this.updateStats();
            this.closeModal();
            console.log('UI update completed');
            
            // Show success message
            alert('Subscription saved successfully!');
            console.log('=== saveSubscription execution completed ===');
            
        } catch (error) {
            console.error('=== saveSubscription execution failed ===');
            console.error('Error details:', error);
            console.error('Error stack:', error.stack);
            
            // Try fallback to local storage
            console.log('Trying fallback to local storage...');
            try {
                this.saveSubscriptionsToLocalStorage();
                console.log('Local storage save successful');
                alert('Network save failed, saved to local storage');
            } catch (localError) {
                console.error('Local storage also failed:', localError);
                alert('Save failed, please check network connection and try again');
            }
        } finally {
            // Restore button state
            if (saveBtn) {
                saveBtn.textContent = originalText || 'Save';
                saveBtn.disabled = false;
            }
        }
    }

    async deleteSubscription(id) {
        if (confirm('Are you sure you want to delete this subscription?')) {
            try {
                console.log('Deleting subscription:', id);
                await this.deleteSubscriptionFromFirebase(id);
                this.subscriptions = this.subscriptions.filter(sub => sub.id !== id);
                this.renderSubscriptions();
                this.updateStats();
                console.log('Delete successful');
            } catch (error) {
                console.error('Delete failed:', error);
                alert('Delete failed, please try again');
            }
        }
    }

    calculateMonthlyPrice(subscription) {
        const { price, billingCycle } = subscription;
        let monthlyPrice;
        switch (billingCycle) {
            case 'yearly':
                monthlyPrice = price / 12;
                break;
            case 'quarterly':
                monthlyPrice = price / 3;
                break;
            default:
                monthlyPrice = price;
        }
        return monthlyPrice;
    }

    convertToMYR(price, currency) {
        const rate = this.exchangeRates[currency] || 1.0;
        return price * rate;
    }

    calculateMonthlyPriceInMYR(subscription) {
        const monthlyPrice = this.calculateMonthlyPrice(subscription);
        return this.convertToMYR(monthlyPrice, subscription.currency || 'MYR');
    }

    formatPrice(price, currency = 'MYR') {
        const symbols = {
            'MYR': 'RM',
            'USD': '$',
            'CNY': '¥'
        };
        const symbol = symbols[currency] || 'RM';
        return `${symbol}${price.toFixed(2)}`;
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('zh-CN');
    }

    getCategoryName(category) {
        const categories = {
            streaming: 'Streaming',
            software: 'Software Tools',
            cloud: 'Cloud Services',
            gaming: 'Gaming',
            education: 'Education',
            other: 'Other'
        };
        return categories[category] || category;
    }

    getBillingCycleName(cycle) {
        const cycles = {
            monthly: 'Monthly',
            yearly: 'Yearly',
            quarterly: 'Quarterly'
        };
        return cycles[cycle] || cycle;
    }

    getDaysUntilBilling(dateString) {
        const today = new Date();
        const billingDate = new Date(dateString);
        const diffTime = billingDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    }

    renderSubscriptions(subscriptionsToRender = null) {
        const grid = document.getElementById('subscriptionsGrid');
        const subscriptions = subscriptionsToRender || this.subscriptions;

        if (subscriptions.length === 0) {
            grid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-inbox"></i>
                    <h3>No subscriptions</h3>
                    <p>Click "Add Subscription" button to start managing your subscription services</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = subscriptions.map(subscription => {
            const monthlyPrice = this.calculateMonthlyPrice(subscription);
            const monthlyPriceInMYR = this.calculateMonthlyPriceInMYR(subscription);
            const daysUntil = this.getDaysUntilBilling(subscription.nextBilling);
            const isOverdue = daysUntil < 0;
            const isUpcoming = daysUntil <= 7 && daysUntil >= 0;
            const currency = subscription.currency || 'MYR';
            const isNonMYR = currency !== 'MYR';

            return `
                <div class="subscription-card ${subscription.category} ${subscription.status === 'inactive' ? 'inactive' : ''}" data-category="${subscription.category}" data-status="${subscription.status || 'active'}">
                    ${subscription.status === 'inactive' ? '<span class="status-badge inactive status-top-right">Inactive</span>' : '<span class="status-badge active status-top-right">Active</span>'}
                    <div class="card-header">
                        <div>
                            <div class="service-name">${subscription.name}</div>
                            <span class="category-badge">${this.getCategoryName(subscription.category)}</span>
                        </div>
                    </div>
                    <div class="price">
                        ${this.formatPrice(monthlyPriceInMYR, 'MYR')}/month
                        ${isNonMYR ? `<div class="original-price">(Original: ${this.formatPrice(monthlyPrice, currency)}/month)</div>` : ''}
                    </div>
                    <div class="billing-info">
                        Actual Cost: ${this.formatPrice(this.convertToMYR(subscription.price, currency), 'MYR')} (${this.getBillingCycleName(subscription.billingCycle)})
                        ${isNonMYR ? `<br><small>Original: ${this.formatPrice(subscription.price, currency)}</small>` : ''}
                    </div>
                    <div class="next-billing ${isOverdue ? 'overdue' : isUpcoming ? 'upcoming' : ''}">
                        <i class="fas fa-calendar-alt"></i>
                        Next Billing: ${this.formatDate(subscription.nextBilling)}
                        ${isOverdue ? ' (Overdue)' : isUpcoming ? ` (${daysUntil} days later)` : ''}
                    </div>
                    ${subscription.description ? `<div class="description">${subscription.description}</div>` : ''}
                    <div class="card-actions">
                        <button class="btn btn-secondary btn-small" onclick="subscriptionManager.openModal(${JSON.stringify(subscription).replace(/"/g, '&quot;')})">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn btn-danger btn-small" onclick="subscriptionManager.deleteSubscription('${subscription.id}')">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    updateStats() {
        const count = this.subscriptions.length;
        const activeSubscriptions = this.subscriptions.filter(sub => (sub.status || 'active') === 'active');
        
        // Only calculate costs for active subscriptions (unified calculation using MYR)
        const totalMonthlyInMYR = activeSubscriptions.reduce((sum, sub) => {
            return sum + this.calculateMonthlyPriceInMYR(sub);
        }, 0);
        const average = activeSubscriptions.length > 0 ? totalMonthlyInMYR / activeSubscriptions.length : 0;
        
        document.getElementById('totalExpense').textContent = this.formatPrice(totalMonthlyInMYR, 'MYR');
        document.getElementById('averageExpense').textContent = this.formatPrice(average, 'MYR');
        document.getElementById('subscriptionCount').textContent = `${count} (${activeSubscriptions.length} Active)`;
    }

    filterSubscriptions() {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        const categoryFilter = document.getElementById('categoryFilter').value;
        const statusFilter = document.getElementById('statusFilter').value;

        let filtered = this.subscriptions;

        // Filter by category
        if (categoryFilter !== 'all') {
            filtered = filtered.filter(sub => sub.category === categoryFilter);
        }

        // Filter by status
        if (statusFilter !== 'all') {
            filtered = filtered.filter(sub => (sub.status || 'active') === statusFilter);
        }

        // Filter by search term
        if (searchTerm) {
            filtered = filtered.filter(sub => 
                sub.name.toLowerCase().includes(searchTerm) ||
                sub.description.toLowerCase().includes(searchTerm)
            );
        }

        this.renderSubscriptions(filtered);
    }

    async loadSampleData() {
        const sampleData = [
            {
                name: 'Netflix',
                category: 'streaming',
                price: 45,
                billingCycle: 'monthly',
                currency: 'MYR',
                nextBilling: '2024-02-15',
                description: 'Streaming video service',
                status: 'active'
            },
            {
                name: 'Adobe Creative Cloud',
                category: 'software',
                price: 52.99,
                billingCycle: 'monthly',
                currency: 'USD',
                nextBilling: '2024-12-01',
                description: 'Creative design software suite',
                status: 'active'
            },
            {
                name: 'iCloud+',
                category: 'cloud',
                price: 21,
                billingCycle: 'monthly',
                currency: 'CNY',
                nextBilling: '2024-02-10',
                description: 'Apple cloud storage service',
                status: 'inactive'
            }
        ];
        
        // Save sample data to Firebase
        for (const subscription of sampleData) {
            try {
                const savedSubscription = await this.saveSubscriptionToFirebase(subscription);
                this.subscriptions.push(savedSubscription);
            } catch (error) {
                console.error('Failed to save sample data:', error);
            }
        }
    }
    
    loadSampleDataLocal() {
        const sampleData = [
            {
                id: '1',
                name: 'Netflix',
                category: 'streaming',
                currency: 'MYR',
                price: 45,
                billingCycle: 'monthly',
                nextBilling: '2024-02-15',
                description: 'HD video streaming service',
                status: 'active',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            },
            {
                id: '2',
                name: 'Adobe Creative Cloud',
                category: 'software',
                currency: 'USD',
                price: 52.99,
                billingCycle: 'monthly',
                nextBilling: '2024-12-01',
                description: 'Creative design software suite',
                status: 'active',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            },
            {
                id: '3',
                name: 'iCloud+',
                category: 'cloud',
                currency: 'CNY',
                price: 21,
                billingCycle: 'monthly',
                nextBilling: '2024-02-10',
                description: '200GB cloud storage space',
                status: 'inactive',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }
        ];
        
        this.subscriptions = sampleData;
        this.saveSubscriptionsToLocalStorage();
    }


}

// Initialize application
let subscriptionManager;

// Ensure DOM is fully loaded before initialization
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('DOM loaded, initializing SubscriptionManager');
        subscriptionManager = new SubscriptionManager();
    });
} else {
    // DOM already loaded
    console.log('DOM already loaded, initializing SubscriptionManager directly');
    subscriptionManager = new SubscriptionManager();
}

// Add CSS styles for overdue and upcoming billing reminders
const style = document.createElement('style');
style.textContent = `
    .next-billing {
        margin-top: 15px;
    }
    
    .next-billing.overdue {
        background: #ffebee;
        color: #c62828;
    }
    
    .next-billing.upcoming {
        background: #fff3e0;
        color: #ef6c00;
    }
    
    .description {
        color: #666;
        font-size: 0.9rem;
        margin-bottom: 15px;
        font-style: italic;
    }
`;
document.head.appendChild(style);

// Add keyboard shortcut support
document.addEventListener('keydown', (e) => {
    // Esc key to close modal
    if (e.key === 'Escape') {
        const modal = document.getElementById('subscriptionModal');
        if (modal.classList.contains('active')) {
            subscriptionManager.closeModal();
        }
    }
    
    // Ctrl+N to add new subscription
    if (e.ctrlKey && e.key === 'n') {
        e.preventDefault();
        subscriptionManager.openModal();
    }
});