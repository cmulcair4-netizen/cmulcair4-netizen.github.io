// ========================================
// FLIPFORGE PWA - ENHANCED MAIN APPLICATION
// ========================================

class FlipForge {
    constructor() {
        this.state = {
            startBankroll: 200,
            targetBankroll: 2000,
            currentBankroll: 200,
            minROI: 40,
            sellCost: 5,
            transportCost: 5,
            currency: 'EUR',
            theme: 'system',
            notificationsEnabled: false,
            deals: [],
            ledger: [],
            selectedDealForAnalysis: null,
            selectedDealForMessage: null,
            currentPage: 'home',
            lastSync: null,
            appVersion: '1.0.0'
        };

        this.levels = [
            { level: 1, title: 'Scout', threshold: 0, emoji: '🔍' },
            { level: 2, title: 'Hunter', threshold: 300, emoji: '🎯' },
            { level: 3, title: 'Flipper', threshold: 500, emoji: '🔄' },
            { level: 4, title: 'Deal Maker', threshold: 800, emoji: '💼' },
            { level: 5, title: 'FlipForge Pro', threshold: 1200, emoji: '⭐' },
            { level: 6, title: 'Profit Hunter', threshold: 1600, emoji: '🏆' },
            { level: 7, title: '€2K Boss', threshold: 2000, emoji: '👑' }
        ];

        this.loadState();
        this.initUI();
        this.attachEventListeners();
        this.applyTheme();
        this.updateAllDisplays();
        this.setupNotifications();
        this.checkForUpdates();
    }

    // ========================================
    // STATE MANAGEMENT & STORAGE
    // ========================================

    loadState() {
        const saved = localStorage.getItem('flipforge-state');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                this.state = { ...this.state, ...parsed };
            } catch (e) {
                console.error('Failed to load state:', e);
            }
        }
    }

    saveState() {
        localStorage.setItem('flipforge-state', JSON.stringify(this.state));
        this.state.lastSync = new Date().toISOString();
    }

    // Sync state across tabs
    setupSyncListener() {
        window.addEventListener('storage', (e) => {
            if (e.key === 'flipforge-state' && e.newValue) {
                try {
                    this.state = JSON.parse(e.newValue);
                    this.updateAllDisplays();
                } catch (error) {
                    console.error('Failed to sync state:', error);
                }
            }
        });
    }

    // ========================================
    // UI INITIALIZATION
    // ========================================

    initUI() {
        document.querySelectorAll('.nav-button').forEach(btn => {
            btn.addEventListener('click', () => this.navigateTo(btn.dataset.page));
        });

        this.applyTheme();
        this.navigateTo('home');
        this.setupSyncListener();
    }

    attachEventListeners() {
        // Hunt page
        document.getElementById('analyseDealButton').addEventListener('click', () => this.analyseAdvertText());
        document.getElementById('quickAnalyseButton').addEventListener('click', () => this.analyseQuickEntry());
        document.getElementById('huntButton').addEventListener('click', () => this.navigateTo('hunt'));
        document.getElementById('huntFromDeals').addEventListener('click', () => this.navigateTo('hunt'));

        // Analysis page
        document.getElementById('backFromAnalysis').addEventListener('click', () => this.navigateTo('deals'));
        document.getElementById('backFromDetail').addEventListener('click', () => this.navigateTo('deals'));

        // Deals page
        document.querySelectorAll('.filter-button').forEach(btn => {
            btn.addEventListener('click', () => this.filterDeals(btn.dataset.filter));
        });

        // Ledger page
        document.getElementById('addTransactionButton').addEventListener('click', () => this.openTransactionModal());
        document.getElementById('saveTransactionButton').addEventListener('click', () => this.saveTransaction());
        document.getElementById('cancelTransactionButton').addEventListener('click', () => this.closeTransactionModal());
        document.getElementById('closeTransactionModal').addEventListener('click', () => this.closeTransactionModal());

        // Settings page
        document.getElementById('settingStartBankroll').addEventListener('change', (e) => {
            this.state.startBankroll = parseFloat(e.target.value);
            this.saveState();
            this.updateAllDisplays();
        });
        document.getElementById('settingTargetBankroll').addEventListener('change', (e) => {
            this.state.targetBankroll = parseFloat(e.target.value);
            this.saveState();
            this.updateAllDisplays();
        });
        document.getElementById('settingMinROI').addEventListener('change', (e) => {
            this.state.minROI = parseInt(e.target.value);
            this.saveState();
        });
        document.getElementById('settingSellCost').addEventListener('change', (e) => {
            this.state.sellCost = e.target.value;
            this.saveState();
        });
        document.getElementById('settingTransportCost').addEventListener('change', (e) => {
            this.state.transportCost = parseFloat(e.target.value);
            this.saveState();
        });
        document.getElementById('settingCurrency').addEventListener('change', (e) => {
            this.state.currency = e.target.value;
            this.saveState();
            this.updateAllDisplays();
        });
        document.getElementById('settingTheme').addEventListener('change', (e) => {
            this.state.theme = e.target.value;
            this.saveState();
            this.applyTheme();
        });
        document.getElementById('settingNotifications').addEventListener('change', (e) => {
            this.state.notificationsEnabled = e.target.checked;
            this.saveState();
            if (e.target.checked) {
                this.requestNotificationPermission();
            }
        });

        // Data management
        document.getElementById('exportDataButton').addEventListener('click', () => this.exportData());
        document.getElementById('importDataButton').addEventListener('click', () => {
            document.getElementById('importFileInput').click();
        });
        document.getElementById('importFileInput').addEventListener('change', (e) => this.importData(e));
        document.getElementById('clearAllButton').addEventListener('click', () => {
            if (confirm('Are you sure? This will delete all data.')) {
                localStorage.clear();
                location.reload();
            }
        });

        // Demo data
        document.getElementById('loadDemoButton').addEventListener('click', () => this.loadDemoData());
        document.getElementById('clearDemoButton').addEventListener('click', () => this.clearDemoData());

        // Modal overlay
        document.getElementById('modalOverlay').addEventListener('click', () => {
            this.closeTransactionModal();
        });

        // Screenshot input
        document.getElementById('screenshotInput').addEventListener('change', (e) => this.handleScreenshot(e));

        // Set date to today
        document.getElementById('txDate').valueAsDate = new Date();
    }

    // ========================================
    // NAVIGATION
    // ========================================

    navigateTo(pageName) {
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });

        const targetPage = document.getElementById(`page-${pageName}`);
        if (targetPage) {
            targetPage.classList.add('active');
        }

        document.querySelectorAll('.nav-button').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.page === pageName);
        });

        this.state.currentPage = pageName;

        if (pageName === 'home') {
            this.updateHomeDisplay();
        } else if (pageName === 'deals') {
            this.updateDealsDisplay();
        } else if (pageName === 'ledger') {
            this.updateLedgerDisplay();
        } else if (pageName === 'settings') {
            this.updateSettingsDisplay();
        } else if (pageName === 'message') {
            this.updateMessageDisplay();
        }

        // Scroll to top
        document.querySelector('.pages-container').scrollTop = 0;
    }

    // ========================================
    // HOME PAGE
    // ========================================

    updateHomeDisplay() {
        const profit = this.calculateTotalProfit();
        const successfulFlips = this.state.ledger.filter(tx => tx.status === 'sold').length;
        const activeDeals = this.state.deals.filter(d => d.status && !['passed', 'sold'].includes(d.status)).length;
        const avgROI = this.calculateAverageROI();

        document.getElementById('currentBankroll').textContent = this.formatCurrency(this.state.currentBankroll);
        document.getElementById('displayTarget').textContent = this.formatCurrency(this.state.targetBankroll);
        document.getElementById('startBankroll').textContent = this.formatCurrency(this.state.startBankroll);
        document.getElementById('targetBankroll').textContent = this.formatCurrency(this.state.targetBankroll);

        const progress = ((this.state.currentBankroll - this.state.startBankroll) / (this.state.targetBankroll - this.state.startBankroll)) * 100;
        document.getElementById('progressPercent').textContent = Math.max(0, Math.min(100, Math.round(progress)));
        document.getElementById('progressBarFill').style.width = Math.max(0, Math.min(100, progress)) + '%';

        const level = this.getCurrentLevel();
        document.getElementById('currentLevel').innerHTML = `${level.emoji} ${level.title}`;

        document.getElementById('profitMade').textContent = this.formatCurrency(profit);
        document.getElementById('successfulFlips').textContent = successfulFlips;
        document.getElementById('activeDeals').textContent = activeDeals;
        document.getElementById('avgROI').textContent = Math.round(avgROI);

        this.updateHotDealsDisplay();
        this.updateNextMilestoneDisplay();
    }

    updateHotDealsDisplay() {
        const container = document.getElementById('hotDealsContainer');
        const hotDeals = this.state.deals
            .filter(d => d.confidence >= 80 && d.recommendation !== 'pass')
            .sort((a, b) => b.confidence - a.confidence)
            .slice(0, 5);

        if (hotDeals.length === 0) {
            container.innerHTML = '<div class="empty-state"><p>No hot deals yet. Start hunting!</p></div>';
            return;
        }

        container.innerHTML = hotDeals.map(deal => this.createDealCardHTML(deal)).join('');
        container.querySelectorAll('.deal-card').forEach(card => {
            const dealId = card.dataset.dealId;
            const deal = this.state.deals.find(d => d.id === dealId);
            if (deal) {
                card.addEventListener('click', () => this.viewDealDetail(dealId));
            }
        });
    }

    updateNextMilestoneDisplay() {
        const currentBankroll = this.state.currentBankroll;
        const nextLevel = this.levels.find(l => l.threshold > currentBankroll);
        
        if (nextLevel) {
            document.getElementById('nextMilestoneAmount').textContent = this.formatCurrency(nextLevel.threshold);
            document.querySelector('.milestone-level').textContent = `Level ${nextLevel.level} — ${nextLevel.emoji} ${nextLevel.title}`;
        }
    }

    // ========================================
    // HUNT & ANALYSIS
    // ========================================

    analyseAdvertText() {
        const text = document.getElementById('advertInput').value.trim();
        if (!text) {
            alert('Please paste some advert text.');
            return;
        }

        const extracted = this.extractDealFromText(text);
        this.showAnalysis(extracted);
    }

    analyseQuickEntry() {
        const title = document.getElementById('quickTitle').value.trim();
        const price = parseFloat(document.getElementById('quickPrice').value);

        if (!title || isNaN(price)) {
            alert('Please enter a title and price.');
            return;
        }

        const extracted = {
            title,
            askingPrice: price,
            platform: 'Manual Entry',
            condition: 'Not provided'
        };

        this.showAnalysis(extracted);
    }

    extractDealFromText(text) {
        const deal = {
            id: Date.now().toString(),
            createdAt: new Date().toISOString(),
            platform: 'Not provided',
            title: 'Not provided',
            askingPrice: null,
            originalPrice: null,
            reducedPrice: null,
            location: 'Not provided',
            sellerName: 'Not provided',
            condition: 'Not provided',
            category: 'Not provided',
            make: 'Not provided',
            model: 'Not provided',
            specification: 'Not provided',
            year: 'Not provided'
        };

        if (text.includes('donedeal.ie')) deal.platform = 'DoneDeal';
        else if (text.includes('adverts.ie')) deal.platform = 'Adverts.ie';
        else if (text.includes('ebay.com') || text.includes('ebay.ie')) deal.platform = 'eBay';
        else if (text.includes('facebook')) deal.platform = 'Facebook Marketplace';
        else if (text.includes('gumtree')) deal.platform = 'Gumtree';
        else deal.platform = 'Unknown';

        const priceMatch = text.match(/[€$£][\s]?(\d+(?:[.,]\d{2})?)/);
        if (priceMatch) {
            deal.askingPrice = parseFloat(priceMatch[1].replace(',', '.'));
        }

        const titleMatch = text.match(/^(.{10,100}?)[\n.!?]/m);
        if (titleMatch) {
            deal.title = titleMatch[1].trim().substring(0, 100);
        }

        const irelandLocations = ['Cork', 'Dublin', 'Galway', 'Limerick', 'Waterford', 'Kerry', 'Mayo', 'Donegal', 'Wicklow', 'Wexford'];
        for (const location of irelandLocations) {
            if (text.includes(location)) {
                deal.location = location;
                break;
            }
        }

        if (text.toLowerCase().includes('new')) deal.condition = 'New';
        else if (text.toLowerCase().includes('like new')) deal.condition = 'Like New';
        else if (text.toLowerCase().includes('unused')) deal.condition = 'Unused';
        else if (text.toLowerCase().includes('used')) deal.condition = 'Used';
        else if (text.toLowerCase().includes('excellent')) deal.condition = 'Excellent';
        else if (text.toLowerCase().includes('good')) deal.condition = 'Good';
        else if (text.toLowerCase().includes('fair')) deal.condition = 'Fair';

        return deal;
    }

    showAnalysis(deal) {
        const analysis = this.analyzeDeal(deal);
        deal = { ...deal, ...analysis };

        const existingIndex = this.state.deals.findIndex(d => d.id === deal.id);
        if (existingIndex >= 0) {
            this.state.deals[existingIndex] = deal;
        } else {
            this.state.deals.push(deal);
        }
        this.saveState();

        this.navigateTo('analysis');
        this.displayAnalysis(deal);

        document.getElementById('advertInput').value = '';
        document.getElementById('quickTitle').value = '';
        document.getElementById('quickPrice').value = '';
    }

    analyzeDeal(deal) {
        const analysis = {
            resaleLow: null,
            resaleHigh: null,
            estimatedCosts: 0,
            estimatedProfit: null,
            estimatedProfitHigh: null,
            roi: null,
            roiHigh: null,
            confidence: 50,
            recommendation: 'negotiate',
            maxBuy: null,
            openingOffer: null,
            walkAwayPrice: null,
            timeToSell: 7,
            evidence: [],
            riskFlags: [],
            status: 'found'
        };

        if (!deal.askingPrice) {
            analysis.riskFlags.push('Missing asking price');
            return analysis;
        }

        // Enhanced resale estimation based on item type
        const lowerTitle = deal.title.toLowerCase();
        
        if (lowerTitle.includes('dewalt') || lowerTitle.includes('makita') || lowerTitle.includes('bosch')) {
            analysis.resaleLow = deal.askingPrice * 1.25;
            analysis.resaleHigh = deal.askingPrice * 1.6;
            analysis.confidence = 85;
            analysis.timeToSell = 4;
            analysis.evidence.push('Professional power tools have strong demand');
        } else if (lowerTitle.includes('iphone') || lowerTitle.includes('samsung') || lowerTitle.includes('pixel')) {
            analysis.resaleLow = deal.askingPrice * 0.9;
            analysis.resaleHigh = deal.askingPrice * 1.1;
            analysis.confidence = 70;
            analysis.timeToSell = 3;
            analysis.evidence.push('Smartphones have stable secondhand market');
        } else if (lowerTitle.includes('playstation') || lowerTitle.includes('xbox') || lowerTitle.includes('nintendo')) {
            analysis.resaleLow = deal.askingPrice * 1.1;
            analysis.resaleHigh = deal.askingPrice * 1.35;
            analysis.confidence = 75;
            analysis.timeToSell = 5;
            analysis.evidence.push('Gaming consoles hold value well');
        } else if (lowerTitle.includes('laptop') || lowerTitle.includes('macbook') || lowerTitle.includes('dell')) {
            analysis.resaleLow = deal.askingPrice * 1.05;
            analysis.resaleHigh = deal.askingPrice * 1.25;
            analysis.confidence = 65;
            analysis.timeToSell = 6;
            analysis.evidence.push('Laptops depreciate but have demand');
        } else if (lowerTitle.includes('bike') || lowerTitle.includes('bicycle')) {
            analysis.resaleLow = deal.askingPrice * 1.1;
            analysis.resaleHigh = deal.askingPrice * 1.4;
            analysis.confidence = 72;
            analysis.timeToSell = 8;
            analysis.evidence.push('Bicycles have seasonal demand');
        } else {
            analysis.resaleLow = deal.askingPrice * 1.08;
            analysis.resaleHigh = deal.askingPrice * 1.2;
            analysis.confidence = 45;
        }

        if (deal.condition === 'Fair' || deal.condition === 'Not provided') {
            analysis.riskFlags.push('Uncertain condition');
            analysis.confidence -= 15;
        }

        if (deal.condition === 'New') {
            analysis.confidence += 10;
            analysis.evidence.push('Brand new item typically has better resale');
        }

        if (typeof this.state.sellCost === 'string' && this.state.sellCost.includes('%')) {
            const percentage = parseInt(this.state.sellCost) / 100;
            analysis.estimatedCosts = analysis.resaleLow * percentage + this.state.transportCost;
        } else {
            analysis.estimatedCosts = parseFloat(this.state.sellCost) + this.state.transportCost;
        }

        analysis.estimatedProfit = Math.max(0, analysis.resaleLow - deal.askingPrice - analysis.estimatedCosts);
        analysis.estimatedProfitHigh = Math.max(0, analysis.resaleHigh - deal.askingPrice - analysis.estimatedCosts);

        if (deal.askingPrice > 0) {
            analysis.roi = Math.round((analysis.estimatedProfit / deal.askingPrice) * 100);
            analysis.roiHigh = Math.round((analysis.estimatedProfitHigh / deal.askingPrice) * 100);
        }

        const targetProfit = analysis.resaleLow * (this.state.minROI / 100);
        analysis.maxBuy = Math.max(0, analysis.resaleLow - analysis.estimatedCosts - targetProfit);
        analysis.openingOffer = Math.round(analysis.maxBuy * 0.9);
        analysis.walkAwayPrice = Math.round(deal.askingPrice);

        if (analysis.confidence >= 75 && analysis.roi >= this.state.minROI && analysis.estimatedProfit > 15) {
            analysis.recommendation = 'buy';
        } else if (analysis.confidence >= 55 && analysis.roi >= (this.state.minROI * 0.75)) {
            analysis.recommendation = 'negotiate';
        } else {
            analysis.recommendation = 'pass';
        }

        analysis.confidence = Math.max(0, Math.min(100, analysis.confidence));

        return analysis;
    }

    displayAnalysis(deal) {
        const content = document.getElementById('analysisContent');
        document.getElementById('analysisTitleDisplay').textContent = deal.title || 'Deal Analysis';

        let html = `
            <div class="recommendation-box">
                <div class="recommendation-heading" style="font-size: 20px; margin-bottom: 16px;">
                    ${deal.recommendation === 'buy' ? '🟢' : deal.recommendation === 'negotiate' ? '🟠' : '🔴'}
                    ${deal.recommendation.toUpperCase()}
                </div>
                <div class="recommendation-reasons">
                    ${deal.evidence.map(e => `<li>✓ ${e}</li>`).join('')}
                    ${deal.riskFlags.map(f => `<li style="color: var(--danger-color);">⚠️ ${f}</li>`).join('')}
                </div>
            </div>

            <div class="analysis-section">
                <h3>Advert Facts</h3>
                ${this.createAnalysisItem('Platform', deal.platform)}
                ${deal.askingPrice ? this.createAnalysisItem('Asking Price', this.formatCurrency(deal.askingPrice), 'fact') : ''}
                ${deal.location !== 'Not provided' ? this.createAnalysisItem('Location', deal.location, 'fact') : ''}
                ${deal.condition !== 'Not provided' ? this.createAnalysisItem('Condition', deal.condition, 'fact') : ''}
                ${deal.title !== 'Not provided' ? this.createAnalysisItem('Title', deal.title.substring(0, 50), 'fact') : ''}
            </div>

            <div class="analysis-section">
                <h3>Resale Estimates</h3>
                ${this.createAnalysisItem('Estimated Resale Range', `${this.formatCurrency(deal.resaleLow)} – ${this.formatCurrency(deal.resaleHigh)}`, 'estimate')}
                ${this.createAnalysisItem('Estimated Costs', this.formatCurrency(deal.estimatedCosts), 'estimate')}
                ${this.createAnalysisItem('Potential Profit', `${this.formatCurrency(deal.estimatedProfit)} – ${this.formatCurrency(deal.estimatedProfitHigh)}`, 'estimate')}
                ${this.createAnalysisItem('ROI', `${deal.roi}% – ${deal.roiHigh}%`, 'estimate')}
                ${this.createAnalysisItem('Confidence', `${deal.confidence}%`, 'estimate')}
                ${this.createAnalysisItem('Time to Sell', `~${deal.timeToSell} days`, 'estimate')}
            </div>

            <div class="price-highlight">
                <div class="price-highlight-label">Maximum Buy Price</div>
                <div class="price-highlight-value">${this.formatCurrency(deal.maxBuy)}</div>
            </div>

            <div class="analysis-section">
                <h3>Negotiation Strategy</h3>
                ${this.createAnalysisItem('Opening Offer', this.formatCurrency(deal.openingOffer))}
                ${this.createAnalysisItem('Walk-Away Price', this.formatCurrency(deal.walkAwayPrice))}
            </div>

            <div class="action-buttons">
                <button class="button button-primary" onclick="app.buyDeal('${deal.id}')">🟢 BUY</button>
                <button class="button button-secondary" onclick="app.negotiateDeal('${deal.id}')">🟠 NEGOTIATE</button>
            </div>
            <div class="action-buttons" style="margin-top: 8px;">
                <button class="button button-secondary" onclick="app.messageSeller('${deal.id}')">💬 MESSAGE</button>
                <button class="button button-secondary" onclick="app.passDeal('${deal.id}')">🔴 PASS</button>
            </div>
        `;

        content.innerHTML = html;
    }

    createAnalysisItem(label, value, type = null) {
        let tag = '';
        if (type === 'fact') tag = '<span class="fact-tag">Advert Fact</span>';
        else if (type === 'estimate') tag = '<span class="estimate-tag">Estimate</span>';

        return `
            <div class="analysis-item">
                <div class="analysis-item-label">${label}</div>
                <div class="analysis-item-value">${value}${tag}</div>
            </div>
        `;
    }

    buyDeal(dealId) {
        const deal = this.state.deals.find(d => d.id === dealId);
        if (deal) {
            deal.status = 'bought';
            this.saveState();
            this.showNotification(`✅ Deal marked as BOUGHT: ${deal.title}`);
            this.navigateTo('deals');
        }
    }

    negotiateDeal(dealId) {
        const deal = this.state.deals.find(d => d.id === dealId);
        if (deal) {
            deal.status = 'negotiating';
            this.saveState();
            this.messageSeller(dealId);
        }
    }

    passDeal(dealId) {
        const deal = this.state.deals.find(d => d.id === dealId);
        if (deal) {
            deal.status = 'passed';
            this.saveState();
            this.showNotification(`❌ Deal passed: ${deal.title}`);
            this.navigateTo('deals');
        }
    }

    messageSeller(dealId) {
        this.state.selectedDealForMessage = dealId;
        this.navigateTo('message');
        this.updateMessageDisplay();
    }

    handleScreenshot(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const preview = document.getElementById('screenshotPreview');
                preview.innerHTML = `<img src="${event.target.result}" alt="Screenshot">`;
            };
            reader.readAsDataURL(file);
        }
    }

    // ========================================
    // DEALS PAGE
    // ========================================

    updateDealsDisplay() {
        const container = document.getElementById('dealsListContainer');
        const noMessage = document.getElementById('noDealsMessage');

        if (this.state.deals.length === 0) {
            container.style.display = 'none';
            noMessage.style.display = 'block';
            return;
        }

        container.style.display = 'flex';
        noMessage.style.display = 'none';

        const filteredDeals = this.getFilteredDeals();
        container.innerHTML = filteredDeals.map(deal => this.createDealCardHTML(deal)).join('');

        container.querySelectorAll('.deal-card').forEach(card => {
            const dealId = card.dataset.dealId;
            card.addEventListener('click', () => this.viewDealDetail(dealId));
        });
    }

    getFilteredDeals() {
        const activeFilter = document.querySelector('.filter-button.active')?.dataset.filter || 'all';

        let filtered = this.state.deals;

        if (activeFilter === 'buy') {
            filtered = filtered.filter(d => d.recommendation === 'buy');
        } else if (activeFilter === 'negotiate') {
            filtered = filtered.filter(d => d.recommendation === 'negotiate');
        } else if (activeFilter === 'high-confidence') {
            filtered = filtered.filter(d => d.confidence >= 80);
        } else if (activeFilter === 'highest-profit') {
            filtered = filtered.sort((a, b) => (b.estimatedProfit || 0) - (a.estimatedProfit || 0));
        }

        return filtered;
    }

    filterDeals(filterType) {
        document.querySelectorAll('.filter-button').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filterType);
        });
        this.updateDealsDisplay();
    }

    createDealCardHTML(deal) {
        return `
            <div class="deal-card" data-deal-id="${deal.id}">
                <div class="deal-card-header">
                    <div class="deal-card-title">${deal.title}</div>
                    <div class="deal-card-confidence">${deal.confidence || 0}%</div>
                </div>
                <div class="deal-card-grid">
                    <div class="deal-card-item">
                        <span class="deal-card-item-label">Ask</span>
                        <span class="deal-card-item-value">${this.formatCurrency(deal.askingPrice)}</span>
                    </div>
                    <div class="deal-card-item">
                        <span class="deal-card-item-label">Resale</span>
                        <span class="deal-card-item-value">${this.formatCurrency(deal.resaleLow)}–${this.formatCurrency(deal.resaleHigh)}</span>
                    </div>
                    <div class="deal-card-item">
                        <span class="deal-card-item-label">Potential</span>
                        <span class="deal-card-item-value" style="color: var(--success-color);">+${this.formatCurrency(deal.estimatedProfit)}–${this.formatCurrency(deal.estimatedProfitHigh)}</span>
                    </div>
                    <div class="deal-card-item">
                        <span class="deal-card-item-label">ROI</span>
                        <span class="deal-card-item-value">${deal.roi}%–${deal.roiHigh}%</span>
                    </div>
                </div>
                <div class="deal-card-actions">
                    <div class="deal-recommendation ${deal.recommendation === 'buy' ? 'recommendation-buy' : deal.recommendation === 'negotiate' ? 'recommendation-negotiate' : 'recommendation-pass'}">
                        ${deal.recommendation === 'buy' ? '🟢 BUY' : deal.recommendation === 'negotiate' ? '🟠 NEGOTIATE' : '🔴 PASS'}
                    </div>
                    <button class="button button-secondary" onclick="event.stopPropagation(); app.messageSeller('${deal.id}')">💬 MESSAGE</button>
                </div>
            </div>
        `;
    }

    viewDealDetail(dealId) {
        const deal = this.state.deals.find(d => d.id === dealId);
        if (deal) {
            this.navigateTo('deal-detail');
            this.displayDealDetail(deal);
        }
    }

    displayDealDetail(deal) {
        document.getElementById('detailTitleDisplay').textContent = deal.title;

        let html = `
            <div class="analysis-section">
                <h3>Deal Status</h3>
                <div class="analysis-item">
                    <div class="analysis-item-label">Status</div>
                    <div class="analysis-item-value">${deal.status || 'Found'}</div>
                </div>
                <div class="analysis-item">
                    <div class="analysis-item-label">Confidence</div>
                    <div class="analysis-item-value">${deal.confidence}%</div>
                </div>
            </div>

            <div class="analysis-section">
                <h3>Key Metrics</h3>
                <div class="analysis-item">
                    <div class="analysis-item-label">Asking Price</div>
                    <div class="analysis-item-value">${this.formatCurrency(deal.askingPrice)}</div>
                </div>
                <div class="analysis-item">
                    <div class="analysis-item-label">Max Buy Price</div>
                    <div class="analysis-item-value" style="color: var(--success-color); font-weight: 700;">${this.formatCurrency(deal.maxBuy)}</div>
                </div>
                <div class="analysis-item">
                    <div class="analysis-item-label">Potential Profit</div>
                    <div class="analysis-item-value" style="color: var(--success-color);">+${this.formatCurrency(deal.estimatedProfit)}</div>
                </div>
                <div class="analysis-item">
                    <div class="analysis-item-label">Expected ROI</div>
                    <div class="analysis-item-value">${deal.roi}%</div>
                </div>
            </div>

            <div class="analysis-section">
                <h3>Risk Flags</h3>
                ${deal.riskFlags.length > 0 ? deal.riskFlags.map(flag => `<div class="risk-flag">⚠️ ${flag}</div>`).join('') : '<p>No major risks identified</p>'}
            </div>

            <div class="action-buttons">
                <button class="button button-primary" onclick="app.buyDeal('${deal.id}')">🟢 BUY</button>
                <button class="button button-secondary" onclick="app.messageSeller('${deal.id}')">💬 MESSAGE</button>
            </div>
        `;

        document.getElementById('dealDetailContent').innerHTML = html;
    }

    // ========================================
    // MESSAGE LAB
    // ========================================

    updateMessageDisplay() {
        const container = document.getElementById('messageLabContent');
        const dealId = this.state.selectedDealForMessage;

        if (!dealId) {
            container.innerHTML = '<div class="empty-state"><p>💬 Select a deal to generate messages</p></div>';
            return;
        }

        const deal = this.state.deals.find(d => d.id === dealId);
        if (!deal) {
            container.innerHTML = '<div class="empty-state"><p>💬 Deal not found</p></div>';
            return;
        }

        const messages = this.generateSellerMessages(deal);

        let html = '';
        for (const [title, message] of Object.entries(messages)) {
            html += `
                <div class="message-template">
                    <div class="message-template-title">${title}</div>
                    <div class="message-template-text">${message}</div>
                    <div class="message-template-actions">
                        <button class="button button-secondary" onclick="app.copyToClipboard(\`${message.replace(/`/g, '\\`')}\`)">📋 Copy</button>
                    </div>
                </div>
            `;
        }

        container.innerHTML = html;
    }

    generateSellerMessages(deal) {
        const title = deal.title || 'item';
        const maxBuy = Math.round(deal.maxBuy);
        const askPrice = deal.askingPrice;

        return {
            'Best First Message': `Hi, is this still available? I'm interested in the ${title}. What's the best price you can do? Thanks`,

            'Firmer Offer': `Hi, I'm interested in the ${title}. I can offer €${maxBuy} if you're open to negotiation. Let me know. Thanks`,

            'Time-Sensitive': `Hi, is this still available? I can collect today or tomorrow. What's your absolute best price? Cheers`,
            
            'Professional': `Good morning, I'm interested in purchasing your ${title}. Could you confirm the condition and any faults? Available for pickup at your convenience.`
        };
    }

    copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            this.showNotification('✅ Message copied to clipboard!');
        }).catch(() => {
            alert('Failed to copy. Try again.');
        });
    }

    // ========================================
    // LEDGER PAGE
    // ========================================

    updateLedgerDisplay() {
        const container = document.getElementById('ledgerContent');
        const noMessage = document.getElementById('noLedgerMessage');

        if (this.state.ledger.length === 0) {
            container.style.display = 'none';
            noMessage.style.display = 'block';
            return;
        }

        container.style.display = 'flex';
        noMessage.style.display = 'none';

        container.innerHTML = this.state.ledger
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .map(tx => this.createLedgerEntryHTML(tx))
            .join('');

        container.querySelectorAll('.ledger-entry-actions .button').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        });
    }

    createLedgerEntryHTML(tx) {
        const profit = (tx.salePrice || 0) - (tx.purchasePrice || 0) - (tx.costs || 0);
        const roi = tx.purchasePrice ? Math.round((profit / tx.purchasePrice) * 100) : 0;

        return `
            <div class="ledger-entry">
                <div class="ledger-entry-header">
                    <div class="ledger-entry-item">${tx.item}</div>
                    <div class="ledger-entry-status">${tx.status}</div>
                </div>
                <div class="ledger-entry-grid">
                    <div class="ledger-entry-field">
                        <span class="ledger-entry-label">Buy Price</span>
                        <span class="ledger-entry-value">${this.formatCurrency(tx.purchasePrice)}</span>
                    </div>
                    <div class="ledger-entry-field">
                        <span class="ledger-entry-label">Costs</span>
                        <span class="ledger-entry-value">${this.formatCurrency(tx.costs)}</span>
                    </div>
                    <div class="ledger-entry-field">
                        <span class="ledger-entry-label">Sale Price</span>
                        <span class="ledger-entry-value">${this.formatCurrency(tx.salePrice || 0)}</span>
                    </div>
                    <div class="ledger-entry-field">
                        <span class="ledger-entry-label">Profit</span>
                        <span class="ledger-entry-value ${profit >= 0 ? 'ledger-entry-profit' : 'ledger-entry-loss'}">${this.formatCurrency(profit)}</span>
                    </div>
                    <div class="ledger-entry-field">
                        <span class="ledger-entry-label">ROI</span>
                        <span class="ledger-entry-value">${roi}%</span>
                    </div>
                    <div class="ledger-entry-field">
                        <span class="ledger-entry-label">Date</span>
                        <span class="ledger-entry-value">${new Date(tx.date).toLocaleDateString()}</span>
                    </div>
                </div>
                <div class="ledger-entry-actions">
                    <button class="button button-secondary" onclick="app.editTransaction('${tx.id}')">✏️ Edit</button>
                    <button class="button button-danger" onclick="app.deleteTransaction('${tx.id}')">🗑️ Delete</button>
                </div>
            </div>
        `;
    }

    openTransactionModal() {
        document.getElementById('transactionModal').classList.add('active');
        document.getElementById('modalOverlay').classList.add('active');
        document.getElementById('transactionModalTitle').textContent = 'Add Transaction';
        document.getElementById('txItem').value = '';
        document.getElementById('txPurchasePrice').value = '';
        document.getElementById('txCosts').value = '';
        document.getElementById('txSalePrice').value = '';
        document.getElementById('txDate').valueAsDate = new Date();
        document.getElementById('txStatus').value = 'bought';
    }

    closeTransactionModal() {
        document.getElementById('transactionModal').classList.remove('active');
        document.getElementById('modalOverlay').classList.remove('active');
    }

    saveTransaction() {
        const item = document.getElementById('txItem').value.trim();
        const purchasePrice = parseFloat(document.getElementById('txPurchasePrice').value);
        const costs = parseFloat(document.getElementById('txCosts').value) || 0;
        const salePrice = parseFloat(document.getElementById('txSalePrice').value) || 0;
        const date = document.getElementById('txDate').value;
        const status = document.getElementById('txStatus').value;

        if (!item || isNaN(purchasePrice)) {
            alert('Please fill in required fields');
            return;
        }

        const transaction = {
            id: Date.now().toString(),
            item,
            purchasePrice,
            costs,
            salePrice,
            date,
            status
        };

        this.state.ledger.push(transaction);

        if (status === 'sold') {
            const profit = salePrice - purchasePrice - costs;
            this.state.currentBankroll += profit;
            this.showNotification(`🎉 Sold ${item} - Profit: ${this.formatCurrency(profit)}`);
            this.checkForLevelUp();
        }

        this.saveState();
        this.updateAllDisplays();
        this.closeTransactionModal();
    }

    editTransaction(txId) {
        const tx = this.state.ledger.find(t => t.id === txId);
        if (!tx) return;

        document.getElementById('transactionModal').classList.add('active');
        document.getElementById('modalOverlay').classList.add('active');
        document.getElementById('transactionModalTitle').textContent = 'Edit Transaction';
        document.getElementById('txItem').value = tx.item;
        document.getElementById('txPurchasePrice').value = tx.purchasePrice;
        document.getElementById('txCosts').value = tx.costs;
        document.getElementById('txSalePrice').value = tx.salePrice || 0;
        document.getElementById('txDate').value = tx.date;
        document.getElementById('txStatus').value = tx.status;
    }

    deleteTransaction(txId) {
        if (confirm('Delete this transaction?')) {
            this.state.ledger = this.state.ledger.filter(tx => tx.id !== txId);
            this.saveState();
            this.updateLedgerDisplay();
            this.showNotification('✅ Transaction deleted');
        }
    }

    // ========================================
    // SETTINGS PAGE
    // ========================================

    updateSettingsDisplay() {
        document.getElementById('settingStartBankroll').value = this.state.startBankroll;
        document.getElementById('settingTargetBankroll').value = this.state.targetBankroll;
        document.getElementById('settingMinROI').value = this.state.minROI;
        document.getElementById('settingSellCost').value = this.state.sellCost;
        document.getElementById('settingTransportCost').value = this.state.transportCost;
        document.getElementById('settingCurrency').value = this.state.currency;
        document.getElementById('settingTheme').value = this.state.theme;
        document.getElementById('settingNotifications').checked = this.state.notificationsEnabled;
    }

    exportData() {
        const data = {
            state: this.state,
            exportedAt: new Date().toISOString(),
            appVersion: this.state.appVersion
        };

        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `flipforge-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        this.showNotification('✅ Data exported successfully');
    }

    importData(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);
                if (data.state) {
                    this.state = { ...this.state, ...data.state };
                    this.saveState();
                    this.updateAllDisplays();
                    this.showNotification('✅ Data imported successfully!');
                }
            } catch (error) {
                alert('Failed to import data. Invalid file format.');
            }
        };
        reader.readAsText(file);
    }

    loadDemoData() {
        this.state.deals = [
            {
                id: '1',
                title: '🔥 DeWalt DCS367 Circular Saw',
                platform: 'DoneDeal',
                askingPrice: 109,
                resaleLow: 130,
                resaleHigh: 165,
                estimatedCosts: 15,
                estimatedProfit: 21,
                estimatedProfitHigh: 56,
                roi: 19,
                roiHigh: 51,
                confidence: 78,
                recommendation: 'buy',
                maxBuy: 105,
                openingOffer: 95,
                walkAwayPrice: 109,
                timeToSell: 5,
                condition: 'Used',
                location: 'Cork',
                evidence: ['Strong brand', 'Good resale demand'],
                riskFlags: [],
                status: 'found',
                createdAt: new Date().toISOString()
            },
            {
                id: '2',
                title: 'iPhone 12 64GB Black',
                platform: 'Facebook Marketplace',
                askingPrice: 299,
                resaleLow: 270,
                resaleHigh: 320,
                estimatedCosts: 20,
                estimatedProfit: -29,
                estimatedProfitHigh: 21,
                roi: -10,
                roiHigh: 7,
                confidence: 65,
                recommendation: 'pass',
                maxBuy: 250,
                openingOffer: 225,
                walkAwayPrice: 299,
                timeToSell: 3,
                condition: 'Good',
                location: 'Dublin',
                evidence: ['Mobile phones depreciate'],
                riskFlags: ['Weak margin', 'Possible repair risk'],
                status: 'found',
                createdAt: new Date().toISOString()
            }
        ];

        this.state.currentBankroll = 250;

        this.saveState();
        this.updateAllDisplays();
        this.showNotification('📦 Demo data loaded!');
    }

    clearDemoData() {
        this.state.deals = [];
        this.state.ledger = [];
        this.state.currentBankroll = this.state.startBankroll;
        this.saveState();
        this.updateAllDisplays();
        this.showNotification('🗑️ Demo data cleared');
    }

    // ========================================
    // THEME & DISPLAY HELPERS
    // ========================================

    applyTheme() {
        const theme = this.state.theme || 'system';

        if (theme === 'light') {
            document.documentElement.style.colorScheme = 'light';
        } else if (theme === 'dark') {
            document.documentElement.style.colorScheme = 'dark';
        } else {
            document.documentElement.style.colorScheme = 'light dark';
        }
    }

    formatCurrency(amount) {
        if (amount === null || amount === undefined) return 'N/A';
        const formatted = new Intl.NumberFormat('en-IE', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(Math.abs(amount));

        const prefix = this.state.currency === 'GBP' ? '£' : this.state.currency === 'USD' ? '$' : '€';
        return (amount < 0 ? '-' : '') + prefix + formatted;
    }

    getCurrentLevel() {
        const bankroll = this.state.currentBankroll;
        let level = this.levels[0];

        for (const lv of this.levels) {
            if (bankroll >= lv.threshold) {
                level = lv;
            }
        }

        return level;
    }

    checkForLevelUp() {
        const currentLevel = this.getCurrentLevel();
        const previousLevel = this.levels.find(l => l.threshold === (this.state.currentBankroll - 1));
        
        if (previousLevel && previousLevel.level < currentLevel.level) {
            this.showNotification(`🎉 LEVEL UP! You're now a ${currentLevel.emoji} ${currentLevel.title}!`);
        }
    }

    calculateTotalProfit() {
        return this.state.ledger
            .filter(tx => tx.status === 'sold')
            .reduce((sum, tx) => sum + ((tx.salePrice || 0) - (tx.purchasePrice || 0) - (tx.costs || 0)), 0);
    }

    calculateAverageROI() {
        const soldTx = this.state.ledger.filter(tx => tx.status === 'sold');
        if (soldTx.length === 0) return 0;

        const totalROI = soldTx.reduce((sum, tx) => {
            const profit = (tx.salePrice || 0) - (tx.purchasePrice || 0) - (tx.costs || 0);
            return sum + ((tx.purchasePrice > 0) ? (profit / tx.purchasePrice) * 100 : 0);
        }, 0);

        return totalROI / soldTx.length;
    }

    updateAllDisplays() {
        if (this.state.currentPage === 'home') {
            this.updateHomeDisplay();
        } else if (this.state.currentPage === 'deals') {
            this.updateDealsDisplay();
        } else if (this.state.currentPage === 'ledger') {
            this.updateLedgerDisplay();
        } else if (this.state.currentPage === 'settings') {
            this.updateSettingsDisplay();
        }
    }

    // ========================================
    // NOTIFICATIONS & ALERTS
    // ========================================

    setupNotifications() {
        if ('Notification' in window) {
            if (Notification.permission === 'granted') {
                console.log('Notifications already permitted');
            }
        }
    }

    requestNotificationPermission() {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }

    showNotification(message) {
        // Toast-style notification
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            bottom: 80px;
            left: 16px;
            right: 16px;
            background-color: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 12px 16px;
            border-radius: 8px;
            z-index: 2000;
            font-size: 14px;
            text-align: center;
            animation: slideUp 0.3s ease;
        `;
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideDown 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    checkForUpdates() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then((registration) => {
                registration.update();
            });
        }
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new FlipForge();
});
