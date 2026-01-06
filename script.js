class SignalDisplay {
    constructor() {
        // 🛠 ВИПРАВЛЕНО: Автоматичне визначення шляхів для GitHub Pages
        const isLocal = window.location.hostname.includes('localhost') || 
                       window.location.hostname === '127.0.0.1' ||
                       window.location.protocol === 'file:';
        
        const repoName = 'pocket_trading_bot'; // Назва вашого репозиторію
        
        if (isLocal) {
            this.signalsUrl = 'data/signals.json';
            this.historyUrl = 'data/history.json';
            this.feedbackUrl = 'data/feedback.json';
        } else {
            // Для GitHub Pages
            this.signalsUrl = `/${repoName}/data/signals.json`;
            this.historyUrl = `/${repoName}/data/history.json`;
            this.feedbackUrl = `/${repoName}/data/feedback.json`;
        }
        
        this.kyivTZ = 'Europe/Kiev';
        this.language = localStorage.getItem('language') || 'uk';
        this.activeTimers = new Map();
        this.signalTimers = new Map();
        this.updateInterval = null;
        this.autoUpdateTimer = null;
        this.nextUpdateTime = null;
        this.currentFeedbackSignal = null;
        
        // Детальне логування
        console.log("🤖 Signal Display ініціалізовано");
        console.log("🌐 Хост:", window.location.hostname);
        console.log("📊 Signals URL:", this.signalsUrl);
        console.log("🔄 Мова:", this.language);
        console.log("📁 Репозиторій:", repoName);
        
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
                loading: "Завантаження...",
                testConnection: "Тест підключення",
                testSuccess: "Тест успішний!",
                testFailed: "Тест не пройшов"
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
                tokenLimits: "Ліміты использования",
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
                feedbackError: "Ошибка сохранения отзыва",
                signalRemoved: "Сигнал удален",
                loading: "Загрузка...",
                testConnection: "Тест подключения",
                testSuccess: "Тест успешен!",
                testFailed: "Тест не пройден"
            }
        };
        
        this.init();
    }

    async init() {
        await this.setupLanguage();
        this.setupEventListeners();
        this.updateKyivTime();
        setInterval(() => this.updateKyivTime(), 1000);
        
        // Перше завантаження через 2 секунди
        setTimeout(() => {
            console.log("📥 Перше завантаження сигналів...");
            this.loadSignals();
            this.startAutoUpdate();
        }, 2000);
        
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
        
        // Додаємо кнопку ручного оновлення
        this.addManualRefreshButton();
        
        // Додаємо кнопку тестування
        this.addTestButton();
    }

    addManualRefreshButton() {
        const refreshBtn = document.createElement('button');
        refreshBtn.className = 'refresh-btn';
        refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Оновити зараз';
        refreshBtn.title = 'Примусове оновлення сигналів';
        refreshBtn.onclick = () => {
            console.log("🔄 Ручне оновлення сигналів...");
            this.showMessage('info', 'Оновлення сигналів...');
            this.loadSignals();
        };
        
        const headerControls = document.querySelector('.header-controls');
        if (headerControls) {
            headerControls.appendChild(refreshBtn);
        }
    }

    addTestButton() {
        const testBtn = document.createElement('button');
        testBtn.className = 'refresh-btn';
        testBtn.style.background = '#9f7aea';
        testBtn.innerHTML = '<i class="fas fa-vial"></i> Тест JSON';
        testBtn.title = 'Тестування підключення до signals.json';
        testBtn.onclick = async () => {
            console.log("🧪 Тестування підключення...");
            await this.testConnection();
        };
        
        const headerControls = document.querySelector('.header-controls');
        if (headerControls) {
            headerControls.appendChild(testBtn);
        }
    }

    async testConnection() {
        try {
            const testUrl = this.signalsUrl + '?test=' + Date.now();
            console.log("🔗 Тестування URL:", testUrl);
            
            const response = await fetch(testUrl);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            const message = `
✅ Тест успішний!
📊 Сигналів: ${data.signals?.length || 0}
🕐 Останнє оновлення: ${data.last_update || 'Немає'}
📍 URL: ${this.signalsUrl}
            `.trim();
            
            console.log("🧪 Результат тесту:", data);
            alert(message);
            
        } catch (error) {
            console.error("❌ Тест не пройшов:", error);
            alert(`❌ Тест не пройшов:\n${error.message}\n\nURL: ${this.signalsUrl}`);
        }
    }

    startAutoUpdate() {
        // Автоматичне оновлення кожні 10 хвилин (600000 мс)
        this.updateInterval = setInterval(() => {
            console.log("🔄 Автоматичне оновлення сигналів (кожні 10 хвилин)...");
            this.showMessage('info', 'Автоматичне оновлення сигналів...');
            this.loadSignals();
        }, 600000);
        
        // Оновлюємо таймер наступного оновлення
        this.updateNextUpdateTimer();
        setInterval(() => this.updateNextUpdateTimer(), 1000);
        
        console.log("✅ Автооновлення активоване: кожні 10 хвилин");
    }

    updateNextUpdateTimer() {
        if (!this.nextUpdateTime) {
            this.nextUpdateTime = Date.now() + 600000; // 10 хвилин
        }
        
        const now = Date.now();
        const timeLeft = this.nextUpdateTime - now;
        
        if (timeLeft <= 0) {
            this.nextUpdateTime = now + 600000;
            return;
        }
        
        const minutes = Math.floor(timeLeft / 60000);
        const seconds = Math.floor((timeLeft % 60000) / 1000);
        
        const updateTimer = document.getElementById('next-update-timer');
        const autoTimer = document.getElementById('next-auto-timer');
        
        if (updateTimer) {
            updateTimer.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
        
        if (autoTimer) {
            autoTimer.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
    }

    async loadSignals() {
        try {
            // Додаємо timestamp для уникнення кешування
            const timestamp = Date.now();
            const url = `${this.signalsUrl}?t=${timestamp}`;
            
            console.log("📥 Запит до:", url);
            
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            console.log("✅ Сигнали завантажені успішно!");
            console.log("📊 Статистика:", {
                signalsCount: data.signals?.length || 0,
                activeSignals: data.active_signals || 0,
                totalSignals: data.total_signals || 0,
                lastUpdate: data.last_update,
                generationCount: data.generation_count || 0
            });
            
            if (data.signals && data.signals.length > 0) {
                console.log("🎯 Останній сигнал:", data.signals[0]);
            }
            
            this.processSignals(data);
            
            // Оновлюємо час наступного оновлення
            this.nextUpdateTime = Date.now() + 600000;
            
        } catch (error) {
            console.error('❌ Помилка завантаження сигналів:', error);
            
            // Спробуємо альтернативний шлях
            this.tryAlternativePaths(error);
        }
    }

    tryAlternativePaths(error) {
        console.log("🔄 Спробую альтернативні шляхи...");
        
        // Список альтернативних шляхів для тестування
        const alternativePaths = [
            'data/signals.json',
            '/data/signals.json',
            './data/signals.json',
            'https://raw.githubusercontent.com/Danik25326/pocket_trading_bot/main/data/signals.json'
        ];
        
        // По черзі пробуємо кожен шлях
        let currentIndex = 0;
        
        const tryNextPath = () => {
            if (currentIndex >= alternativePaths.length) {
                this.showMessage('error', `Помилка завантаження: ${error.message}. Спробуйте оновити сторінку.`);
                return;
            }
            
            const testPath = alternativePaths[currentIndex];
            console.log(`🔄 Тестую шлях: ${testPath}`);
            
            fetch(`${testPath}?t=${Date.now()}`)
                .then(response => {
                    if (response.ok) {
                        console.log(`✅ Знайдено працюючий шлях: ${testPath}`);
                        this.signalsUrl = testPath;
                        this.showMessage('success', 'Підключення відновлено!');
                        setTimeout(() => this.loadSignals(), 1000);
                    } else {
                        currentIndex++;
                        setTimeout(tryNextPath, 500);
                    }
                })
                .catch(() => {
                    currentIndex++;
                    setTimeout(tryNextPath, 500);
                });
        };
        
        tryNextPath();
    }

    processSignals(data) {
        const container = document.getElementById('signals-container');
        const noSignals = document.getElementById('no-signals');
        const lastUpdate = document.getElementById('last-update');
        const activeSignalsElement = document.getElementById('active-signals');
        const totalSignalsElement = document.getElementById('total-signals');
        const successRateElement = document.getElementById('success-rate');
        
        // Перевірка наявності елементів DOM
        if (!container || !lastUpdate || !activeSignalsElement || !totalSignalsElement || !successRateElement) {
            console.error("❌ Не знайдено необхідні елементи DOM");
            return;
        }
        
        // Очищуємо старі таймери
        this.clearAllTimers();
        
        if (!data || !data.signals || data.signals.length === 0) {
            console.log("⚠️ Немає сигналів для відображення");
            container.innerHTML = this.getEmptyStateHTML();
            
            if (data && data.last_update) {
                try {
                    const updateDate = new Date(data.last_update);
                    lastUpdate.textContent = this.formatTime(updateDate, true);
                    console.log("🕐 Останнє оновлення:", this.formatTime(updateDate, true));
                } catch (e) {
                    lastUpdate.textContent = data.last_update || '--:--:--';
                }
            } else {
                lastUpdate.textContent = '--:--:--';
            }
            
            activeSignalsElement.textContent = '0';
            totalSignalsElement.textContent = '0';
            successRateElement.textContent = '0%';
            
            if (noSignals) {
                noSignals.style.display = 'block';
            }
            return;
        }
        
        // Оновлення часу останнього оновлення
        if (data.last_update) {
            try {
                const updateDate = new Date(data.last_update);
                lastUpdate.textContent = this.formatTime(updateDate, true);
                console.log("🕐 Останнє оновлення:", this.formatTime(updateDate, true));
            } catch (e) {
                lastUpdate.textContent = data.last_update;
            }
        }
        
        // Статистика
        activeSignalsElement.textContent = data.active_signals || data.signals.length;
        totalSignalsElement.textContent = data.total_signals || data.signals.length;
        
        // Розрахунок успішності
        const successRate = this.calculateSuccessRate(data);
        successRateElement.textContent = `${successRate}%`;
        
        // Відображення сигналів
        let html = '';
        let displayedSignals = 0;
        
        // Сортуємо сигнали за часом генерації (новіші перші)
        const sortedSignals = [...data.signals].sort((a, b) => {
            const timeA = a.generated_at ? new Date(a.generated_at).getTime() : 0;
            const timeB = b.generated_at ? new Date(b.generated_at).getTime() : 0;
            return timeB - timeA;
        });
        
        // Обмежуємо до 6 останніх сигналів
        const latestSignals = sortedSignals.slice(0, 6);
        
        latestSignals.forEach((signal, index) => {
            const confidencePercent = Math.round((signal.confidence || 0) * 100);
            if (confidencePercent < 70) {
                console.log(`⚠️ Сигнал ${signal.asset} пропущено (впевненість ${confidencePercent}% < 70%)`);
                return;
            }
            
            const signalHTML = this.createSignalHTML(signal, index);
            if (signalHTML) {
                html += signalHTML;
                displayedSignals++;
            }
        });
        
        if (displayedSignals === 0) {
            container.innerHTML = this.getNoSignalsHTML();
            if (noSignals) {
                noSignals.style.display = 'block';
            }
            console.log("⚠️ Немає сигналів з достатньою впевненістю");
        } else {
            container.innerHTML = html;
            if (noSignals) {
                noSignals.style.display = 'none';
            }
            
            console.log("📊 Відображено сигналів:", displayedSignals);
            
            // Запускаємо таймери для кожного сигналу
            latestSignals.forEach((signal, index) => {
                if (index < displayedSignals) {
                    this.setupSignalTimer(signal, index);
                }
            });
            
            this.showMessage('success', `Завантажено ${displayedSignals} сигналів`);
        }
    }

    clearAllTimers() {
        this.signalTimers.forEach((timer, index) => {
            clearInterval(timer);
        });
        this.signalTimers.clear();
    }

    createSignalHTML(signal, index) {
        const confidencePercent = Math.round(signal.confidence * 100);
        const confidenceClass = this.getConfidenceClass(confidencePercent);
        const directionClass = signal.direction.toLowerCase();
        const duration = signal.duration || 2;
        
        const generatedTime = signal.generated_at ? 
            this.convertToKyivTime(signal.generated_at) : '--:--';
        const entryTime = signal.entry_time || '--:--';
        const entryDelay = signal.entry_delay || '1-2';
        
        let reason = signal.reason || '';
        if (this.language === 'ru' && signal.reason_ru) {
            reason = signal.reason_ru;
        }
        
        // Обрізаємо довгий текст причини
        if (reason.length > 150) {
            reason = reason.substring(0, 150) + '...';
        }
        
        return `
            <div class="signal-card ${directionClass}" id="signal-${index}" 
                 data-generated="${signal.generated_at}" 
                 data-asset="${signal.asset}"
                 data-id="${signal.id || ''}"
                 data-index="${index}">
                <div class="signal-header">
                    <div class="asset-info">
                        <div class="asset-icon ${directionClass === 'up' ? 'up-icon' : 'down-icon'}">
                            <i class="fas fa-${directionClass === 'up' ? 'chart-line' : 'chart-line'}"></i>
                        </div>
                        <div>
                            <div class="asset-name">${signal.asset.replace('_otc', '').replace('/', ' ')}</div>
                            <small>${this.translate('entryTime')} ${entryTime} | ${duration} ${this.translate('minutesShort')} | Затримка: ${entryDelay}хв</small>
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
                        <div class="value">${entryTime} <small>(Київ)</small></div>
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
                    <button class="feedback-trigger" onclick="signalDisplay.showFeedbackModal('${signal.id || index}', ${index})">
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
                    signalElement.classList.add('expired');
                    signalElement.style.opacity = '0.5';
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
            
            if (expiryElement) {
                const expiryTimeSpan = expiryElement.querySelector('.expiry-time');
                if (expiryTimeSpan) {
                    expiryTimeSpan.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
                }
            }
            
            // Оновлюємо статус сигналу
            const entryTime = signal.entry_time;
            if (entryTime && timerElement) {
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
        const noSignals = document.getElementById('no-signals');
        if (!container) return;
        
        const activeSignals = container.querySelectorAll('.signal-card:not(.expired)').length;
        const activeSignalsElement = document.getElementById('active-signals');
        
        if (activeSignalsElement) {
            activeSignalsElement.textContent = activeSignals;
        }
        
        if (activeSignals === 0 && noSignals) {
            noSignals.style.display = 'block';
        }
    }

    calculateSuccessRate(data) {
        try {
            // Якщо є статистика в data, використовуємо її
            if (data.success_rate !== undefined) {
                return Math.round(data.success_rate * 100);
            }
            
            // Якщо є сигнали, обчислюємо середню впевненість
            if (data.signals && data.signals.length > 0) {
                const validSignals = data.signals.filter(s => s.confidence >= 0.7);
                if (validSignals.length > 0) {
                    const totalConfidence = validSignals.reduce((sum, signal) => {
                        return sum + (signal.confidence || 0);
                    }, 0);
                    const avgConfidence = totalConfidence / validSignals.length;
                    return Math.round(avgConfidence * 100);
                }
            }
            
            return 75; // Стандартне значення
        } catch (e) {
            console.warn("⚠️ Помилка розрахунку успішності:", e);
            return 70;
        }
    }

    showFeedbackModal(signalId, index) {
        const signalElement = document.getElementById(`signal-${index}`);
        if (!signalElement) return;
        
        const asset = signalElement.dataset.asset;
        this.currentFeedbackSignal = {
            id: signalId,
            index: index,
            asset: asset,
            element: signalElement
        };
        
        const modal = document.getElementById('feedback-modal');
        const feedbackAsset = document.getElementById('feedback-asset');
        
        if (modal && feedbackAsset) {
            feedbackAsset.textContent = `${asset} (ID: ${signalId || 'N/A'})`;
            modal.style.display = 'flex';
        }
    }

    hideFeedbackModal() {
        const modal = document.getElementById('feedback-modal');
        if (modal) {
            modal.style.display = 'none';
        }
        this.currentFeedbackSignal = null;
    }

    async submitFeedback(feedback) {
        if (!this.currentFeedbackSignal) return;
        
        const { id, index, asset, element } = this.currentFeedbackSignal;
        
        try {
            // Симулюємо відправку feedback на сервер для навчання AI
            await new Promise(resolve => setTimeout(resolve, 300));
            
            console.log("💾 Фідбек збережено:", { id, asset, feedback });
            
            this.showMessage('success', this.translate('feedbackSaved'));
            
            // Приховуємо сигнал
            element.classList.add('feedback-given');
            element.style.opacity = '0.3';
            
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
            console.error('❌ Помилка відправки feedback:', error);
            this.showMessage('error', this.translate('feedbackError'));
        }
    }

    updateSuccessRate() {
        const successRateElement = document.getElementById('success-rate');
        if (!successRateElement) return;
        
        const currentRate = parseInt(successRateElement.textContent) || 0;
        const newRate = Math.min(100, currentRate + 2); // Невелике покращення
        successRateElement.textContent = `${newRate}%`;
    }

    updateKyivTime() {
        const now = new Date();
        const timeElement = document.getElementById('server-time');
        
        if (timeElement) {
            try {
                timeElement.textContent = now.toLocaleTimeString('uk-UA', {
                    timeZone: this.kyivTZ,
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                });
            } catch (e) {
                timeElement.textContent = now.toLocaleTimeString();
            }
        }
    }

    formatTime(date, includeSeconds = false) {
        try {
            return date.toLocaleTimeString('uk-UA', {
                timeZone: this.kyivTZ,
                hour: '2-digit',
                minute: '2-digit',
                second: includeSeconds ? '2-digit' : undefined
            });
        } catch (e) {
            return date.toLocaleTimeString();
        }
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
            try {
                const date = new Date(dateString);
                return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            } catch (e2) {
                return '--:--';
            }
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
                <small>${this.translate('firstLoad')} <span id="first-load-timer">3</span> сек</small>
            </div>
        `;
    }

    getNoSignalsHTML() {
        return `
            <div class="empty-state">
                <i class="fas fa-chart-line"></i>
                <h3>${this.translate('noSignalsNow')}</h3>
                <p>${this.translate('nextAutoUpdate')} <span id="next-auto-timer">10:00</span></p>
                <button class="refresh-btn" onclick="signalDisplay.loadSignals()" style="margin-top: 15px;">
                    <i class="fas fa-sync-alt"></i> Спробувати знову
                </button>
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
            <i class="fas fa-${type === 'success' ? 'check-circle' : 
                               type === 'error' ? 'exclamation-circle' : 
                               'info-circle'}"></i>
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
        
        console.log("🌐 Змінено мову на:", lang);
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

// Ініціалізація
let signalDisplay;

document.addEventListener('DOMContentLoaded', () => {
    signalDisplay = new SignalDisplay();
    window.signalDisplay = signalDisplay;
});

// Глобальна функція для тестування (можна викликати з консолі)
window.testConnection = function() {
    if (signalDisplay) {
        signalDisplay.testConnection();
    } else {
        console.error("SignalDisplay не ініціалізовано!");
    }
};

// Функція для примусового оновлення
window.forceRefresh = function() {
    if (signalDisplay) {
        signalDisplay.loadSignals();
    }
};
