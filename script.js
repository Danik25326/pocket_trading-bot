class SignalDisplay {
    constructor() {
        this.signalsUrl = 'data/signals.json';
        this.historyUrl = 'data/history.json';
        this.updateInterval = 10000; // 10 секунд
        this.signalsData = null;
        this.lastUpdateTime = null;
        this.updateTimer = null;
        this.nextUpdateTimer = null;
        this.init();
    }

    async init() {
        await this.loadSignals();
        this.startAutoUpdate();
        this.setupEventListeners();
        this.updateServerTime();
        setInterval(() => this.updateServerTime(), 1000);
    }

    async loadSignals() {
        try {
            const timestamp = new Date().getTime();
            const response = await fetch(`${this.signalsUrl}?t=${timestamp}`);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await response.json();
            this.signalsData = data;
            this.lastUpdateTime = new Date();
            this.updateDisplay(data);
            
            // Оновлюємо статистику
            await this.updateStatistics();
            
        } catch (error) {
            console.error('Помилка завантаження:', error);
            this.showError('Помилка завантаження сигналів. Перевірте підключення.');
        }
    }

    async updateStatistics() {
        try {
            const response = await fetch(`${this.historyUrl}?t=${new Date().getTime()}`);
            if (response.ok) {
                const history = await response.json();
                this.updateStatsDisplay(history);
            }
        } catch (error) {
            console.error('Помилка завантаження статистики:', error);
        }
    }

    updateDisplay(data) {
        const container = document.getElementById('signals-container');
        const noSignals = document.getElementById('no-signals');
        
        if (!data || !data.signals || data.signals.length === 0) {
            container.innerHTML = '';
            noSignals.style.display = 'block';
            this.updateLastUpdate(null);
            document.getElementById('active-signals').textContent = '0';
            return;
        }
        
        noSignals.style.display = 'none';
        
        // Оновлюємо час останнього оновлення
        this.updateLastUpdate(data.last_update);
        
        // Оновлюємо кількість активних сигналів
        document.getElementById('active-signals').textContent = data.signals.length;
        
        // Створюємо HTML для сигналів
        let html = '';
        
        data.signals.forEach(signal => {
            const confidencePercent = Math.round(signal.confidence * 100);
            const confidenceClass = this.getConfidenceClass(confidencePercent);
            const directionClass = signal.direction.toLowerCase();
            const entryTime = signal.entry_time || 'Не вказано';
            const duration = signal.duration || '2';
            
            html += `
                <div class="signal-card ${directionClass}">
                    <div class="signal-header">
                        <div class="asset-info">
                            <div class="asset-icon">
                                <i class="fas fa-chart-line"></i>
                            </div>
                            <div>
                                <div class="asset-name">${signal.asset}</div>
                                <small>Таймфрейм: 2 хвилини</small>
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
                                <span class="confidence-badge ${confidenceClass}">
                                    ${this.getConfidenceText(confidencePercent)}
                                </span>
                            </div>
                        </div>
                        
                        <div class="detail-item">
                            <div class="label">
                                <i class="far fa-clock"></i> Час входу
                            </div>
                            <div class="value">${entryTime}</div>
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
                            <div class="value">${this.formatTime(signal.generated_at)}</div>
                        </div>
                    </div>
                    
                    ${signal.reason ? `
                    <div class="signal-reason">
                        <div class="reason-header">
                            <i class="fas fa-lightbulb"></i> Аналіз AI
                        </div>
                        <div class="reason-text">${signal.reason}</div>
                    </div>
                    ` : ''}
                    
                    <div class="signal-footer">
                        <span><i class="fas fa-microchip"></i> Модель: Llama 4 Maverick</span>
                        <span>ID: ${signal.asset}_${signal.entry_time || '0000'}</span>
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
    }

    updateStatsDisplay(history) {
        const total = history.length;
        const successful = history.filter(s => s.actual_result === 'win').length;
        const successRate = total > 0 ? Math.round((successful / total) * 100) : 0;
        
        document.getElementById('total-signals').textContent = total;
        document.getElementById('success-rate').textContent = `${successRate}%`;
    }

    updateLastUpdate(timestamp) {
        const element = document.getElementById('last-update');
        const agoElement = document.getElementById('update-ago');
        
        if (!timestamp) {
            element.textContent = '--:--:--';
            agoElement.textContent = '';
            return;
        }
        
        const updateDate = new Date(timestamp);
        const now = new Date();
        const diffMs = now - updateDate;
        const diffMins = Math.floor(diffMs / 60000);
        
        element.textContent = updateDate.toLocaleTimeString('uk-UA');
        
        if (diffMins < 1) {
            agoElement.textContent = 'щойно';
        } else if (diffMins < 60) {
            agoElement.textContent = `${diffMins} хв. тому`;
        } else {
            const hours = Math.floor(diffMins / 60);
            agoElement.textContent = `${hours} год. тому`;
        }
    }

    updateServerTime() {
        const now = new Date();
        const kyivTime = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Kiev' }));
        const timeString = kyivTime.toLocaleTimeString('uk-UA', { 
            hour: '2-digit', 
            minute: '2-digit',
            second: '2-digit'
        });
        
        document.getElementById('server-time').textContent = timeString;
    }

    getConfidenceClass(percent) {
        if (percent >= 85) return 'confidence-high';
        if (percent >= 70) return 'confidence-medium';
        return 'confidence-low';
    }

    getConfidenceText(percent) {
        if (percent >= 85) return 'Висока';
        if (percent >= 70) return 'Середня';
        return 'Низька';
    }

    formatTime(timestamp) {
        if (!timestamp) return '--:--';
        try {
            const date = new Date(timestamp);
            return date.toLocaleTimeString('uk-UA', { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
        } catch (e) {
            return '--:--';
        }
    }

    showError(message) {
        const container = document.getElementById('signals-container');
        container.innerHTML = `
            <div class="error-state">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Помилка</h3>
                <p>${message}</p>
                <button onclick="location.reload()" class="refresh-btn">
                    <i class="fas fa-redo"></i> Спробувати знову
                </button>
            </div>
        `;
    }

    startAutoUpdate() {
        // Оновлюємо кожні 10 секунд
        this.updateTimer = setInterval(() => {
            this.loadSignals();
        }, this.updateInterval);
        
        // Оновлюємо при поверненні на вкладку
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.loadSignals();
            }
        });
    }

    setupEventListeners() {
        const refreshBtn = document.getElementById('refresh-btn');
        
        refreshBtn.addEventListener('click', () => {
            refreshBtn.classList.add('spinning');
            this.loadSignals().finally(() => {
                setTimeout(() => {
                    refreshBtn.classList.remove('spinning');
                }, 1000);
            });
        });
        
        // Клавіша F5 для оновлення
        document.addEventListener('keydown', (e) => {
            if (e.key === 'F5' || (e.ctrlKey && e.key === 'r')) {
                e.preventDefault();
                refreshBtn.click();
            }
        });
    }
}

// Запуск при завантаженні сторінки
document.addEventListener('DOMContentLoaded', () => {
    new SignalDisplay();
    
    // Додаємо стилі для помилок
    const style = document.createElement('style');
    style.textContent = `
        .error-state {
            text-align: center;
            padding: 60px 20px;
            background: #fed7d7;
            border-radius: 15px;
            border-left: 5px solid #f56565;
        }
        
        .error-state i {
            font-size: 3rem;
            color: #f56565;
            margin-bottom: 20px;
        }
        
        .error-state h3 {
            color: #742a2a;
            margin-bottom: 10px;
        }
        
        .error-state p {
            color: #744210;
            margin-bottom: 20px;
        }
    `;
    document.head.appendChild(style);
});
