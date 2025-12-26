class SignalDisplay {
    constructor() {
        this.signalsUrl = 'data/signals.json';
        this.updateInterval = 10000; // 10 секунд
        this.init();
    }

    async init() {
        await this.loadSignals();
        this.startAutoUpdate();
    }

    async loadSignals() {
        try {
            const response = await fetch(this.signalsUrl + '?t=' + new Date().getTime());
            const data = await response.json();
            this.updateDisplay(data);
        } catch (error) {
            console.error('Помилка завантаження сигналів:', error);
            this.showError('Не вдалося завантажити сигнали');
        }
    }

    updateDisplay(data) {
        const container = document.getElementById('signals-container');
        const lastUpdate = document.getElementById('last-update');
        const activeSignals = document.getElementById('active-signals');

        if (!data || !data.signals) {
            container.innerHTML = '<div class="loading"><i class="fas fa-exclamation-circle"></i><p>Немає доступних сигналів</p></div>';
            return;
        }

        // Оновлюємо статистику
        lastUpdate.textContent = new Date(data.last_update).toLocaleString('uk-UA');
        activeSignals.textContent = data.signals.length;

        // Генеруємо сигнали
        if (data.signals.length === 0) {
            container.innerHTML = '<div class="signal-card"><p>Наразі немає сигналів з впевненістю >70%</p></div>';
            return;
        }

        let html = '';
        data.signals.forEach(signal => {
            const confidencePercent = Math.round(signal.confidence * 100);
            const time = new Date(signal.timestamp || signal.generated_at).toLocaleTimeString('uk-UA');
            
            html += `
                <div class="signal-card ${signal.direction.toLowerCase()}">
                    <div class="signal-header">
                        <div class="asset">${signal.asset}</div>
                        <div class="direction ${signal.direction.toLowerCase()}">${signal.direction}</div>
                    </div>
                    <div class="confidence">
                        Шанс успіху: <span class="confidence-value">${confidencePercent}%</span>
                    </div>
                    <div class="time">
                        <i class="far fa-clock"></i> Час входу: ${signal.entry_time} |
                        <i class="far fa-calendar"></i> Створено: ${time}
                    </div>
                    <div class="reason">
                        <strong>Аналіз:</strong> ${signal.reason || 'Технічний аналіз показав перевагу напрямку'}
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    }

    showError(message) {
        const container = document.getElementById('signals-container');
        container.innerHTML = `
            <div class="loading">
                <i class="fas fa-exclamation-triangle"></i>
                <p>${message}</p>
                <button onclick="location.reload()" style="margin-top: 10px; padding: 10px 20px; background: #667eea; color: white; border: none; border-radius: 5px; cursor: pointer;">
                    Спробувати знову
                </button>
            </div>
        `;
    }

    startAutoUpdate() {
        setInterval(() => this.loadSignals(), this.updateInterval);
    }
}

// Запуск при завантаженні сторінки
document.addEventListener('DOMContentLoaded', () => {
    new SignalDisplay();
});
