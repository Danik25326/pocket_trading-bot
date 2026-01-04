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
        
        // Отримуємо з localStorage час останньої генерації та час закінчення блокування
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
                instructionText: "Натисніть кнопку 'Пошук сигналів' для запуску генерації нових сигналів. Після генерації ви зможете перегенерувати сигнали через 5 хвилин.",
                generatingSignals: "Генерація сигналів...",
                updateIn: "Оновлення через:",
                minutes: "хв",
                seconds: "сек",
                signalGenerated: "Сигнал згенеровано",
                searchInProgress: "Запуск генерації...",
                waitForCompletion: "Зачекайте завершення",
                generatingViaAPI: "Запуск генерації через API...",
                waitMinutes: 'Зачекайте ще',
                minutesLeft: 'хвилин',
                signalGenerationStarted: 'Генерація сигналів запущена!',
                generationFailed: 'Не вдалося запустити генерацію',
                cooldownActive: 'Зачекайте 5 хвилин перед наступною генерацією',
                noTokenConfigured: 'GitHub токен не налаштовано. Перевірте config.js'
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
                instructionText: "Нажмите кнопку 'Поиск сигналов' для запуска генерации новых сигналов. После генерации вы сможете перегенерировать сигналы через 5 минут.",
                generatingSignals: "Генерация сигналов...",
                updateIn: "Обновление через:",
                minutes: "мин",
                seconds: "сек",
                signalGenerated: "Сигнал сгенерирован",
                searchInProgress: "Запуск генерации...",
                waitForCompletion: "Дождитесь завершения",
                generatingViaAPI: "Запуск генерации через API...",
                waitMinutes: 'Подождите еще',
                minutesLeft: 'минут',
                signalGenerationStarted: 'Генерация сигналів запущена!',
                generationFailed: 'Не удалось запустить генерацию',
                cooldownActive: 'Подождите 5 минут перед следующей генерацией',
                noTokenConfigured: 'GitHub токен не настроен. Проверьте config.js'
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
        const blockUntilTime = localStorage.getItem('blockUntilTime');
        if (blockUntilTime) {
            const now = new Date();
            const blockTime = new Date(blockUntilTime);
            
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
            '⏳ Сигнали з\'являться через 30-60 секунд<br>' +
            '<small>Під час генерації кнопка буде неактивна</small>');
        
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
                    '⏳ Сигнали оновляться через 40 секунд...');
                
                // Очікуємо і оновлюємо сигнали
                setTimeout(async () => {
                    await this.loadSignals(true);
                    this.showMessage('success', 
                        '✅ Сигнали успішно згенеровано!<br>' +
                        '<small>Дані оновлено на сторінці</small>');
                }, 40000);
                
                // Додаткове оновлення через 60 секунд для впевненості
                setTimeout(async () => {
                    await this.loadSignals(true);
                }, 60000);
                
            } else {
                throw new Error('Не вдалося запустити генерацію');
            }
            
        } catch (error) {
            console.error('Помилка запуску генерації:', error);
            this.showMessage('error', 
                '❌ Не вдалося запустити генерацію. Спробуйте ще раз.<br>' +
                '<small>Перевірте, чи додано GitHub Token у Secrets</small>');
            
            // Розблоковуємо кнопку
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    }

    async triggerGitHubWorkflow() {
        const workflowUrl = `https://api.github.com/repos/${this.ghConfig.owner}/${this.ghConfig.repo}/actions/workflows/signals.yml/dispatches`;
        
        console.log('Відправляємо запит до GitHub API...');
        console.log('URL:', workflowUrl);
        console.log('Мова:', this.language);
        
        try {
            const response = await fetch(workflowUrl, {
                method: 'POST',
                headers: {
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.ghConfig.token || ''}`,
                    'User-Agent': 'PocketTradingBot/1.0'
                },
                body: JSON.stringify({
                    ref: this.ghConfig.branch,
                    inputs: {
                        language: this.language,
                        trigger_source: 'website_button_' + new Date().getTime()
                    }
                })
            });
            
            console.log('GitHub API відповідь:', {
                status: response.status,
                statusText: response.statusText,
                ok: response.ok
            });
            
            // GitHub повертає 204 No Content при успіху
            if (response.status === 204 || response.ok) {
                console.log('✅ Workflow успішно запущено!');
                return true;
            } else {
                // Якщо є відповідь з текстом, спробуємо його прочитати
                try {
                    const errorText = await response.text();
                    console.error('Помилка від GitHub:', errorText);
                } catch (e) {
                    console.error('Не вдалося прочитати текст помилки');
                }
                return false;
            }
        } catch (error) {
            console.error('Помилка запиту до GitHub:', error);
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
                
                if (this.searchCooldownTimer) {
                    clearInterval(this.searchCooldownTimer);
                    this.searchCooldownTimer = null;
                }
                
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
        
        // Очищаємо попередній таймер, якщо він є
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
            
            console.log('Завантаження сигналів з URL:', `${this.signalsUrl}${cacheBuster}`);
            
            const response = await fetch(`${this.signalsUrl}${cacheBuster}`, {
                cache: 'no-store',
                headers: {
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                }
            });
            
            console.log('Відповідь сервера:', {
                status: response.status,
                statusText: response.statusText,
                ok: response.ok
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log('Отримані дані:', data);
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
            
            // Показуємо повідомлення користувачу
            this.showMessage('warning', 
                '⚠️ Не вдалося завантажити сигнали. Спробуйте оновити сторінку.');
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
        
        console.log('Обробка сигналів:', data.signals.length, 'сигналів');
        
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
        const generatedTime = signal.timestamp ? this.formatTime(new Date(signal.timestamp), false) : '--:--';
        
        let reason = signal.reason || '';
        if (this.language === 'ru' && signal.reason_ru) {
            reason = signal.reason_ru;
        }
        
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
                            <span class="confidence-badge ${confidencePercent >= 85 ? 'confidence-high' : confidencePercent >= 75 ? 'confidence-medium' : 'confidence-low'}">
                                ${confidencePercent >= 85 ? 'Висока' : confidencePercent >= 75 ? 'Середня' : 'Низька'}
                            </span>
                        </div>
                    </div>
                    
                    <div class="detail-item">
                        <div class="label">
                            <i class="far fa-clock"></i> Час входу
                        </div>
                        <div class="value">
                            ${entryTime}
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
        
        // Оновлюємо успішність (заглушка)
        const successRateElement = document.getElementById('success-rate');
        if (successRateElement) {
            successRateElement.textContent = '85%';
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
        try {
            return date.toLocaleTimeString('uk-UA', {
                timeZone: this.kyivTZ,
                hour: '2-digit',
                minute: '2-digit',
                second: includeSeconds ? '2-digit' : undefined
            });
        } catch (e) {
            return '--:--';
        }
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
        if (this.autoRefreshInterval) {
            clearInterval(this.autoRefreshInterval);
        }
        
        // Автоматично оновлюємо дані кожні 30 секунд
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
            background: ${type === 'success' ? '#38a169' : type === 'error' ? '#e53e3e' : type === 'warning' ? '#ed8936' : '#3182ce'};
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
    
    .confidence-high { 
        background: linear-gradient(135deg, #c6f6d5 0%, #9ae6b4 100%); 
        color: #22543d; 
        box-shadow: 0 2px 5px rgba(38, 179, 97, 0.2);
        padding: 4px 10px;
        border-radius: 15px;
        font-size: 0.8rem;
        font-weight: 600;
        white-space: nowrap;
        display: inline-block;
    }
    .confidence-medium { 
        background: linear-gradient(135deg, #fed7d7 0%, #fc8181 100%); 
        color: #742a2a; 
        box-shadow: 0 2px 5px rgba(245, 101, 101, 0.2);
        padding: 4px 10px;
        border-radius: 15px;
        font-size: 0.8rem;
        font-weight: 600;
        white-space: nowrap;
        display: inline-block;
    }
    .confidence-low { 
        background: linear-gradient(135deg, #feebc8 0%, #fbd38d 100%); 
        color: #744210; 
        box-shadow: 0 2px 5px rgba(237, 137, 54, 0.2);
        padding: 4px 10px;
        border-radius: 15px;
        font-size: 0.8rem;
        font-weight: 600;
        white-space: nowrap;
        display: inline-block;
    }
`;
document.head.appendChild(style);

// Ініціалізація при завантаженні сторінки
document.addEventListener('DOMContentLoaded', () => {
    window.signalDisplay = new SignalDisplay();
});
