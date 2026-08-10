/**
 * UI компонента Аналитика
 */

const AnalyticsUI = {
    /**
     * Рендеринг страницы аналитики
     */
    render() {
        const anomalies = AnalyticsService.detectAnomalies();
        
        const html = `
            <div class="section-header">
                <h3 class="section-title">Аналитика расходов</h3>
            </div>
            
            ${anomalies.length > 0 ? this.renderAnomalies(anomalies) : ''}
            
            <!-- Ключевые показатели -->
            <div class="cards-grid">
                <div class="card">
                    <div class="card-header">
                        <span class="card-title">Средний расход</span>
                        <span class="card-icon">📊</span>
                    </div>
                    <div class="card-value">${Utils.formatCurrency(AnalyticsService.getAverageExpense(6))}</div>
                    <div class="card-change">За последние 6 месяцев</div>
                </div>
                
                <div class="card">
                    <div class="card-header">
                        <span class="card-title">Минимальный расход</span>
                        <span class="card-icon">📉</span>
                    </div>
                    <div class="card-value">${Utils.formatCurrency(AnalyticsService.getMinMaxExpense(12).min)}</div>
                    <div class="card-change">За последний год</div>
                </div>
                
                <div class="card">
                    <div class="card-header">
                        <span class="card-title">Максимальный расход</span>
                        <span class="card-icon">📈</span>
                    </div>
                    <div class="card-value">${Utils.formatCurrency(AnalyticsService.getMinMaxExpense(12).max)}</div>
                    <div class="card-change">За последний год</div>
                </div>
                
                <div class="card">
                    <div class="card-header">
                        <span class="card-title">Изменение к прошлому месяцу</span>
                        <span class="card-icon">↔️</span>
                    </div>
                    <div class="card-value">
                        ${this.renderMonthChange()}
                    </div>
                    <div class="card-change">Месяц к месяцу</div>
                </div>
            </div>
            
            <!-- График по месяцам -->
            <div class="section">
                <div class="section-header">
                    <h3 class="section-title">Динамика расходов</h3>
                </div>
                <div class="chart-container">
                    <canvas id="monthChart"></canvas>
                </div>
            </div>
            
            <!-- График по категориям -->
            <div class="section">
                <div class="section-header">
                    <h3 class="section-title">Структура расходов</h3>
                </div>
                <div class="analytics-grid">
                    <div style="height: 300px;">
                        <canvas id="categoryChart"></canvas>
                    </div>
                    <div>
                        ${this.renderCategoryList()}
                    </div>
                </div>
            </div>
            
            <!-- Потребление по счетчикам -->
            <div class="section">
                <div class="section-header">
                    <h3 class="section-title">Потребление по счетчикам</h3>
                </div>
                ${this.renderMeterConsumption()}
            </div>
        `;

        document.getElementById('contentArea').innerHTML = html;
        
        // Инициализация графиков
        this.initCharts();
    },

    /**
     * Рендеринг аномалий
     */
    renderAnomalies(anomalies) {
        return `
            <div class="anomaly-alert">
                <span class="anomaly-icon">⚠️</span>
                <div class="anomaly-text">
                    <strong>Обнаружены аномалии потребления:</strong><br>
                    ${anomalies.map(a => 
                        `${a.serviceName}: расход ${a.consumption} ${a.unit} на ${a.percentAbove}% выше среднего`
                    ).join('<br>')}
                </div>
            </div>
        `;
    },

    /**
     * Изменение к прошлому месяцу
     */
    renderMonthChange() {
        const change = AnalyticsService.getMonthOverMonthChange();
        const sign = change.percent >= 0 ? '+' : '';
        const arrow = change.percent >= 0 ? '↑' : '↓';
        const colorClass = change.percent >= 0 ? 'text-danger' : 'text-success';
        
        return `<span class="${colorClass}">${arrow} ${sign}${Utils.formatPercent(Math.abs(change.percent))}</span>`;
    },

    /**
     * Список категорий
     */
    renderCategoryList() {
        const currentMonth = Utils.getCurrentMonth();
        const expenses = AnalyticsService.getExpensesByService(currentMonth);
        const total = expenses.reduce((sum, e) => sum + e.cost, 0);
        
        return `
            <div class="service-list">
                ${expenses.map(e => {
                    const percent = total > 0 ? ((e.cost / total) * 100).toFixed(1) : 0;
                    return `
                        <div class="service-item">
                            <div class="service-info">
                                <div class="service-name">${Utils.escapeHtml(e.serviceName)}</div>
                                <div class="service-details">${percent}% от общей суммы</div>
                            </div>
                            <div class="service-cost">
                                <div class="service-amount">${Utils.formatCurrency(e.cost)}</div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    },

    /**
     * Потребление по счетчикам
     */
    renderMeterConsumption() {
        const meters = MeterService.getAllMeters().filter(m => {
            const service = AppState.getServiceById(m.serviceId);
            return service && service.calcType === 'meter';
        });
        
        if (meters.length === 0) {
            return '<p class="text-secondary">Нет счетчиков для отображения</p>';
        }
        
        return `
            <div class="analytics-grid">
                ${meters.map(meter => {
                    const stats = AnalyticsService.getMeterStats(meter.id, 6);
                    const consumption = AnalyticsService.getMeterConsumption(meter.id, 6);
                    
                    return `
                        <div class="card">
                            <div class="card-header">
                                <span class="card-title">${Utils.escapeHtml(meter.name)}</span>
                            </div>
                            <div class="mb-3">
                                <div><strong>Среднее:</strong> ${Utils.formatNumber(stats.avg, 2)} ${meter.unit}</div>
                                <div><strong>Мин:</strong> ${Utils.formatNumber(stats.min, 2)} ${meter.unit}</div>
                                <div><strong>Макс:</strong> ${Utils.formatNumber(stats.max, 2)} ${meter.unit}</div>
                            </div>
                            <div style="height: 150px;">
                                <canvas id="meterChart_${meter.id}"></canvas>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    },

    /**
     * Инициализация графиков
     */
    initCharts() {
        // График по месяцам
        const monthData = AnalyticsService.getExpensesByMonth(12);
        ChartComponent.createExpenseChart('monthChart', {
            labels: monthData.map(d => d.label),
            values: monthData.map(d => d.total)
        });
        
        // График по категориям
        const currentMonth = Utils.getCurrentMonth();
        const categoryData = AnalyticsService.getExpensesByService(currentMonth);
        ChartComponent.createCategoryChart('categoryChart', {
            labels: categoryData.map(d => d.serviceName),
            values: categoryData.map(d => d.cost)
        });
        
        // Графики по счетчикам
        const meters = MeterService.getAllMeters().filter(m => {
            const service = AppState.getServiceById(m.serviceId);
            return service && service.calcType === 'meter';
        });
        
        meters.forEach(meter => {
            const consumption = AnalyticsService.getMeterConsumption(meter.id, 6);
            ChartComponent.createBarChart(`meterChart_${meter.id}`, {
                labels: consumption.map(d => d.label),
                values: consumption.map(d => d.consumption),
                label: meter.name,
                unit: meter.unit
            });
        });
    }
};
