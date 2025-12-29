class SignalDisplay {
    constructor() {
        this.currentLang = 'uk';
        this.activeSignals = [];
        this.timers = {};
        this.translations = {
            uk: {
                title: "AI Trading Signals",
                updateBtn: "Оновити",
                activeSignals: "Активних сигналів",
                serverTime: "Час сервера",
                noSignals: "Наразі немає сигналів",
                waitUpdate: "Очікуйте наступного оновлення",
                confidence: "Впевненість",
                entryTime: "Час входу",
                duration: "Тривалість",
                created: "Створено",
                analysis: "Аналіз AI",
                timezone: "Часова зона: Київ (UTC+2)",
                feedbackQuestion: "Сигнал був вірний?",
                feedbackYes: "Так",
                feedbackNo: "Ні",
                feedbackSkip: "Я не перевіряв"
            },
            ru: {
                title: "AI Торговые Сигналы",
                updateBtn: "Обновить",
                activeSignals: "Активных сигналов",
                serverTime: "Время сервера",
                noSignals: "Сейчас нет сигналов",
                waitUpdate: "Ожидайте следующего обновления",
                confidence: "Уверенность",
                entryTime: "Время входа",
                duration: "Длительность",
                created: "Создано",
                analysis: "Анализ ИИ",
                timezone: "Часовой пояс: Киев (UTC+2)",
                feedbackQuestion: "Сигнал был верным?",
                feedbackYes: "Да",
                feedbackNo: "Нет",
                feedbackSkip: "Я не проверял"
            }
        };
        this.init();
    }

    async init() {
        this.setupLanguageSwitcher();
        await this.loadSignals();
        this.startAutoUpdate();
        this.updateKyivTime();
        setInterval(() => this.updateKyivTime(), 1000);
    }

    setupLanguageSwitcher() {
        // Відновлюємо збережену мову
        const savedLang = localStorage.getItem('preferred_lang') || 'uk';
        this.setLanguage(savedLang);
        
        // Налаштування кнопок
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const lang = e.target.dataset.lang;
                this.setLanguage(lang);
            });
        });
    }

    setLanguage(lang) {
        this.currentLang = lang;
        localStorage.setItem('preferred_lang', lang);
        
        // Оновлюємо активну кнопку
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.lang === lang);
        });
        
        // Оновлюємо переклад
        this.updateTranslations();
        
        // Перезавантажуємо сигнали для нового перекладу
        this.loadSignals();
    }

    updateTranslations() {
        const t = this.translations[this.currentLang];
        
        // Оновлюємо всі елементи з дата-атрибутами
        document.querySelectorAll('[data-translate]').forEach(el => {
            const key = el.dataset.translate;
            if (t[key]) {
                el.textContent = t[key];
            }
        });
        
        // Оновлюємо кнопку оновлення
        const refreshBtn = document.querySelector('.refresh-btn .btn-text');
        if (refreshBtn) refreshBtn.textContent = t.updateBtn;
    }

    async loadSignals(forceRefresh = false) {
        try {
            // Якщо примусове оновлення, додаємо параметр
            const url = forceRefresh ? 
                `${this.signalsUrl}?force=${Date.now()}` : 
                `${this.signalsUrl}?t=${Date.now()}`;
            
            const response = await fetch(url);
            
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const data = await response.json();
            this.processSignals(data);
            
        } catch (error) {
            console.error('Помилка завантаження:', error);
            this.showError('Не вдалося завантажити сигнали. Спробуйте пізніше.');
        }
    }

    processSignals(data) {
        if (!data || !data.signals || data.signals.length === 0) {
            this.showNoSignals();
            return;
        }

        // Фільтруємо сигнали: тільки з confidence > 70% і актуальні
        const now = new Date();
        const validSignals = data.signals.filter(signal => {
            // Перевірка впевненості
            if (signal.confidence < 0.7) return false;
            
            // Перевірка часу входу (має бути в майбутньому або зараз)
            const entryTime = this.parseEntryTime(signal.entry_time);
            if (entryTime < now) return false;
            
            // Перевірка тривалості (не більше 5 хвилин)
            if (signal.duration > 5) return false;
            
            return true;
        });

        // Сортуємо по часу входу (найближчі перші)
        validSignals.sort((a, b) => {
            return this.parseEntryTime(a.entry_time) - this.parseEntryTime(b.entry_time);
        });

        // Беремо тільки 3 найактуальніші
        this.activeSignals = validSignals.slice(0, 3);
        
        this.updateDisplay(this.activeSignals, data.last_update);
        this.startSignalTimers();
    }

    parseEntryTime(timeStr) {
        const now = new Date();
        const [hours, minutes] = timeStr.split(':').map(Number);
        const entryTime = new Date(now);
        entryTime.setHours(hours, minutes, 0, 0);
        
        // Якщо час вже пройшов сьогодні, це наступний день
        if (entryTime < now) {
            entryTime.setDate(entryTime.getDate() + 1);
        }
        
        return entryTime;
    }

    updateDisplay(signals, lastUpdate) {
        const container = document.getElementById('signals-container');
        const noSignals = document.getElementById('no-signals');
        
        if (signals.length === 0) {
            container.innerHTML = '';
            noSignals.style.display = 'block';
            return;
        }
        
        noSignals.style.display = 'none';
        
        // Оновлюємо останнє оновлення
        if (lastUpdate) {
            const updateDate = new Date(lastUpdate);
            const kyivTime = this.convertToKyivTime(updateDate);
            document.getElementById('last-update').textContent = 
                kyivTime.toLocaleString('uk-UA') + ' (Київ)';
        }
        
        // Оновлюємо кількість активних сигналів
        document.getElementById('active-signals').textContent = signals.length;
        
        // Генеруємо HTML для сигналів
        let html = '';
        
        signals.forEach((signal, index) => {
            const confidencePercent = Math.round(signal.confidence * 100);
            const t = this.translations[this.currentLang];
            
            html += `
                <div class="signal-card ${signal.direction.toLowerCase()}" id="signal-${index}">
                    <div class="signal-header">
                        <div class="asset-info">
                            <div class="asset-icon">
                                <i class="fas fa-chart-line"></i>
                            </div>
                            <div>
                                <div class="asset-name">${signal.asset}</div>
                                <small>Таймфрейм: 2 хвилини | Київський час</small>
                            </div>
                        </div>
                        <div class="direction-badge">
                            ${signal.direction === 'UP' ? '📈 CALL' : '📉 PUT'}
                        </div>
                    </div>
                    
                    <div class="signal-details">
                        <div class="detail-item">
                            <div class="label">
                                <i class="fas fa-bullseye"></i> ${t.confidence}
                            </div>
                            <div class="value">
                                ${confidencePercent}%
                            </div>
                        </div>
                        
                        <div class="detail-item">
                            <div class="label">
                                <i class="far fa-clock"></i> ${t.entryTime}
                            </div>
                            <div class="value">
                                ${signal.entry_time}
                                <small style="display: block; font-size: 0.8em; color: #666;">(Київ)</small>
                            </div>
                        </div>
                        
                        <div class="detail-item">
                            <div class="label">
                                <i class="fas fa-hourglass-half"></i> ${t.duration}
                            </div>
                            <div class="value">${signal.duration} хв</div>
                        </div>
                    </div>
                    
                    <div class="signal-timer" id="timer-${index}" style="display: none;">
                        <div class="timer-display"></div>
                    </div>
                    
                    <div class="signal-feedback" id="feedback-${index}" style="display: none;">
                        <p>${t.feedbackQuestion}</p>
                        <div class="feedback-buttons">
                            <button class="feedback-btn feedback-yes" onclick="handleFeedback('${signal.id}', true)">
                                ${t.feedbackYes}
                            </button>
                            <button class="feedback-btn feedback-no" onclick="handleFeedback('${signal.id}', false)">
                                ${t.feedbackNo}
                            </button>
                            <button class="feedback-btn feedback-skip" onclick="skipFeedback('${signal.id}')">
                                ${t.feedbackSkip}
                            </button>
                        </div>
                    </div>
                    
                    ${signal.reason ? `
                    <div class="signal-reason">
                        <div class="reason-header">
                            <i class="fas fa-lightbulb"></i> ${t.analysis}
                        </div>
                        <div class="reason-text">${signal.reason}</div>
                    </div>
                    ` : ''}
                    
                    <div class="signal-footer">
                        <span><i class="fas fa-globe-europe"></i> ${t.timezone}</span>
                        <span><i class="fas fa-brain"></i> Модель: Llama 4</span>
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
    }

    startSignalTimers() {
        // Очищаємо попередні таймери
        Object.values(this.timers).forEach(timer => clearInterval(timer));
        this.timers = {};
        
        this.activeSignals.forEach((signal, index) => {
            const entryTime = this.parseEntryTime(signal.entry_time);
            const duration = signal.duration * 60000; // в мілісекундах
            const timerElement = document.getElementById(`timer-${index}`);
            const feedbackElement = document.getElementById(`feedback-${index}`);
            
            const updateTimer = () => {
                const now = new Date();
                const timeToEntry = entryTime - now;
                
                if (timeToEntry > 0) {
                    // Очікуємо часу входу
                    timerElement.style.display = 'block';
                    timerElement.querySelector('.timer-display').textContent = 
                        `До входу: ${Math.ceil(timeToEntry / 1000)} сек`;
                } else if (now - entryTime < duration) {
                    // Угода активна
                    const elapsed = now - entryTime;
                    const remaining = duration - elapsed;
                    timerElement.style.display = 'block';
                    timerElement.querySelector('.timer-display').textContent = 
                        `Залишилось: ${Math.ceil(remaining / 1000)} сек`;
                } else {
                    // Угода завершилась
                    timerElement.style.display = 'none';
                    feedbackElement.style.display = 'block';
                }
            };
            
            // Запускаємо таймер
            updateTimer();
            this.timers[index] = setInterval(updateTimer, 1000);
            
            // Автоматичне приховування питання через 1 хвилину
            setTimeout(() => {
                if (feedbackElement.style.display === 'block') {
                    feedbackElement.style.display = 'none';
                    this.handleSignalCompletion(signal.id);
                }
            }, 60000);
        });
    }

    handleSignalCompletion(signalId) {
        // Логіка обробки завершення сигналу
        console.log(`Сигнал ${signalId} завершено`);
        // Тут можна додати відправку на сервер або оновлення локальних даних
    }

    // Інші методи залишаються незмінними...
}

// Глобальні функції для кнопок
async function forceRefreshSignals() {
    const signalDisplay = window.signalDisplay;
    if (signalDisplay) {
        signalDisplay.loadSignals(true);
    }
}

function handleFeedback(signalId, isCorrect) {
    console.log(`Feedback for ${signalId}: ${isCorrect ? 'correct' : 'incorrect'}`);
    // Тут можна відправити feedback на сервер
    document.querySelector(`#feedback-${signalId}`).style.display = 'none';
}

function skipFeedback(signalId) {
    console.log(`Skipped feedback for ${signalId}`);
    document.querySelector(`#feedback-${signalId}`).style.display = 'none';
}

// Ініціалізація при завантаженні
document.addEventListener('DOMContentLoaded', () => {
    window.signalDisplay = new SignalDisplay();
});
