class SignalDisplay {
    constructor() {
        this.signalsUrl = 'data/signals.json';
        this.historyUrl = 'data/history.json';
        this.kyivTZ = 'Europe/Kiev';
        this.language = localStorage.getItem('language') || 'uk';
        this.activeTimers = new Map();
        this.lastGenerationTime = localStorage.getItem('lastGenerationTime') ? new Date(localStorage.getItem('lastGenerationTime')) : null;
        this.refreshTimer = null;
        
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
                manualControl: "Контроль:",
                manualControlDesc: "Тільки ручна генерація сигналів",
                important: "Важливо!",
                disclaimer: "Торгівля містить високі ризики. Сигнали не є фінансовою рекомендацією.",
                createdWith: "Створено з використанням",
                technologies: "Технології:",
                feedbackQuestion: "Сигнал був вірний?",
                feedbackYes: "Так",
                feedbackNo: "Ні",
                feedbackSkip: "Я не перевіряв",
                timerActive: "Таймер активний:",
                timerExpired: "Час вийшов",
                signalCorrect: "Сигнал вірний?",
                replyYes: "Так",
                replyNo: "Ні",
                replySkip: "Пропустити",
                timeLeft: "Залишилось:",
                entryTime: "Час входу:",
                howToStart: "Як почати роботу?",
                instructionText: "Натисніть кнопку 'Пошук сигналів' для генерації нових сигналів. Після генерації ви зможете перегенерувати сигнали через 5 хвилин.",
                generatingSignals: "Генерація сигналів...",
                updateIn: "Оновлення через:",
                minutes: "хв",
                seconds: "сек",
                signalGenerated: "Сигнал згенеровано",
                searchInProgress: "Пошук сигналів...",
                waitForCompletion: "Зачекайте завершення",
                generatingViaAPI: "Запуск генерації через API..."
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
                manualControl: "Контроль:",
                manualControlDesc: "Только ручная генерация сигналов",
                important: "Важно!",
                disclaimer: "Торговля содержит высокие риски. Сигналы не являются финансовой рекомендацией.",
                createdWith: "Создано с использованием",
                technologies: "Технологии:",
                feedbackQuestion: "Сигнал был верным?",
                feedbackYes: "Да",
                feedbackNo: "Нет",
                feedbackSkip: "Я не проверял",
                timerActive: "Таймер активен:",
                timerExpired: "Время вышло",
                signalCorrect: "Сигнал верный?",
                replyYes: "Да",
                replyNo: "Нет",
                replySkip: "Пропустить",
                timeLeft: "Осталось:",
                entryTime: "Время входа:",
                howToStart: "Как начать работу?",
                instructionText: "Нажмите кнопку 'Поиск сигналов' для генерации новых сигналов. После генерации вы сможете перегенерировать сигналы через 5 минут.",
                generatingSignals: "Генерация сигналов...",
                updateIn: "Обновление через:",
                minutes: "мин",
                seconds: "сек",
                signalGenerated: "Сигнал сгенерирован",
                searchInProgress: "Поиск сигналов...",
                waitForCompletion: "Дождитесь завершения",
                generatingViaAPI: "Запуск генерации через API..."
            }
        };
        
        this.init();
    }

    async init() {
        await this.setupLanguage();
        this.setupEventListeners();
        this.updateKyivTime();
        setInterval(() => this.updateKyivTime(), 1000);
        
        // Перевіряємо час останньої генерації
        this.checkGenerationTime();
        
        // Завантажуємо сигнали при старті
        await this.loadSignals();
        
        // Запускаємо перевірку активних таймерів
        this.startTimerChecks();
    }

    setupEventListeners() {
        // Кнопка пошуку сигналів
        document.getElementById('search-signals-btn').addEventListener('click', () => {
            this.startSignalGeneration();
        });
        
        // Кнопка перегенерації
        document.getElementById('refresh-btn').addEventListener('click', () => {
            if (!document.getElementById('refresh-btn').disabled) {
                this.regenerateSignals();
            }
        });
        
        // Перемикач мов
        document.getElementById('lang-uk').addEventListener('click', () => {
            this.switchLanguage('uk');
        });
        
        document.getElementById('lang-ru').addEventListener('click', () => {
            this.switchLanguage('ru');
        });
    }

    async startSignalGeneration() {
        const btn = document.getElementById('search-signals-btn');
        const originalText = btn.innerHTML;
        
        btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${this.translate('generatingViaAPI')}`;
        btn.disabled = true;
        
        try {
            // Імітація запуску генерації через GitHub API
            // В реальності тут буде виклик до GitHub Actions API
            await this.simulateAPICall();
            
            // Оновлюємо час генерації
            this.lastGenerationTime = new Date();
            localStorage.setItem('lastGenerationTime', this.lastGenerationTime.toISOString());
            
            // Блокуємо кнопку на 5 хвилин
            this.disableRefreshButton(5);
            
            // Оновлюємо інтерфейс
            this.showMessage('success', this.translate('signalGenerated'));
            
            // Оновлюємо сигнали через 10 секунд (час на генерацію)
            setTimeout(() => {
                this.loadSignals(true);
                btn.innerHTML = originalText;
                btn.disabled = false;
            }, 10000);
            
        } catch (error) {
            console.error('Помилка генерації:', error);
            this.showMessage('error', 'Помилка генерації сигналів');
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    }

    simulateAPICall() {
        return new Promise((resolve) => {
            // Імітуємо затримку API
            setTimeout(resolve, 2000);
        });
    }

    disableRefreshButton(minutes) {
        const btn = document.getElementById('refresh-btn');
        const timerBadge = document.getElementById('refresh-timer');
        let timeLeft = minutes * 60;
        
        btn.disabled = true;
        
        const updateTimer = () => {
            const minutesLeft = Math.floor(timeLeft / 60);
            const secondsLeft = timeLeft % 60;
            
            timerBadge.textContent = `${minutesLeft}:${secondsLeft.toString().padStart(2, '0')}`;
            
            if (timeLeft <= 0) {
                btn.disabled = false;
                timerBadge.textContent = '';
                clearInterval(this.refreshTimer);
                this.showMessage('info', this.translate('regenerateBtn') + ' ' + this.translate('nowAvailable'));
            } else {
                timeLeft--;
            }
        };
        
        // Очищаємо попередній таймер
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
        }
        
        this.refreshTimer = setInterval(updateTimer, 1000);
        updateTimer(); // Викликаємо відразу
    }

    checkGenerationTime() {
        if (this.lastGenerationTime) {
            const now = new Date();
            const diffMs = now - this.lastGenerationTime;
            const diffMinutes = Math.floor(diffMs / (1000 * 60));
            
            if (diffMinutes < 5) {
                const minutesLeft = 5 - diffMinutes;
                this.disableRefreshButton(minutesLeft);
            }
        }
    }

    async loadSignals(force = false) {
        try {
            const timestamp = new Date().getTime();
            const response = await fetch(`${this.signalsUrl}?t=${timestamp}`);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await response.json();
            this.processSignals(data, force);
            
        } catch (error) {
            console.error('Помилка завантаження:', error);
            this.showError(this.translate('noSignalsYet'));
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
            lastUpdate.textContent = '--:--:--';
            activeSignalsElement.textContent = '0';
            totalSignalsElement.textContent = '0';
            return;
        }
        
        // Оновлюємо час останнього оновлення
        if (data.last_update) {
            const updateDate = new Date(data.last_update);
            lastUpdate.textContent = this.formatTime(updateDate, true);
        }
        
        // Оновлюємо статистику
        activeSignalsElement.textContent = data.active_signals || 0;
        totalSignalsElement.textContent = data.total_signals || data.signals.length;
        
        // Генеруємо HTML для сигналів
        let html = '';
        let hasActiveSignals = false;
        
        data.signals.forEach((signal, index) => {
            // Фільтрація: confidence > 70%
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
            noSignals.style.display = 'block';
        } else {
            container.innerHTML = html;
            noSignals.style.display = 'none';
            
            // Налаштовуємо таймери для всіх сигналів
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
        
        // Конвертуємо час в київський
        const entryTimeKyiv = this.convertToKyivTime(signal.entry_timestamp || signal.timestamp);
        const generatedTime = this.convertToKyivTime(signal.generated_at);
        
        // Перекладаємо причину, якщо потрібно
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
        
        // Парсимо час входу
        const entryDate = new Date(entryTime);
        const endDate = new Date(entryDate.getTime() + duration * 60000);
        const now = new Date();
        
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
                
                // Зберігаємо стан таймера
                this.activeTimers.set(signalId, {
                    isActive: true,
                    endTime: endDate.getTime(),
                    updateInterval: setInterval(() => updateTimerDisplay(), 1000)
                });
            } else {
                // Таймер завершився
                clearInterval(this.activeTimers.get(signalId)?.updateInterval);
                this.activeTimers.delete(signalId);
                
                container.innerHTML = `
                    <div class="signal-feedback">
                        <p>${this.translate('signalCorrect')}</p>
                        <div class="feedback-buttons">
                            <button class="feedback-btn feedback-yes" onclick="signalDisplay.giveFeedback('${signalId}', 'yes')">
                                ${this.translate('replyYes')}
                            </button>
                            <button class="feedback-btn feedback-no" onclick="signalDisplay.giveFeedback('${signalId}', 'no')">
                                ${this.translate('replyNo')}
                            </button>
                            <button class="feedback-btn feedback-skip" onclick="signalDisplay.giveFeedback('${signalId}', 'skip')">
                                ${this.translate('replySkip')}
                            </button>
                        </div>
                    </div>
                `;
            }
        };
        
        // Запускаємо таймер
        updateTimerDisplay();
    }

    startTimerChecks() {
        // Перевіряємо таймери кожну секунду
        setInterval(() => {
            this.activeTimers.forEach((timer, signalId) => {
                if (timer.isActive && Date.now() >= timer.endTime) {
                    this.setupSignalTimer({}, signalId); // Оновлюємо відображення
                }
            });
        }, 1000);
    }

    giveFeedback(signalId, feedback) {
        const signalElement = document.getElementById(signalId);
        if (!signalElement) return;
        
        const asset = signalElement.dataset.asset;
        console.log(`Feedback for ${asset}: ${feedback}`);
        
        // Видаляємо сигнал
        signalElement.remove();
        
        // Очищаємо таймер
        const timer = this.activeTimers.get(signalId);
        if (timer && timer.updateInterval) {
            clearInterval(timer.updateInterval);
        }
        this.activeTimers.delete(signalId);
        
        // Оновлюємо статистику
        this.updateSignalCount();
    }

    updateSignalCount() {
        const container = document.getElementById('signals-container');
        const activeSignals = container.querySelectorAll('.signal-card').length;
        document.getElementById('active-signals').textContent = activeSignals;
        
        if (activeSignals === 0) {
            document.getElementById('no-signals').style.display = 'block';
        }
    }

    async regenerateSignals() {
        const btn = document.getElementById('refresh-btn');
        btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${this.translate('regenerateBtn')}`;
        btn.disabled = true;
        
        // Імітуємо затримку
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Запускаємо нову генерацію
        await this.startSignalGeneration();
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

    showError(message) {
        const container = document.getElementById('signals-container');
        container.innerHTML = `
            <div class="error-state">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Помилка</h3>
                <p>${message}</p>
                <button onclick="signalDisplay.loadSignals(true)" class="refresh-btn">
                    <i class="fas fa-redo"></i> Спробувати знову
                </button>
            </div>
        `;
    }

    showMessage(type, text) {
        // Можна реалізувати тости
        console.log(`${type}: ${text}`);
    }

    async setupLanguage() {
        this.applyLanguage(this.language);
        
        // Оновлюємо активні кнопки
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.lang === this.language);
        });
    }

    switchLanguage(lang) {
        this.language = lang;
        localStorage.setItem('language', lang);
        this.applyLanguage(lang);
        
        // Оновлюємо активні кнопки
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.lang === lang);
        });
        
        // Перезавантажуємо сигнали для оновлення перекладу
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

// Глобальна змінна для доступу з HTML
let signalDisplay;

// Запуск при завантаженні сторінки
document.addEventListener('DOMContentLoaded', () => {
    signalDisplay = new SignalDisplay();
    window.signalDisplay = signalDisplay;
});
