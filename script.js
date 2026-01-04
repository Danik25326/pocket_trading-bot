// script.js - Головний файл JavaScript
class SignalDisplay {
    constructor() {
        this.ghConfig = window.GH_CONFIG || {
            owner: 'Danik25326',
            repo: 'pocket_trading_bot',
            branch: 'main',
            baseUrl: 'https://danik25326.github.io/pocket_trading_bot'
        };
        
        // Правильний URL для GitHub Pages
        this.signalsUrl = `${this.ghConfig.baseUrl}/data/signals.json`;
        this.kyivTZ = 'Europe/Kiev';
        this.language = localStorage.getItem('language') || 'uk';
        this.activeTimers = new Map();
        
        // Змінні для блокування кнопки
        this.lastGenerationTime = localStorage.getItem('lastGenerationTime') ? 
            new Date(localStorage.getItem('lastGenerationTime')) : null;
        this.blockUntilTime = localStorage.getItem('blockUntilTime') ?
            new Date(localStorage.getItem('blockUntilTime')) : null;
            
        this.autoRefreshInterval = null;
        this.searchCooldownTimer = null;
        
        this.translations = {
            uk: {
                title: "AI Trading Signals",
                subtitle: "Автоматичні сигнали для бінарних опціонів з використанням GPT OSS 120B AI",
                generationType: "Генерація:",
                manualOnly: "тільки вручну",
                minAccuracy: "Мін. точність:",
                model: "Модель:",
                searchSignalsBtn: "Пошук сигналів",
                regenerateBtn: "Перегенерувати",
                lastUpdate: "Останнє оновлення",
                kievTime: "(Київський час)",
                activeSignals: "Активних сигналів",
                withConfidence: "з впевненістю >70%",
                totalStats: "Загальна статистика",
                signalsInHistory: "сигналів в історії",
                successRate: "Успішність",
                historicalAccuracy: "історична точність",
                currentSignals: "Актуальні сигнали",
                serverTime: "Поточний час:",
                noSignalsYet: "Сигналів ще немає",
                clickSearchToStart: "Натисніть 'Пошук сигналів' для початку",
                noSignalsNow: "Наразі немає актуальних сигналів",
                searchNewSignals: "Знайдіть нові сигнали або зачекайте завершення поточних",
                howItWorks: "Як працює система",
                aiAnalysis: "AI Аналіз:",
                aiAnalysisDesc: "GPT OSS 120B для технічного аналізу",
                realTimeData: "Дані в реальному часі:",
                realTimeDataDesc: "Отримання з PocketOption API",
                volatilityBased: "Тривалість угоди:",
                volatilityBasedDesc: "1-5 хв на основі волатильності",
                important: "Важливо!",
                disclaimer: "Торгівля містить високі ризики. Сигнали не є фінансовою рекомендацією.",
                createdWith: "Створено з використанням",
                technologies: "Технології:",
                timerActive: "Таймер активний:",
                timerExpired: "Час вийшов",
                timeLeft: "Залишилось:",
                entryTime: "Час входу:",
                howToStart: "Як почати роботу?",
                instructionText: "Натисніть кнопку 'Пошук сигналів' для запуску генерації нових сигналів. Після генерації ви зможете перегенерувати сигнали через 5 хвилин.",
                generatingSignals: "Генерація сигналів...",
                searchInProgress: "Пошук сигналів...",
                waitForCompletion: "Зачекайте завершення",
                waitMinutes: 'Зачекайте ще',
                minutesLeft: 'хвилин',
                signalGenerationStarted: 'Генерація сигналів запущена!',
                generationFailed: 'Не вдалося запустити генерацію',
                cooldownActive: 'Зачекайте 5 хвилин перед наступною генерацією',
                noTokenConfigured: 'GitHub токен не налаштовано'
            },
            ru: {
                title: "AI Торговые Сигналы",
                subtitle: "Автоматические сигналы для бинарных опционов с использованием GPT OSS 120B AI",
                generationType: "Генерация:",
                manualOnly: "только вручную",
                minAccuracy: "Мин. точность:",
                model: "Модель:",
                searchSignalsBtn: "Поиск сигналов",
                regenerateBtn: "Перегенерировать",
                lastUpdate: "Последнее обновление",
                kievTime: "(Киевское время)",
                activeSignals: "Активных сигналов",
                withConfidence: "с уверенностью >70%",
                totalStats: "Общая статистика",
                signalsInHistory: "сигналов в истории",
                successRate: "Успешность",
                historicalAccuracy: "историческая точность",
                currentSignals: "Актуальные сигналы",
                serverTime: "Текущее время:",
                noSignalsYet: "Сигналов еще нет",
                clickSearchToStart: "Нажмите 'Поиск сигналов' для начала",
                noSignalsNow: "В настоящее время нет актуальных сигналов",
                searchNewSignals: "Найдите новые сигналы или дождитесь завершения текущих",
                howItWorks: "Как работает система",
                aiAnalysis: "AI Анализ:",
                aiAnalysisDesc: "GPT OSS 120B для технического анализа",
                realTimeData: "Данные в реальном времени:",
                realTimeDataDesc: "Получение из PocketOption API",
                volatilityBased: "Длительность сделки:",
                volatilityBasedDesc: "1-5 мин на основе волатильности",
                important: "Важно!",
                disclaimer: "Торговля содержит высокие риски. Сигналы не являются финансовой рекомендацией.",
                createdWith: "Создано с использованием",
                technologies: "Технологии:",
                timerActive: "Таймер активен:",
                timerExpired: "Время вышло",
                timeLeft: "Осталось:",
                entryTime: "Время входа:",
                howToStart: "Как начать работу?",
                instructionText: "Нажмите кнопку 'Поиск сигналов' для запуска генерации новых сигналов. После генерации вы сможете перегенерировать сигналы через 5 минут.",
                generatingSignals: "Генерация сигналов...",
                searchInProgress: "Поиск сигналов...",
                waitForCompletion: "Дождитесь завершения",
                waitMinutes: 'Подождите еще',
                minutesLeft: 'минут',
                signalGenerationStarted: 'Генерация сигналов запущена!',
                generationFailed: 'Не удалось запустить генерацию',
                cooldownActive: 'Подождите 5 минут перед следующей генерацией',
                noTokenConfigured: 'GitHub токен не настроен'
            }
        };
        
        this.init();
    }

    async init() {
        await this.setupLanguage();
        this.setupEventListeners();
        this.updateKyivTime();
        setInterval(() => this.updateKyivTime(), 1000);
        
        // Відновлюємо блокування кнопки при завантаженні сторінки
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
        // Перевіряємо, чи кнопка має бути заблокована
        if (this.blockUntilTime) {
            const now = new Date();
            const timeLeft = Math.max(0, this.blockUntilTime - now);
            
            if (timeLeft > 0) {
                const minutesLeft = Math.ceil(timeLeft / (1000 * 60));
                this.disableSearchButton(minutesLeft);
            } else {
                localStorage.removeItem('blockUntilTime');
                this.blockUntilTime = null;
            }
        }
    }

    async startSignalGeneration() {
        const btn = document.getElementById('search-signals-btn');
        if (!btn) return;
        
        // Перевірка 5-хвилинного інтервалу
        const now = new Date();
        if (this.blockUntilTime && now < this.blockUntilTime) {
            const timeLeft = Math.ceil((this.blockUntilTime - now) / (1000 * 60));
            this.showMessage('warning', 
                `${this.translate('cooldownActive')} (${timeLeft} ${this.translate('minutesLeft')})`);
            return;
        }
        
        const originalText = btn.innerHTML;
        
        // Блокуємо кнопку на 5 хвилин
        btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${this.translate('searchInProgress')}`;
        btn.disabled = true;
        
        // Показуємо повідомлення
        this.showMessage('info', 
            '🚀 Запускаємо генерацію сигналів...<br>' +
            '⏳ Сигнали з\'являться через 30-60 секунд<br>' +
            '<small>Під час генерації кнопка буде неактивна</small>');
        
        // Зберігаємо час запуску та час закінчення блокування
        this.lastGenerationTime = new Date();
        this.blockUntilTime = new Date(now.getTime() + 5 * 60 * 1000); // +5 хвилин
        
        localStorage.setItem('lastGenerationTime', this.lastGenerationTime.toISOString());
        localStorage.setItem('blockUntilTime', this.blockUntilTime.toISOString());
        
        // Блокуємо кнопку на 5 хвилин
        this.disableSearchButton(5);
        
        // СИМУЛЮЄМО запуск GitHub Actions
        // На практиці тут буде реальний виклик GitHub API
        this.simulateGitHubActionsTrigger();
        
        // Оновлюємо сигнали через 40 секунд (час на генерацію)
        setTimeout(async () => {
            await this.loadSignals(true);
            this.showMessage('success', 
                '✅ Сигнали успішно згенеровано!<br>' +
                '<small>Дані оновлено на сторінці</small>');
        }, 40000);
        
        // Оновлюємо ще раз через 60 секунд для впевненості
        setTimeout(async () => {
            await this.loadSignals(true);
        }, 60000);
    }

    simulateGitHubActionsTrigger() {
        console.log('🧪 СИМУЛЯЦІЯ: Запуск GitHub Actions workflow...');
        console.log('📝 Мова:', this.language);
        console.log('🔧 Дійсний запуск відбудеться в GitHub Actions');
        
        // Тут буде реальний код для запуску через GitHub API
        // Для тестування просто логуємо
        setTimeout(() => {
            console.log('✅ СИМУЛЯЦІЯ: GitHub Actions workflow запущено успішно');
        }, 2000);
    }

    disableSearchButton(minutes) {
        const btn = document.getElementById('search-signals-btn');
        if (!btn) return;
        
        // Розраховуємо час закінчення блокування
        const endTime = this.blockUntilTime || new Date(new Date().getTime() + minutes * 60 * 1000);
        
        const updateButton = () => {
            const now = new Date();
            const timeLeft = Math.max(0, endTime - now);
            
            if (timeLeft <= 0) {
                btn.innerHTML = `<i class="fas fa-search"></i> <span class="btn-text">${this.translate('searchSignalsBtn')}</span>`;
                btn.disabled = false;
                clearInterval(this.searchCooldownTimer);
                
                // Очищаємо localStorage
                localStorage.removeItem('blockUntilTime');
                this.blockUntilTime = null;
                return;
            }
            
            const minutesLeft = Math.floor(timeLeft / (1000 * 60));
            const secondsLeft = Math.floor((timeLeft % (1000 * 60)) / 1000);
            
            btn.innerHTML = `
                <i class="fas fa-clock"></i> 
                ${minutesLeft}:${secondsLeft.toString().padStart(2, '0')}
                <span class="btn-text" style="display:none">${this.translate('searchSignalsBtn')}</span>
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
            
            // Оновлюємо статистику
            this.updateStats(data);
            
        } catch (error) {
            console.error('Помилка завантаження сигналів:', error);
            // Не показуємо помилку користувачу
            const lastUpdate = document.getElementById('last-update');
            if (lastUpdate) {
                const now = new Date();
                lastUpdate.textContent = now.toLocaleTimeString('uk-UA', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                }) + ' (спроба)';
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
            
            data.signals.forEach((signal, index) => {
                const signalId = `signal-${index}`;
                this.setupSignalTimer(signal, signalId);
            });
        }
    }

    createSignalHTML(signal, signalId) {
        const confidencePercent = Math.round(signal.confidence * 100);
        const confidenceClass = this.getConfidenceClass(confidencePercent);
        const directionClass = signal.direction.toLowerCase();
        const duration = signal.duration || 2;
        
        const entryTimeKyiv = this.convertToKyivTime(signal.entry_timestamp || signal.timestamp);
        const generatedTime = this.convertToKyivTime(signal.generated_at);
        
        let reason = signal.reason || '';
        if (this.language === 'ru' && signal.reason_ru) {
            reason = signal.reason_ru;
        }
        
        return `
            <div class="signal-card ${directionClass}" id="${signalId}" data-asset="${signal.asset}" data-entry-time="${entryTimeKyiv}">
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
                            <i class="fas fa-bullseye"></i> ${this.translate('withConfidence').replace('з ', '')}
                        </div>
                        <div class="value">
                            ${confidencePercent}%
                            <span class="confidence-badge ${confidenceClass}">
                                ${confidencePercent >= 85 ? 'Висока' : confidencePercent >= 75 ? 'Середня' : 'Низька'}
                            </span>
                        </div>
                    </div>
                    
                    <div class="detail-item">
                        <div class="label">
                            <i class="far fa-clock"></i> ${this.translate('entryTime')}
                        </div>
                        <div class="value">
                            ${entryTimeKyiv}
                            <small style="display: block; font-size: 0.8em; color: #666;">(Київ)</small>
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
                            <i class="fas fa-calendar"></i> Створено
                        </div>
                        <div class="value">${generatedTime}</div>
                    </div>
                </div>
                
                <div class="signal-timer-container" id="timer-${signalId}">
                    <!-- Таймер буде додано JavaScript -->
                </div>
                
                ${reason ? `
                <div class="signal-reason">
                    <div class="reason-header">
                        <i class="fas fa-lightbulb"></i> Аналіз AI
                    </div>
                    <div class="reason-text">${reason}</div>
                </div>
                ` : ''}
                
                <div class="signal-footer">
                    <span><i class="fas fa-globe-europe"></i> Часова зона: Київ (UTC+2)</span>
                    <span><i class="fas fa-brain"></i> Модель: GPT OSS 120B</span>
                </div>
            </div>
        `;
    }

    setupSignalTimer(signal, signalId) {
        const container = document.getElementById(`timer-${signalId}`);
        if (!container) return;
        
        const entryTime = signal.entry_timestamp || signal.timestamp;
        const duration = parseFloat(signal.duration) || 2;
        
        if (!entryTime) return;
        
        const entryDate = new Date(entryTime);
        const endDate = new Date(entryDate.getTime() + duration * 60000);
        
        const updateTimerDisplay = () => {
            const now = new Date();
            const timeLeft = endDate - now;
            
            if (timeLeft > 0) {
                const minutesLeft = Math.floor(timeLeft / 60000);
                const secondsLeft = Math.floor((timeLeft % 60000) / 1000);
                
                container.innerHTML = `
                    <div class="signal-timer active">
                        <div class="timer-display">
                            <i class="fas fa-hourglass-half"></i> 
                            <span class="timer-text">${minutesLeft}:${secondsLeft.toString().padStart(2, '0')}</span>
                        </div>
                        <small>${this.translate('timerActive')}</small>
                    </div>
                `;
                
                this.activeTimers.set(signalId, {
                    isActive: true,
                    endTime: endDate.getTime(),
                    updateInterval: setInterval(() => updateTimerDisplay(), 1000)
                });
            } else {
                clearInterval(this.activeTimers.get(signalId)?.updateInterval);
                this.activeTimers.delete(signalId);
                
                // ПРОСТО ВИДАЛЯЄМО СИГНАЛ ПІСЛЯ ТАЙМЕРА
                container.innerHTML = `
                    <div class="signal-expired">
                        <p>⏰ Час угоди вийшов</p>
                        <small>Сигнал автоматично видалено</small>
                    </div>
                `;
                
                // Через 5 секунд видаляємо весь сигнал
                setTimeout(() => {
                    const signalElement = document.getElementById(signalId);
                    if (signalElement) {
                        signalElement.remove();
                        this.updateSignalCount();
                    }
                }, 5000);
            }
        };
        
        updateTimerDisplay();
    }

    updateSignalCount() {
        const container = document.getElementById('signals-container');
        const activeSignals = container.querySelectorAll('.signal-card').length;
        const activeSignalsElement = document.getElementById('active-signals');
        if (activeSignalsElement) {
            activeSignalsElement.textContent = activeSignals;
        }
        
        const noSignals = document.getElementById('no-signals');
        if (activeSignals === 0 && noSignals) {
            noSignals.style.display = 'block';
        }
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
        
        // Оновлюємо успішність (фіктивне значення)
        const successRateElement = document.getElementById('success-rate');
        if (successRateElement) {
            // Для демонстрації - випадкове значення
            const randomSuccess = Math.floor(Math.random() * 30) + 70;
            successRateElement.textContent = `${randomSuccess}%`;
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

    convertToKyivTime(dateString) {
        if (!dateString) return '--:--';
        
        const date = new Date(dateString);
        return date.toLocaleTimeString('uk-UA', {
            timeZone: this.kyivTZ,
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    formatTime(date, includeSeconds = false) {
        return date.toLocaleTimeString('uk-UA', {
            timeZone: this.kyivTZ,
            hour: '2-digit',
            minute: '2-digit',
            second: includeSeconds ? '2-digit' : undefined
        });
    }

    getConfidenceClass(percent) {
        if (percent >= 85) return 'confidence-high';
        if (percent >= 75) return 'confidence-medium';
        return 'confidence-low';
    }

    getEmptyStateHTML() {
        return `
            <div class="loading-state">
                <div class="spinner">
                    <i class="fas fa-search"></i>
                </div>
                <p>${this.translate('noSignalsYet')}</p>
                <small>${this.translate('clickSearchToStart')}</small>
            </div>
        `;
    }

    getNoSignalsHTML() {
        return `
            <div class="empty-state">
                <i class="fas fa-chart-line"></i>
                <h3>${this.translate('noSignalsNow')}</h3>
                <p>${this.translate('searchNewSignals')}</p>
            </div>
        `;
    }

    startAutoRefresh() {
        // Автоматично оновлюємо дані кожні 30 секунд
        if (this.autoRefreshInterval) {
            clearInterval(this.autoRefreshInterval);
        }
        
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
    
    .message {
        font-size: 14px;
        line-height: 1.5;
    }
    
    .message small {
        opacity: 0.9;
        font-size: 12px;
    }
    
    .signal-expired {
        background: #f8f9fa;
        border-left: 4px solid #6c757d;
        padding: 15px;
        border-radius: 8px;
        margin: 10px 0;
        text-align: center;
    }
    
    .signal-expired p {
        color: #6c757d;
        font-weight: 600;
        margin-bottom: 5px;
    }
    
    .signal-expired small {
        color: #adb5bd;
        font-size: 0.85rem;
    }
`;
document.head.appendChild(style);

// Ініціалізація при завантаженні сторінки
document.addEventListener('DOMContentLoaded', () => {
    window.signalDisplay = new SignalDisplay();
});
