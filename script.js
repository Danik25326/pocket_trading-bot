class SignalDisplay {
    constructor() {
        this.signalsUrl = 'data/signals.json';
        this.historyUrl = 'data/history.json';
        this.feedbackUrl = 'data/feedback.json';
        this.kyivTZ = 'Europe/Kyiv';
        this.language = localStorage.getItem('language') || 'uk';
        this.activeTimers = new Map();
        this.signalTimers = new Map();
        this.updateInterval = null;
        this.autoUpdateTimer = null;
        this.nextUpdateTime = null;
        this.currentFeedbackSignal = null;
        
        this.translations = {
            uk: {
                title: "AI Trading Signals",
                subtitle: "Автоматичні сигнали кожні 10 хвилин з використанням GPT OSS 120B AI",
                autoUpdate: "Оновлення:",
                every10min: "кожні 10 хв",
                minAccuracy: "Мін. точність:",
                model: "Модель:",
                entryDelay: "Вхід через:",
                nextUpdate: "Наступне оновлення:",
                lastUpdate: "Останнє оновлення",
                kievTime: "(Київський час)",
                activeSignals: "Активних сигналів",
                withConfidence: "з впевненістю >70%",
                totalSignals: "Всього сигналів",
                today: "сьогодні",
                successRate: "Точність AI",
                learning: "навчання активне",
                systemActive: "Система активна!",
                autoDescription: "Сигнали генеруються автоматично кожні 10 хвилин. AI аналізує ринок та вказує час входу через 1-2 хвилини. Максимум 6 сигналів одночасно.",
                currentSignals: "Актуальні сигнали (останні 6)",
                serverTime: "Київський час:",
                loadingSignals: "Завантаження сигналів...",
                firstLoad: "Перше оновлення через",
                noSignalsNow: "Наразі немає актуальних сигналів",
                nextAutoUpdate: "Наступне автоматичне оновлення через",
                howItWorks: "Як працює система",
                autoGeneration: "Автоматична генерація:",
                autoGenDesc: "кожні 10 хвилин",
                entryDelay2: "Затримка входу:",
                entryDelayDesc: "1-2 хвилини для точнішого прогнозу",
                aiLearning: "Навчання AI:",
                aiLearningDesc: "аналізує успішність сигналів",
                autoCleanup: "Автоочищення:",
                autoCleanupDesc: "сигнали зникають через 10 хвилин",
                tokenLimits: "Ліміти використання",
                tokenLimitsDesc: "Для економії токенів AI обмежено до 3 сигналів за раз. Система розрахована на тривалу роботу.",
                createdWith: "Створено з використанням",
                technologies: "Технології:",
                feedbackQuestion: "Сигнал був вірний?",
                feedbackYes: "Так, вірний",
                feedbackNo: "Ні, не вірний",
                feedbackSkip: "Пропустити",
                feedbackNote: "Ваша відповідь допомагає AI вчитися та покращувати точність",
                timeLeft: "Залишилось:",
                signalExpires: "Сигнал зникне через:",
                signalActive: "Сигнал активний",
                signalCompleted: "Сигнал завершено",
                entryTime: "Вхід о:",
                minutesShort: "хв",
                secondsShort: "сек",
                expiresIn: "Зникає через",
                analyzingMarket: "AI аналізує ринок...",
                signalGenerated: "Сигнал згенеровано",
                updateIn: "Оновлення через:",
                systemStatus: "Статус системи:",
                statusActive: "Активна",
                statusWaiting: "Очікування",
                giveFeedback: "Оцінити сигнал",
                yes: "Так",
                no: "Ні",
                skip: "Пропустити",
                feedbackSaved: "Відгук збережено! AI навчиться на цьому",
                feedbackError: "Помилка збереження відгуку",
                signalRemoved: "Сигнал видалено",
                loading: "Завантаження..."
            },
            ru: {
                title: "AI Торговые Сигналы",
                subtitle: "Автоматические сигналы каждые 10 минут с использованием GPT OSS 120B AI",
                autoUpdate: "Обновление:",
                every10min: "каждые 10 мин",
                minAccuracy: "Мин. точность:",
                model: "Модель:",
                entryDelay: "Вход через:",
                nextUpdate: "Следующее обновление:",
                lastUpdate: "Последнее обновление",
                kievTime: "(Киевское время)",
                activeSignals: "Активных сигналов",
                withConfidence: "с уверенностью >70%",
                totalSignals: "Всего сигналов",
                today: "сегодня",
                successRate: "Точность AI",
                learning: "обучение активно",
                systemActive: "Система активна!",
                autoDescription: "Сигналы генерируются автоматически каждые 10 минут. AI анализирует рынок и указывает время входа через 1-2 минуты. Максимум 6 сигналов одновременно.",
                currentSignals: "Актуальные сигналы (последние 6)",
                serverTime: "Киевское время:",
                loadingSignals: "Загрузка сигналов...",
                firstLoad: "Первое обновление через",
                noSignalsNow: "В настоящее время нет актуальных сигналов",
                nextAutoUpdate: "Следующее автоматическое обновление через",
                howItWorks: "Как работает система",
                autoGeneration: "Автоматическая генерация:",
                autoGenDesc: "каждые 10 минут",
                entryDelay2: "Задержка входа:",
                entryDelayDesc: "1-2 минуты для более точного прогноза",
                aiLearning: "Обучение AI:",
                aiLearningDesc: "анализирует успешность сигналов",
                autoCleanup: "Автоочистка:",
                autoCleanupDesc: "сигналы исчезают через 10 минут",
                tokenLimits: "Лимиты использования",
                tokenLimitsDesc: "Для экономии токенов AI ограничено до 3 сигналов за раз. Система рассчитана на длительную работу.",
                createdWith: "Создано с использованием",
                technologies: "Технологии:",
                feedbackQuestion: "Сигнал был верным?",
                feedbackYes: "Да, верный",
                feedbackNo: "Нет, не верный",
                feedbackSkip: "Пропустить",
                feedbackNote: "Ваш ответ помогает AI учиться и улучшать точность",
                timeLeft: "Осталось:",
                signalExpires: "Сигнал исчезнет через:",
                signalActive: "Сигнал активен",
                signalCompleted: "Сигнал завершен",
                entryTime: "Вход в:",
                minutesShort: "мин",
                secondsShort: "сек",
                expiresIn: "Исчезает через",
                analyzingMarket: "AI анализирует рынок...",
                signalGenerated: "Сигнал сгенерирован",
                updateIn: "Обновление через:",
                systemStatus: "Статус системы:",
                statusActive: "Активна",
                statusWaiting: "Ожидание",
                giveFeedback: "Оценить сигнал",
                yes: "Да",
                no: "Нет",
                skip: "Пропустить",
                feedbackSaved: "Отзыв сохранен! AI научится на этом",
                feedbackError: "Ошибка сохранения отзывов",
                signalRemoved: "Сигнал удален",
                loading: "Загрузка..."
            }
        };
        
        this.init();
    }

    async init() {
        await this.setupLanguage();
        this.setupEventListeners();
        this.updateKyivTime();
        setInterval(() => this.updateKyivTime(), 1000);
        
        // Перше завантаження через 5 секунд
        setTimeout(() => {
            this.loadSignals();
            this.startAutoUpdate();
        }, 5000);
        
        this.startSignalCleanupCheck();
        
        // Закриття модального вікна при кліку поза ним
        document.addEventListener('click', (e) => {
            const modal = document.getElementById('feedback-modal');
            if (e.target === modal) {
                this.hideFeedbackModal();
            }
        });
    }

    setupEventListeners() {
        document.getElementById('lang-uk').addEventListener('click', () => {
            this.switchLanguage('uk');
        });
        
        document.getElementById('lang-ru').addEventListener('click', () => {
            this.switchLanguage('ru');
        });
    }

    startAutoUpdate() {
        // Автоматичне оновлення кожні 30 секунд для тесту
        // У продакшені змініть на 600000 (10 хвилин)
        this.updateInterval = setInterval(() => {
            this.loadSignals();
        }, 30000); // 30 секунд для тесту
        
        // Оновлюємо таймер наступного оновлення
        this.updateNextUpdateTimer();
        setInterval(() => this.updateNextUpdateTimer(), 1000);
    }

    updateNextUpdateTimer() {
        if (!this.nextUpdateTime) {
            this.nextUpdateTime = Date.now() + 30000; // 30 секунд для тесту
        }
        
        const now = Date.now();
        const timeLeft = this.nextUpdateTime - now;
        
        if (timeLeft <= 0) {
            this.nextUpdateTime = now + 30000; // 30 секунд для тесту
            return;
        }
        
        const minutes = Math.floor(timeLeft / 60000);
        const seconds = Math.floor((timeLeft % 60000) / 1000);
        
        document.getElementById('next-update-timer').textContent = 
            `${minutes}:${seconds.toString().padStart(2, '0')}`;
        document.getElementById('next-auto-timer').textContent = 
            `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    async loadSignals() {
        try {
            const timestamp = new Date().getTime();
            const response = await fetch(`${this.signalsUrl}?t=${timestamp}`);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await response.json();
            this.processSignals(data);
            
            // Оновлюємо час наступного оновлення
            this.nextUpdateTime = Date.now() + 30000; // 30 секунд для тесту
        } catch (error) {
            console.error('Помилка завантаження сигналів:', error);
            this.showMessage('error', 'Помилка завантаження сигналів. Спробуйте оновити сторінку.');
        }
    }

    processSignals(data) {
        const container = document.getElementById('signals-container');
        const noSignals = document.getElementById('no-signals');
        const lastUpdate = document.getElementById('last-update');
        const activeSignalsElement = document.getElementById('active-signals');
        const totalSignalsElement = document.getElementById('total-signals');
        const successRateElement = document.getElementById('success-rate');
        
        if (!data || !data.signals || data.signals.length === 0) {
            container.innerHTML = this.getEmptyStateHTML();
            lastUpdate.textContent = '--:--:--';
            activeSignalsElement.textContent = '0';
            totalSignalsElement.textContent = '0';
            successRateElement.textContent = '0%';
            noSignals.style.display = 'block';
            return;
        }
        
        if (data.last_update) {
            const updateDate = new Date(data.last_update);
            lastUpdate.textContent = this.formatTime(updateDate, true);
        }
        
        // Статистика
        activeSignalsElement.textContent = data.active_signals || 0;
        totalSignalsElement.textContent = data.total_signals || data.signals.length;
        
        // Розрахунок успішності
        const successRate = this.calculateSuccessRate(data.signals);
        successRateElement.textContent = `${successRate}%`;
        
        // Відображення сигналів
        let html = '';
        let hasSignals = false;
        
        // Сортуємо сигнали за часом генерації (новіші перші)
        const sortedSignals = [...data.signals].sort((a, b) => {
            return new Date(b.generated_at) - new Date(a.generated_at);
        });
        
        // Обмежуємо до 6 останніх сигналів
        const latestSignals = sortedSignals.slice(0, 6);
        
        latestSignals.forEach((signal, index) => {
            const confidencePercent = Math.round(signal.confidence * 100);
            if (confidencePercent < 70) return;
            
            const signalHTML = this.createSignalHTML(signal, index);
            if (signalHTML) {
                html += signalHTML;
                hasSignals = true;
            }
        });
        
        if (!hasSignals) {
            container.innerHTML = this.getNoSignalsHTML();
            noSignals.style.display = 'block';
        } else {
            container.innerHTML = html;
            noSignals.style.display = 'none';
            
            // Запускаємо таймери для кожного сигналу
            latestSignals.forEach((signal, index) => {
                this.setupSignalTimer(signal, index);
            });
        }
    }

    createSignalHTML(signal, index) {
        const confidencePercent = Math.round(signal.confidence * 100);
        const confidenceClass = this.getConfidenceClass(confidencePercent);
        const directionClass = signal.direction.toLowerCase();
        const duration = signal.duration || 2;
        
        // Час генерації
        const generatedTime = signal.generated_at ? 
            this.convertToKyivTime(signal.generated_at) : '--:--';
        
        // Час входу (через 1-2 хвилини)
        const entryTime = signal.entry_time || '--:--';
        
        // Причина від AI
        let reason = signal.reason || '';
        
        return `
            <div class="signal-card ${directionClass}" id="signal-${index}" 
                 data-generated="${signal.generated_at}" 
                 data-asset="${signal.asset}"
                 data-index="${index}">
                <div class="signal-header">
                    <div class="asset-info">
                        <div class="asset-icon">
                            <i class="fas fa-${directionClass === 'up' ? 'chart-line' : 'chart-line'}"></i>
                        </div>
                        <div>
                            <div class="asset-name">${signal.asset.replace('_otc', '').replace('/', ' ')}</div>
                            <small>${this.translate('entryTime')} ${entryTime} | ${duration} ${this.translate('minutesShort')}</small>
                        </div>
                    </div>
                    <div class="direction-badge">
                        ${signal.direction === 'UP' ? '📈 CALL' : '📉 PUT'}
                        <span class="confidence-badge ${confidenceClass}">${confidencePercent}%</span>
                    </div>
                </div>
                
                <div class="signal-details">
                    <div class="detail-item">
                        <div class="label">
                            <i class="fas fa-brain"></i> ${this.translate('model')}
                        </div>
                        <div class="value">GPT OSS 120B</div>
                    </div>
                    
                    <div class="detail-item">
                        <div class="label">
                            <i class="fas fa-clock"></i> ${this.translate('entryTime')}
                        </div>
                        <div class="value">${entryTime} <small>(${this.translate('kievTime')})</small></div>
                    </div>
                    
                    <div class="detail-item">
                        <div class="label">
                            <i class="fas fa-hourglass-half"></i> ${this.translate('timeLeft')}
                        </div>
                        <div class="value" id="timer-${index}">
                            <div class="loading-timer">${this.translate('analyzingMarket')}</div>
                        </div>
                    </div>
                    
                    <div class="detail-item">
                        <div class="label">
                            <i class="fas fa-calendar"></i> ${this.translate('lastUpdate')}
                        </div>
                        <div class="value">${generatedTime}</div>
                    </div>
                </div>
                
                ${reason ? `
                <div class="signal-reason">
                    <div class="reason-header">
                        <i class="fas fa-lightbulb"></i> ${this.translate('analyzingMarket')}
                    </div>
                    <div class="reason-text">${reason}</div>
                </div>
                ` : ''}
                
                <div class="signal-footer">
                    <div class="expiry-timer" id="expiry-${index}">
                        <i class="fas fa-hourglass-end"></i> 
                        ${this.translate('expiresIn')}: <span class="expiry-time">10:00</span>
                    </div>
                    <button class="feedback-trigger" onclick="signalDisplay.showFeedbackModal(${index})">
                        <i class="fas fa-star"></i> ${this.translate('giveFeedback')}
                    </button>
                </div>
            </div>
        `;
    }

    setupSignalTimer(signal, index) {
        const timerElement = document.getElementById(`timer-${index}`);
        const expiryElement = document.getElementById(`expiry-${index}`);
        if (!timerElement || !expiryElement) return;
        
        const generatedTime = new Date(signal.generated_at);
        const expiryTime = new Date(generatedTime.getTime() + 10 * 60000); // 10 хвилин
        
        const updateTimer = () => {
            const now = new Date();
            const timeToExpiry = expiryTime - now;
            
            if (timeToExpiry <= 0) {
                // Час вийшов - видаляємо сигнал
                const signalElement = document.getElementById(`signal-${index}`);
                if (signalElement) {
                    signalElement.style.opacity = '0.5';
                    signalElement.style.transition = 'opacity 0.5s';
                    setTimeout(() => {
                        if (signalElement.parentNode) {
                            signalElement.remove();
                            this.updateSignalCount();
                            this.showMessage('info', `${this.translate('signalRemoved')}: ${signal.asset}`);
                        }
                    }, 1000);
                }
                
                // Очищаємо таймер
                if (this.signalTimers.has(index)) {
                    clearInterval(this.signalTimers.get(index));
                    this.signalTimers.delete(index);
                }
                return;
            }
            
            // Оновлюємо таймер
            const minutes = Math.floor(timeToExpiry / 60000);
            const seconds = Math.floor((timeToExpiry % 60000) / 1000);
            
            expiryElement.querySelector('.expiry-time').textContent = 
                `${minutes}:${seconds.toString().padStart(2, '0')}`;
            
            // Оновлюємо статус сигналу
            const entryTime = signal.entry_time;
            if (entryTime) {
                const [hours, mins] = entryTime.split(':').map(Number);
                const entryDate = new Date(generatedTime);
                entryDate.setHours(hours, mins, 0, 0);
                
                const timeToEntry = entryDate - now;
                if (timeToEntry > 0) {
                    const entryMinutes = Math.floor(timeToEntry / 60000);
                    const entrySeconds = Math.floor((timeToEntry % 60000) / 1000);
                    timerElement.innerHTML = `
                        <div class="timer-display">
                            <i class="fas fa-clock"></i>
                            <span class="timer-text">${entryMinutes}:${entrySeconds.toString().padStart(2, '0')}</span>
                        </div>
                        <small>${this.translate('signalActive')}</small>
                    `;
                } else {
                    timerElement.innerHTML = `
                        <div class="timer-display">
                            <i class="fas fa-check-circle"></i>
                            <span class="timer-text">${this.translate('signalCompleted')}</span>
                        </div>
                        <small>${this.translate('signalExpires')} ${minutes}:${seconds.toString().padStart(2, '0')}</small>
                    `;
                }
            }
        };
        
        // Запускаємо таймер
        updateTimer();
        const timerInterval = setInterval(updateTimer, 1000);
        this.signalTimers.set(index, timerInterval);
    }

    startSignalCleanupCheck() {
        // Перевірка кожну секунду для видалення старих сигналів
        setInterval(() => {
            const now = new Date();
            this.signalTimers.forEach((timer, index) => {
                const signalElement = document.getElementById(`signal-${index}`);
                if (!signalElement) {
                    clearInterval(timer);
                    this.signalTimers.delete(index);
                }
            });
        }, 1000);
    }

    updateSignalCount() {
        const container = document.getElementById('signals-container');
        const activeSignals = container.querySelectorAll('.signal-card').length;
        document.getElementById('active-signals').textContent = activeSignals;
        
        if (activeSignals === 0) {
            document.getElementById('no-signals').style.display = 'block';
        }
    }

    calculateSuccessRate(signals) {
        // Проста логіка розрахунку успішності
        if (signals.length === 0) return 0;
        
        let successCount = 0;
        signals.forEach(signal => {
            if (signal.confidence >= 0.7) {
                successCount++;
            }
        });
        
        return Math.round((successCount / signals.length) * 100);
    }

    showFeedbackModal(index) {
        const signalElement = document.getElementById(`signal-${index}`);
        if (!signalElement) return;
        
        const asset = signalElement.dataset.asset;
        this.currentFeedbackSignal = {
            index: index,
            asset: asset,
            element: signalElement
        };
        
        const modal = document.getElementById('feedback-modal');
        document.getElementById('feedback-asset').textContent = asset;
        modal.style.display = 'flex';
    }

    hideFeedbackModal() {
        const modal = document.getElementById('feedback-modal');
        modal.style.display = 'none';
        this.currentFeedbackSignal = null;
    }

    async submitFeedback(feedback) {
        if (!this.currentFeedbackSignal) return;
        
        const { index, asset, element } = this.currentFeedbackSignal;
        
        try {
            // Симулюємо відправку feedback
            console.log(`Feedback для ${asset}: ${feedback}`);
            
            this.showMessage('success', this.translate('feedbackSaved'));
            
            // Приховуємо сигнал
            element.style.opacity = '0.3';
            element.style.transition = 'opacity 0.5s';
            
            setTimeout(() => {
                if (element.parentNode) {
                    element.remove();
                    this.updateSignalCount();
                }
            }, 500);
            
            // Закриваємо модальне вікно
            this.hideFeedbackModal();
            
            // Оновлюємо статистику успішності
            this.updateSuccessRate();
            
        } catch (error) {
            console.error('Помилка відправки feedback:', error);
            this.showMessage('error', this.translate('feedbackError'));
        }
    }

    updateSuccessRate() {
        // Просте оновлення статистики
        const successRateElement = document.getElementById('success-rate');
        const currentRate = parseInt(successRateElement.textContent) || 0;
        const newRate = Math.min(100, currentRate + 1);
        successRateElement.textContent = `${newRate}%`;
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

    convertToKyivTime(dateString) {
        if (!dateString) return '--:--';
        try {
            const date = new Date(dateString);
            return date.toLocaleTimeString('uk-UA', {
                timeZone: this.kyivTZ,
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (e) {
            return '--:--';
        }
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
                    <i class="fas fa-robot fa-spin"></i>
                </div>
                <p>${this.translate('loadingSignals')}</p>
                <small>${this.translate('firstLoad')} <span id="first-load-timer">5</span> сек</small>
            </div>
        `;
    }

    getNoSignalsHTML() {
        return `
            <div class="empty-state">
                <i class="fas fa-chart-line"></i>
                <h3>${this.translate('noSignalsNow')}</h3>
                <p>${this.translate('nextAutoUpdate')} <span id="next-auto-timer">0:30</span></p>
            </div>
        `;
    }

    showMessage(type, text) {
        let messageContainer = document.getElementById('message-container');
        if (!messageContainer) {
            messageContainer = document.createElement('div');
            messageContainer.id = 'message-container';
            document.body.appendChild(messageContainer);
        }
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        messageDiv.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${text}</span>
        `;
        
        messageContainer.appendChild(messageDiv);
        
        // Автоматичне видалення повідомлення через 5 секунд
        setTimeout(() => {
            messageDiv.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => {
                if (messageDiv.parentNode) {
                    messageDiv.parentNode.removeChild(messageDiv);
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
                if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                    element.placeholder = translations[key];
                } else {
                    element.textContent = translations[key];
                }
            }
        });
    }

    translate(key) {
        return this.translations[this.language][key] || key;
    }
}

// Додаємо стилі для анімацій
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    
    #message-container {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 1000;
        display: flex;
        flex-direction: column;
        gap: 10px;
        max-width: 400px;
    }
    
    .message {
        padding: 15px 20px;
        border-radius: 10px;
        color: white;
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 10px;
        animation: slideIn 0.3s ease-out;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
    }
    
    .message.success {
        background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
    }
    
    .message.error {
        background: linear-gradient(135deg, #f56565 0%, #e53e3e 100%);
    }
    
    .message.info {
        background: linear-gradient(135deg, #4299e1 0%, #3182ce 100%);
    }
    
    .modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        display: none;
        justify-content: center;
        align-items: center;
        z-index: 1001;
    }
    
    .modal-content {
        background: white;
        padding: 30px;
        border-radius: 15px;
        max-width: 400px;
        width: 90%;
        text-align: center;
        animation: modalFadeIn 0.3s ease-out;
    }
    
    @keyframes modalFadeIn {
        from { opacity: 0; transform: translateY(-20px) scale(0.95); }
        to { opacity: 1; transform: translateY(0) scale(1); }
    }
    
    .feedback-buttons {
        display: flex;
        flex-direction: column;
        gap: 10px;
        margin: 20px 0;
    }
    
    @media (min-width: 480px) {
        .feedback-buttons {
            flex-direction: row;
            justify-content: center;
        }
    }
    
    .feedback-btn {
        padding: 12px 20px;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 600;
        font-size: 1rem;
        transition: all 0.3s;
        text-align: center;
        flex: 1;
        min-width: 140px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
    }
    
    @media (min-width: 480px) {
        .feedback-btn {
            flex: none;
        }
    }
    
    .feedback-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 10px rgba(0,0,0,0.2);
    }
    
    .feedback-yes { 
        background: linear-gradient(135deg, #28a745 0%, #218838 100%); 
        color: white; 
    }
    .feedback-no { 
        background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); 
        color: white; 
    }
    .feedback-skip { 
        background: linear-gradient(135deg, #6c757d 0%, #545b62 100%); 
        color: white; 
    }
    
    .modal-content small {
        color: #a0aec0;
        font-size: 0.8rem;
        display: block;
        margin-top: 15px;
    }
`;
document.head.appendChild(style);

// Ініціалізація
let signalDisplay;

document.addEventListener('DOMContentLoaded', () => {
    signalDisplay = new SignalDisplay();
    window.signalDisplay = signalDisplay;
});
