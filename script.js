class SignalDisplay {
    constructor() {
        this.ghConfig = window.GH_CONFIG || {
            owner: 'Danik25326',
            repo: 'pocket_trading_bot',
            branch: 'main'
        };
        
        this.signalsUrl = `https://${this.ghConfig.owner}.github.io/${this.ghConfig.repo}/data/signals.json`;
        this.kyivTZ = 'Europe/Kiev';
        this.language = localStorage.getItem('language') || 'uk';
        this.activeTimers = new Map();
        this.lastGenerationTime = null;
        this.blockUntilTime = null;
        this.autoRefreshInterval = null;
        this.searchCooldownTimer = null;
        
        this.translations = {
            uk: {
                searchSignalsBtn: "Пошук сигналів",
                cooldownActive: 'Зачекайте 5 хвилин перед наступною генерацією',
                minutesLeft: 'хвилин',
                searchInProgress: "Запуск генерації..."
            },
            ru: {
                searchSignalsBtn: "Поиск сигналов",
                cooldownActive: 'Подождите 5 минут перед следующей генерацией',
                minutesLeft: 'минут',
                searchInProgress: "Запуск генерации..."
            }
        };
        
        this.init();
    }

    async init() {
        await this.setupLanguage();
        this.setupEventListeners();
        this.updateKyivTime();
        setInterval(() => this.updateKyivTime(), 1000);
        
        this.restoreButtonBlockState();
        await this.loadSignals();
        this.startAutoRefresh();
    }

    setupEventListeners() {
        const searchBtn = document.getElementById('search-signals-btn');
        if (searchBtn) {
            searchBtn.addEventListener('click', () => {
                this.startSignalGeneration();
            });
        }
        
        document.getElementById('lang-uk')?.addEventListener('click', () => {
            this.switchLanguage('uk');
        });
        
        document.getElementById('lang-ru')?.addEventListener('click', () => {
            this.switchLanguage('ru');
        });
    }

    restoreButtonBlockState() {
        if (this.blockUntilTime) {
            const now = new Date();
            const blockTime = new Date(this.blockUntilTime);
            
            if (blockTime > now) {
                const timeLeft = Math.ceil((blockTime - now) / (1000 * 60));
                this.disableSearchButton(timeLeft);
            } else {
                localStorage.removeItem('blockUntilTime');
                this.blockUntilTime = null;
            }
        }
    }

    async startSignalGeneration() {
        console.log('🚀 Початок генерації сигналів...');
        
        const btn = document.getElementById('search-signals-btn');
        if (!btn) return;
        
        // Перевірка 5-хвилинного інтервалу
        const now = new Date();
        const lastGen = localStorage.getItem('lastGenerationTime');
        
        if (lastGen) {
            const lastTime = new Date(lastGen);
            const diffMinutes = (now - lastTime) / (1000 * 60);
            
            if (diffMinutes < 5) {
                const timeLeft = Math.ceil(5 - diffMinutes);
                this.showMessage('warning', 
                    `Зачекайте ще ${timeLeft} хвилин перед наступною генерацією`);
                return;
            }
        }
        
        // Блокуємо кнопку
        const originalText = btn.innerHTML;
        btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${this.translate('searchInProgress')}`;
        btn.disabled = true;
        
        // Показуємо повідомлення
        this.showMessage('info', 
            '🚀 Запускаємо генерацію сигналів...<br>' +
            '⏳ Сигнали з\'являться через 30-60 секунд');
        
        try {
            // Запускаємо GitHub Actions workflow через API
            const success = await this.triggerGitHubWorkflow();
            
            if (success) {
                // Зберігаємо час запуску
                localStorage.setItem('lastGenerationTime', now.toISOString());
                this.lastGenerationTime = now;
                
                // Встановлюємо час блокування
                this.blockUntilTime = new Date(now.getTime() + 5 * 60 * 1000);
                localStorage.setItem('blockUntilTime', this.blockUntilTime.toISOString());
                
                // Блокуємо кнопку на 5 хвилин
                this.disableSearchButton(5);
                
                this.showMessage('success', 
                    '✅ Генерація сигналів запущена!<br>' +
                    '⏳ Оновлення через 40 секунд...');
                
                // Очікуємо і оновлюємо сигнали
                setTimeout(async () => {
                    await this.loadSignals(true);
                    this.showMessage('success', 
                        '✅ Сигнали успішно згенеровано!');
                }, 40000);
                
            } else {
                throw new Error('Не вдалося запустити генерацію');
            }
            
        } catch (error) {
            console.error('Помилка запуску генерації:', error);
            this.showMessage('error', 
                '❌ Не вдалося запустити генерацію. Спробуйте ще раз.');
            
            // Розблоковуємо кнопку
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    }

    async triggerGitHubWorkflow() {
        // GitHub API для запуску workflow_dispatch
        const url = `https://api.github.com/repos/${this.ghConfig.owner}/${this.ghConfig.repo}/actions/workflows/signals.yml/dispatches`;
        
        try {
            const response = await fetch(`https://api.github.com/repos/${this.ghConfig.owner}/${this.ghConfig.repo}/actions/workflows/signals.yml/dispatches`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ref: 'main',
                    inputs: {
                        language: this.language,
                        trigger_source: 'website_button'
                    }
                })
            });
            
            console.log('GitHub API Response:', response.status, response.statusText);
            
            if (response.status === 204) {
                console.log('✅ Workflow запущено успішно');
                return true;
            } else {
                console.error('❌ Помилка запуску workflow:', response.status);
                return false;
            }
        } catch (error) {
            console.error('❌ Помилка запиту до GitHub:', error);
            return false;
        }
    }

    disableSearchButton(minutes) {
        const btn = document.getElementById('search-signals-btn');
        if (!btn) return;
        
        const endTime = new Date(new Date().getTime() + minutes * 60 * 1000);
        
        const updateButton = () => {
            const now = new Date();
            const timeLeft = Math.max(0, endTime - now);
            
            if (timeLeft <= 0) {
                btn.innerHTML = `<i class="fas fa-search"></i> <span class="btn-text">${this.translate('searchSignalsBtn')}</span>`;
                btn.disabled = false;
                clearInterval(this.searchCooldownTimer);
                localStorage.removeItem('blockUntilTime');
                this.blockUntilTime = null;
                return;
            }
            
            const minutesLeft = Math.floor(timeLeft / (1000 * 60));
            const secondsLeft = Math.floor((timeLeft % (60000)) / 1000);
            
            btn.innerHTML = `
                <i class="fas fa-clock"></i> 
                ${minutesLeft}:${secondsLeft.toString().padStart(2, '0')}
            `;
        };
        
        if (this.searchCooldownTimer) {
            clearInterval(this.searchCooldownTimer);
        }
        
        this.searchCooldownTimer = setInterval(updateButton, 1000);
        updateButton();
    }

    async loadSignals(force = false) {
        try {
            const timestamp = new Date().getTime();
            const cacheBuster = force ? `?t=${timestamp}` : `?nocache=${timestamp}`;
            
            const response = await fetch(`${this.signalsUrl}${cacheBuster}`, {
                cache: 'no-store',
                headers: {
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            this.processSignals(data, force);
            this.updateStats(data);
            
        } catch (error) {
            console.error('Помилка завантаження сигналів:', error);
            // Оновлюємо час останньої спроби
            const lastUpdate = document.getElementById('last-update');
            if (lastUpdate) {
                const now = new Date();
                lastUpdate.textContent = now.toLocaleTimeString('uk-UA', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                }) + ' (помилка)';
            }
        }
    }

    processSignals(data, force = false) {
        const container = document.getElementById('signals-container');
        const noSignals = document.getElementById('no-signals');
        const lastUpdate = document.getElementById('last-update');
        const activeSignalsElement = document.getElementById('active-signals');
        const totalSignalsElement = document.getElementById('total-signals');
        
        if (!data || !data.signals || data.signals.length === 0) {
            container.innerHTML = this.getEmptyStateHTML();
            if (lastUpdate) lastUpdate.textContent = '--:--:--';
            if (activeSignalsElement) activeSignalsElement.textContent = '0';
            if (totalSignalsElement) totalSignalsElement.textContent = '0';
            if (noSignals) noSignals.style.display = 'block';
            return;
        }
        
        if (data.last_update && lastUpdate) {
            const updateDate = new Date(data.last_update);
            lastUpdate.textContent = this.formatTime(updateDate, true);
        }
        
        if (activeSignalsElement) {
            activeSignalsElement.textContent = data.active_signals || 0;
        }
        
        if (totalSignalsElement) {
            totalSignalsElement.textContent = data.total_signals || data.signals.length;
        }
        
        let html = '';
        let hasActiveSignals = false;
        
        data.signals.forEach((signal, index) => {
            const confidencePercent = Math.round(signal.confidence * 100);
            if (confidencePercent < 70) return;
            
            const signalId = `signal-${index}`;
            const signalHTML = this.createSignalHTML(signal, signalId);
            
            if (signalHTML) {
                html += signalHTML;
                hasActiveSignals = true;
            }
        });
        
        if (!hasActiveSignals) {
            container.innerHTML = this.getNoSignalsHTML();
            if (noSignals) noSignals.style.display = 'block';
        } else {
            container.innerHTML = html;
            if (noSignals) noSignals.style.display = 'none';
        }
    }

    createSignalHTML(signal, signalId) {
        const confidencePercent = Math.round(signal.confidence * 100);
        const directionClass = signal.direction.toLowerCase();
        const duration = signal.duration || 2;
        
        const entryTime = signal.entry_time || '--:--';
        
        return `
            <div class="signal-card ${directionClass}" id="${signalId}" data-asset="${signal.asset}">
                <div class="signal-header">
                    <div class="asset-info">
                        <div class="asset-icon">
                            <i class="fas fa-chart-line"></i>
                        </div>
                        <div>
                            <div class="asset-name">${signal.asset}</div>
                            <small>Тривалість: ${duration} хв | Київський час</small>
                        </div>
                    </div>
                    <div class="direction-badge">
                        ${signal.direction === 'UP' ? '📈 CALL' : '📉 PUT'}
                    </div>
                </div>
                
                <div class="signal-details">
                    <div class="detail-item">
                        <div class="label">
                            <i class="fas fa-bullseye"></i> Впевненість
                        </div>
                        <div class="value">
                            ${confidencePercent}%
                        </div>
                    </div>
                    
                    <div class="detail-item">
                        <div class="label">
                            <i class="far fa-clock"></i> Час входу
                        </div>
                        <div class="value">
                            ${entryTime}
                        </div>
                    </div>
                    
                    <div class="detail-item">
                        <div class="label">
                            <i class="fas fa-hourglass-half"></i> Тривалість
                        </div>
                        <div class="value">${duration} хв</div>
                    </div>
                    
                    <div class="detail-item">
                        <div class="label">
                            <i class="fas fa-brain"></i> AI
                        </div>
                        <div class="value">GPT OSS 120B</div>
                    </div>
                </div>
                
                ${signal.reason ? `
                <div class="signal-reason">
                    <div class="reason-header">
                        <i class="fas fa-lightbulb"></i> Аналіз
                    </div>
                    <div class="reason-text">${signal.reason}</div>
                </div>
                ` : ''}
            </div>
        `;
    }

    updateStats(data) {
        const lastUpdate = document.getElementById('last-update');
        if (lastUpdate && data.last_update) {
            const updateDate = new Date(data.last_update);
            lastUpdate.textContent = this.formatTime(updateDate, true);
        }
        
        const activeSignalsElement = document.getElementById('active-signals');
        if (activeSignalsElement) {
            activeSignalsElement.textContent = data.active_signals || '0';
        }
        
        const totalSignalsElement = document.getElementById('total-signals');
        if (totalSignalsElement) {
            totalSignalsElement.textContent = data.total_signals || '0';
        }
    }

    updateKyivTime() {
        const now = new Date();
        const timeElement = document.getElementById('server-time');
        
        if (timeElement) {
            timeElement.textContent = now.toLocaleTimeString('uk-UA', {
                timeZone: this.kyivTZ,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
        }
    }

    formatTime(date, includeSeconds = false) {
        return date.toLocaleTimeString('uk-UA', {
            timeZone: this.kyivTZ,
            hour: '2-digit',
            minute: '2-digit',
            second: includeSeconds ? '2-digit' : undefined
        });
    }

    getEmptyStateHTML() {
        return `
            <div class="loading-state">
                <div class="spinner">
                    <i class="fas fa-search"></i>
                </div>
                <p>Сигналів ще немає</p>
                <small>Натисніть "Пошук сигналів" для початку</small>
            </div>
        `;
    }

    getNoSignalsHTML() {
        return `
            <div class="empty-state">
                <i class="fas fa-chart-line"></i>
                <h3>Наразі немає актуальних сигналів</h3>
                <p>Знайдіть нові сигнали</p>
            </div>
        `;
    }

    startAutoRefresh() {
        if (this.autoRefreshInterval) {
            clearInterval(this.autoRefreshInterval);
        }
        
        // Оновлюємо кожні 30 секунд
        this.autoRefreshInterval = setInterval(async () => {
            await this.loadSignals();
        }, 30000);
        
        console.log('🔄 Автоматичне оновлення даних кожні 30 секунд');
    }

    showMessage(type, html) {
        let messageContainer = document.getElementById('message-container');
        if (!messageContainer) {
            messageContainer = document.createElement('div');
            messageContainer.id = 'message-container';
            messageContainer.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                max-width: 400px;
            `;
            document.body.appendChild(messageContainer);
        }
        
        const message = document.createElement('div');
        message.className = `message ${type}`;
        message.style.cssText = `
            background: ${type === 'success' ? '#38a169' : type === 'error' ? '#e53e3e' : '#3182ce'};
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            margin-bottom: 10px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            animation: slideIn 0.3s ease-out;
        `;
        
        message.innerHTML = html;
        
        messageContainer.appendChild(message);
        
        setTimeout(() => {
            message.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => {
                if (message.parentNode) {
                    message.parentNode.removeChild(message);
                }
            }, 300);
        }, 5000);
    }

    async setupLanguage() {
        this.applyLanguage(this.language);
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.lang === this.language);
        });
    }

    switchLanguage(lang) {
        this.language = lang;
        localStorage.setItem('language', lang);
        this.applyLanguage(lang);
        
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.lang === lang);
        });
        
        this.loadSignals();
    }

    applyLanguage(lang) {
        const translations = this.translations[lang];
        if (!translations) return;
        
        document.querySelectorAll('[data-translate]').forEach(element => {
            const key = element.getAttribute('data-translate');
            if (translations[key]) {
                element.textContent = translations[key];
            }
        });
    }

    translate(key) {
        return this.translations[this.language][key] || key;
    }
}

// Додаємо CSS для анімацій
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Ініціалізація при завантаженні сторінки
document.addEventListener('DOMContentLoaded', () => {
    window.signalDisplay = new SignalDisplay();
});
