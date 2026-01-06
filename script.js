class SignalDisplay {
    constructor() {
        this.signalsUrl = 'data/signals.json';
        this.historyUrl = 'data/history.json';
        this.feedbackUrl = 'data/feedback.json';
        this.kyivTZ = 'Europe/Kiev';
        this.language = localStorage.getItem('language') || 'uk';
        this.activeTimers = new Map();
        this.signalTimers = new Map();
        this.updateInterval = null;
        this.autoUpdateTimer = null;
        this.nextUpdateTime = null;
        this.currentFeedbackSignal = null;
        
        // 🆕 НОВЕ: змінні для відстеження змін
        this.lastUpdateHash = null;
        this.lastSignalCount = 0;
        this.forceReloadCounter = 0;
        this.maxForceReloads = 3; // Максимум 3 спроби примусового оновлення
        
        console.log("🤖 Signal Display ініціалізовано");
        console.log("🕐 Час браузера: " + new Date().toLocaleString('uk-UA'));
        console.log("🌐 URL сигналів: " + this.signalsUrl);
        console.log("💾 Збережена мова: " + this.language);
        
        // 🆕 ЗМІНА: Встановлюємо оновлення кожні 5 секунд для МИТТЄВОГО відображення
        this.updateIntervalTime = 5000; // 5 секунд
        
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
                generatedAt: "Згенеровано:",
                expiresAt: "Зникає о:",
                cacheWarning: "⚠️ Оновлюємо кеш...",
                newSignalsDetected: "🎯 Виявлено нові сигнали!",
                reloadingPage: "🔄 Перезавантаження сторінки...",
                doNotClose: "Не закривайте вікно"
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
                generatedAt: "Сгенерировано:",
                expiresAt: "Исчезнет в:",
                cacheWarning: "⚠️ Обновляем кеш...",
                newSignalsDetected: "🎯 Обнаружены новые сигналы!",
                reloadingPage: "🔄 Перезагрузка страницы...",
                doNotClose: "Не закрывайте окно"
            }
        };
        
        this.init();
    }

    async init() {
        await this.setupLanguage();
        this.setupEventListeners();
        this.updateKyivTime();
        setInterval(() => this.updateKyivTime(), 1000);
        
        // Перше завантаження через 1 секунду
        setTimeout(() => {
            console.log("📥 Перше завантаження сигналів...");
            this.loadSignals();
            this.startAutoUpdate();
        }, 1000);
        
        this.startSignalCleanupCheck();
        
        // Закриття модального вікна при кліку поза ним
        document.addEventListener('click', (e) => {
            const modal = document.getElementById('feedback-modal');
            if (e.target === modal) {
                this.hideFeedbackModal();
            }
        });
        
        // 🆕 Додаємо слухач для кнопки ручного оновлення (можна додати в HTML)
        this.addManualRefreshButton();
    }

    addManualRefreshButton() {
        // Додаємо кнопку ручного оновлення в header
        const headerControls = document.querySelector('.header-controls');
        if (headerControls && !document.getElementById('manual-refresh-btn')) {
            const refreshBtn = document.createElement('button');
            refreshBtn.id = 'manual-refresh-btn';
            refreshBtn.className = 'refresh-btn';
            refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Оновити зараз';
            refreshBtn.onclick = () => {
                console.log("🔄 Ручне оновлення...");
                this.forceLoadSignals();
            };
            headerControls.appendChild(refreshBtn);
        }
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
        // Автоматичне оновлення кожні 5 секунд для МИТТЄВОГО відображення
        this.updateInterval = setInterval(() => {
            console.log("🔄 Автоматичне оновлення сигналів...");
            this.loadSignals();
        }, this.updateIntervalTime);
        
        // Оновлюємо таймер наступного оновлення
        this.updateNextUpdateTimer();
        setInterval(() => this.updateNextUpdateTimer(), 1000);
        
        console.log("✅ Автооновлення активоване: кожні " + (this.updateIntervalTime / 1000) + " секунд");
    }

    updateNextUpdateTimer() {
        if (!this.nextUpdateTime) {
            this.nextUpdateTime = Date.now() + this.updateIntervalTime;
        }
        
        const now = Date.now();
        const timeLeft = this.nextUpdateTime - now;
        
        if (timeLeft <= 0) {
            this.nextUpdateTime = now + this.updateIntervalTime;
            return;
        }
        
        const seconds = Math.floor(timeLeft / 1000);
        
        // Безпечне оновлення елементів
        const updateTimer = document.getElementById('next-update-timer');
        const autoTimer = document.getElementById('next-auto-timer');
        
        if (updateTimer) {
            updateTimer.textContent = `${seconds}s`;
        }
        
        if (autoTimer) {
            autoTimer.textContent = `${seconds}s`;
        }
    }

    async forceLoadSignals() {
        // Примусове завантаження сигналів
        console.log("🚀 ПРИМУСОВЕ завантаження сигналів...");
        this.showMessage('info', this.translate('cacheWarning'));
        this.lastUpdateHash = null; // Скидаємо хеш для примусового оновлення
        await this.loadSignals();
    }

    async loadSignals() {
        try {
            // 🆕 Додаємо випадковий параметр для уникнення кешування браузера
            const timestamp = new Date().getTime();
            const random = Math.random().toString(36).substring(7);
            const response = await fetch(`${this.signalsUrl}?t=${timestamp}&r=${random}`, {
                headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await response.json();
            console.log("✅ Сигнали завантажені:", data.signals?.length || 0, "сигналів");
            
            // 🆕 ПЕРЕВІРКА: Чи змінилися дані?
            const currentHash = this.calculateDataHash(data);
            const currentSignalCount = data.signals?.length || 0;
            
            console.log("🔍 Перевірка змін даних:");
            console.log("   Поточний хеш:", currentHash);
            console.log("   Попередній хеш:", this.lastUpdateHash);
            console.log("   Поточних сигналів:", currentSignalCount);
            console.log("   Попередніх сигналів:", this.lastSignalCount);
            
            // Якщо хеш не змінився і кількість сигналів така сама - виходимо
            if (currentHash === this.lastUpdateHash && currentSignalCount === this.lastSignalCount) {
                console.log("📊 Дані не змінилися, пропускаємо оновлення");
                
                // Перевіряємо, чи не пора примусово оновити сторінку
                this.forceReloadCounter++;
                if (this.forceReloadCounter >= 10) { // Кожні 50 секунд (5 сек × 10)
                    console.log("🔄 Примусове оновлення для синхронізації");
                    this.forceReloadCounter = 0;
                    this.showMessage('info', this.translate('cacheWarning'));
                    // Не перезавантажуємо повністю, просто перезавантажуємо дані
                    this.lastUpdateHash = null;
                    await this.loadSignals();
                    return;
                }
                
                return;
            }
            
            // 🆕 Дані змінилися! Оновлюємо
            console.log("🎯 ДАНІ ЗМІНИЛИСЯ! Оновлюємо відображення...");
            this.lastUpdateHash = currentHash;
            this.lastSignalCount = currentSignalCount;
            this.forceReloadCounter = 0; // Скидаємо лічильник
            
            // Показуємо повідомлення про нові сигнали
            if (currentSignalCount > 0) {
                this.showMessage('success', this.translate('newSignalsDetected'));
            }
            
            // Фільтруємо тільки актуальні сигнали (останні 10 хвилин)
            const nowKyiv = new Date();
            const tenMinutesAgo = new Date(nowKyiv.getTime() - 10 * 60000);
            
            // Перевіряємо, що сигнали дійсно актуальні
            if (data.signals && data.signals.length > 0) {
                console.log("🕐 Актуальність сигналів:");
                data.signals.forEach((signal, index) => {
                    if (signal.generated_at) {
                        const genTime = new Date(signal.generated_at);
                        const isRecent = genTime > tenMinutesAgo;
                        console.log(`  ${index + 1}. ${signal.asset}: ${genTime.toLocaleTimeString()} - ${isRecent ? '✅ Актуальний' : '❌ Старий'}`);
                    }
                });
            }
            
            this.processSignals(data);
            
            // Оновлюємо час наступного оновлення
            this.nextUpdateTime = Date.now() + this.updateIntervalTime;
            
        } catch (error) {
            console.error('❌ Помилка завантаження сигналів:', error);
            this.showMessage('error', 'Помилка завантаження сигналів. Спробуйте оновити сторінку.');
            
            // 🆕 Спроба перезавантажити сторінку при критичній помилці
            if (error.message.includes('Failed to fetch') || error.message.includes('Network')) {
                console.log("🌐 Проблема з мережею, спроба перезавантаження через 10 секунд...");
                setTimeout(() => {
                    this.showMessage('warning', this.translate('reloadingPage'));
                    setTimeout(() => {
                        window.location.reload();
                    }, 2000);
                }, 10000);
            }
        }
    }

    calculateDataHash(data) {
        // 🆕 Створюємо унікальний хеш для даних
        try {
            const str = JSON.stringify({
                last_update: data.last_update,
                signals_count: data.signals?.length || 0,
                // Додаємо тільки ID та час останніх 3 сигналів для швидкості
                recent_signals: data.signals?.slice(0, 3).map(s => ({
                    id: s.id,
                    generated_at: s.generated_at
                })) || []
            });
            return btoa(str); // Конвертуємо в base64
        } catch (e) {
            return Date.now().toString(); // Якщо помилка - використовуємо timestamp
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
            console.log("⚠️ Немає сигналів для відображення");
            container.innerHTML = this.getEmptyStateHTML();
            lastUpdate.textContent = '--:--:--';
            activeSignalsElement.textContent = '0';
            totalSignalsElement.textContent = '0';
            successRateElement.textContent = '0%';
            noSignals.style.display = 'block';
            return;
        }
        
        // Отримуємо час останнього оновлення з signals.json
        let lastUpdateTime = data.last_update;
        
        // Якщо немає last_update, беремо час найновішого сигналу
        if (!lastUpdateTime) {
            const latestSignal = data.signals.reduce((latest, current) => {
                const currentTime = new Date(current.generated_at || 0);
                const latestTime = new Date(latest.generated_at || 0);
                return currentTime > latestTime ? current : latest;
            });
            
            if (latestSignal && latestSignal.generated_at) {
                lastUpdateTime = latestSignal.generated_at;
                console.log("📊 Використано час з найновішого сигналу:", latestSignal.asset);
            }
        }
        
        // Конвертуємо час в київський формат
        if (lastUpdateTime) {
            try {
                const updateTime = this.convertToKyivTime(lastUpdateTime, true);
                lastUpdate.textContent = updateTime;
                console.log("🕐 Останнє оновлення (форматоване):", updateTime);
            } catch (e) {
                console.error("❌ Помилка конвертації часу:", e);
                lastUpdate.textContent = '--:--:--';
            }
        } else {
            lastUpdate.textContent = '--:--:--';
        }
        
        // Фільтруємо сигнали: тільки актуальні (не старіші 10 хвилин)
        const nowKyiv = new Date();
        const tenMinutesAgo = new Date(nowKyiv.getTime() - 10 * 60000);
        
        const recentSignals = data.signals.filter(signal => {
            if (!signal.generated_at) return false;
            const genTime = new Date(signal.generated_at);
            return genTime > tenMinutesAgo;
        });
        
        console.log(`📊 Загалом сигналів: ${data.signals.length}, Актуальних: ${recentSignals.length}`);
        
        // Статистика
        activeSignalsElement.textContent = recentSignals.length;
        totalSignalsElement.textContent = data.total_signals || data.signals.length;
        
        // Розрахунок успішності
        const successRate = this.calculateSuccessRate(recentSignals);
        successRateElement.textContent = `${successRate}%`;
        
        // Відображення сигналів
        if (recentSignals.length === 0) {
            container.innerHTML = this.getNoSignalsHTML();
            noSignals.style.display = 'block';
            console.log("📭 Немає актуальних сигналів (старіші 10 хвилин)");
        } else {
            let html = '';
            
            // Сортуємо сигнали за часом генерації (новіші перші)
            const sortedSignals = [...recentSignals].sort((a, b) => {
                const timeA = new Date(a.generated_at || 0);
                const timeB = new Date(b.generated_at || 0);
                return timeB - timeA;
            });
            
            // Обмежуємо до 6 останніх сигналів
            const latestSignals = sortedSignals.slice(0, 6);
            
            latestSignals.forEach((signal, index) => {
                const confidencePercent = Math.round(signal.confidence * 100);
                if (confidencePercent < 70) return;
                
                const signalHTML = this.createSignalHTML(signal, index);
                if (signalHTML) {
                    html += signalHTML;
                }
            });
            
            container.innerHTML = html;
            noSignals.style.display = 'none';
            
            console.log("📊 Відображено актуальних сигналів:", latestSignals.length);
            
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
        
        // Час закінчення
        const expiryTime = signal.expires_at ? 
            this.convertToKyivTime(signal.expires_at) : '--:--';
        
        // Причина від AI
        let reason = signal.reason || '';
        
        // 🆕 Додаємо час генерації для дебагу
        const debugTime = signal.generated_at ? 
            new Date(signal.generated_at).toLocaleTimeString('uk-UA') : 'N/A';
        
        return `
            <div class="signal-card ${directionClass}" id="signal-${index}" 
                 data-generated="${signal.generated_at}" 
                 data-asset="${signal.asset}"
                 data-index="${index}"
                 data-debug="${debugTime}">
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
                            <i class="fas fa-calendar"></i> ${this.translate('generatedAt')}
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
                        ${this.translate('expiresAt')}: <span class="expiry-time">${expiryTime}</span>
                    </div>
                    <button class="feedback-trigger" onclick="signalDisplay.showFeedbackModal(${index})">
                        <i class="fas fa-star"></i> ${this.translate('giveFeedback')}
                    </button>
                </div>
                
                <!-- 🆕 Додаємо інформацію про час генерації для дебагу -->
                <div class="debug-info" style="font-size: 10px; color: #888; margin-top: 5px;">
                    ID: ${signal.id || 'N/A'} | Генерація: ${debugTime}
                </div>
            </div>
        `;
    }

    setupSignalTimer(signal, index) {
        const timerElement = document.getElementById(`timer-${index}`);
        const expiryElement = document.getElementById(`expiry-${index}`);
        if (!timerElement || !expiryElement) return;
        
        const generatedTime = new Date(signal.generated_at || signal.last_updated);
        const expiryTime = new Date(generatedTime.getTime() + 10 * 60000); // 10 хвилин
        
        const updateTimer = () => {
            const now = new Date();
            const timeToExpiry = expiryTime - now;
            
            if (timeToExpiry <= 0) {
                // Час вийшов - видаляємо сигнал
                console.log(`⏰ Сигнал ${signal.asset} завершився`);
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
            
            // Оновлюємо час закінчення
            if (expiryElement.querySelector('.expiry-time')) {
                expiryElement.querySelector('.expiry-time').textContent = 
                    `${minutes}:${seconds.toString().padStart(2, '0')}`;
            }
            
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
        // Проста логіка розрахунку (для демо)
        if (!signals || signals.length === 0) return 0;
        
        const successfulSignals = signals.filter(s => 
            s.confidence >= 0.8 || s.direction === 'UP'
        ).length;
        
        return Math.round((successfulSignals / signals.length) * 100);
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
        
        console.log("📝 Відкрито фідбек для сигналу:", asset);
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
            await new Promise(resolve => setTimeout(resolve, 500));
            
            console.log("💾 Фідбек збережено:", { asset, feedback });
            
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

    convertToKyivTime(dateString, includeSeconds = false) {
        if (!dateString) return '--:--';
        try {
            const date = new Date(dateString);
            return date.toLocaleTimeString('uk-UA', {
                timeZone: 'Europe/Kiev',
                hour: '2-digit',
                minute: '2-digit',
                second: includeSeconds ? '2-digit' : undefined
            });
        } catch (e) {
            console.error("❌ Помилка конвертації часу:", e);
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
                    <i class="fas fa-robot"></i>
                </div>
                <p>${this.translate('loadingSignals')}</p>
                <small>${this.translate('firstLoad')} <span id="first-load-timer">1</span> сек</small>
            </div>
        `;
    }

    getNoSignalsHTML() {
        return `
            <div class="empty-state">
                <i class="fas fa-chart-line"></i>
                <h3>${this.translate('noSignalsNow')}</h3>
                <p>${this.translate('nextAutoUpdate')} <span id="next-auto-timer">5s</span></p>
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
        
        // Видаляємо попередні повідомлення
        const messages = messageContainer.querySelectorAll('.message');
        if (messages.length > 3) {
            messages[0].remove();
        }
        
        setTimeout(() => {
            messageDiv.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => {
                if (messageDiv.parentNode) {
                    messageDiv.parentNode.removeChild(messageDiv);
                }
            }, 300);
        }, 3000);
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
    
    // Додаємо таймер для першого завантаження
    let loadTimer = 1;
    const timerElement = document.getElementById('first-load-timer');
    if (timerElement) {
        const timerInterval = setInterval(() => {
            loadTimer--;
            timerElement.textContent = loadTimer;
            if (loadTimer <= 0) {
                clearInterval(timerInterval);
            }
        }, 1000);
    }
    
    // 🆕 Додаємо слухач для оновлення при поверненні на вкладку
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            console.log("🔍 Сторінка стала видимою, оновлюємо сигнали...");
            signalDisplay.forceLoadSignals();
        }
    });
});
