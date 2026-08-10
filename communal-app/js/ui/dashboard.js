/**
 * UI компонента Дашборд
 */

const DashboardUI = {
    /**
     * Рендеринг дашборда
     */
    render() {
        const currentMonth = Utils.getCurrentMonth();
        const currentYear = new Date().getFullYear();
        
        // Расчет основных показателей
        const currentExpenses = AppState.getTotalCharges(currentMonth);
        const currentPayments = AppState.getTotalPayments(currentMonth);
        const debt = AppState.calculateDebt();
        const avgExpense = AnalyticsService.getAverageExpense(6);
        const forecast = ForecastService.forecastTotal();
        
        // Изменение относительно прошлого месяца
        const momChange = AnalyticsService.getMonthOverMonthChange();
        
        // Расходы по услугам
        const expensesByService = AnalyticsService.getExpensesByService(currentMonth);
        const prevMonth = Utils.formatDate(Utils.subtractMonths(new Date(), 1), 'input').slice(0, 7);
        const prevExpenses = AnalyticsService.getExpensesByService(prevMonth);
        
        // Добавляем процент изменения к каждой услуге
        expensesByService.forEach(exp => {
            const prev = prevExpenses.find(e => e.serviceId === exp.serviceId);
            if (prev && prev.cost > 0) {
                exp.changePercent = Utils.calculatePercentChange(exp.cost, prev.cost);
            } else {
                exp.changePercent = 0;
            }
        });

        const html = `
            <!-- Карточки показателей -->
            <div class="cards-grid">
                <div class="card">
                    <div class="card-header">
                        <span class="card-title">Расходы за месяц</span>
                        <span class="card-icon">💰</span>
                    </div>
                    <div class="card-value">${Utils.formatCurrency(currentExpenses)}</div>
                    <div class="card-change ${momChange.percent >= 0 ? 'positive' : 'negative'}">
                        ${momChange.percent >= 0 ? '↑' : '↓'} ${Utils.formatPercent(Math.abs(momChange.percent))} к прошлому месяцу
                    </div>
                </div>
                
                <div class="card">
                    <div class="card-header">
                        <span class="card-title">Оплачено</span>
                        <span class="card-icon">💳</span>
                    </div>
                    <div class="card-value">${Utils.formatCurrency(currentPayments)}</div>
                    <div class="card-change">
                        За текущий месяц
                    </div>
                </div>
                
                <div class="card">
                    <div class="card-header">
                        <span class="card-title">Задолженность</span>
                        <span class="card-icon">⚠️</span>
                    </div>
                    <div class="card-value ${debt > 0 ? 'text-danger' : 'text-success'}">
                        ${debt > 0 ? Utils.formatCurrency(debt) : 'Нет'}
                    </div>
                    <div class="card-change">
                        ${debt > 0 ? 'Требуется оплата' : 'Все оплачено'}
                    </div>
                </div>
                
                <div class="card">
                    <div class="card-header">
                        <span class="card-title">Средний расход</span>
                        <span class="card-icon">📊</span>
                    </div>
                    <div class="card-value">${Utils.formatCurrency(avgExpense)}</div>
                    <div class="card-change">
                        За последние 6 месяцев
                    </div>
                </div>
                
                <div class="card">
                    <div class="card-header">
                        <span class="card-title">Прогноз на следующий месяц</span>
                        <span class="card-icon">🔮</span>
                    </div>
                    <div class="card-value">${Utils.formatCurrency(forecast.total)}</div>
                    <div class="card-change">
                        На основе средних значений
                    </div>
                </div>
            </div>
            
            <!-- График расходов -->
            <div class="section">
                <div class="section-header">
                    <h3 class="section-title">График расходов</h3>
                    <div class="chart-filters">
                        <button class="chart-filter" data-months="6">6 мес</button>
                        <button class="chart-filter active" data-months="12">12 мес</button>
                    </div>
                </div>
                <div class="chart-container">
                    <canvas id="expenseChart"></canvas>
                </div>
            </div>
            
            <!-- Расходы по услугам -->
            <div class="section">
                <div class="section-header">
                    <h3 class="section-title">Расходы по услугам</h3>
                </div>
                <div class="service-list">
                    ${expensesByService.map(service => this.renderServiceItem(service)).join('')}
                </div>
            </div>
        `;

        document.getElementById('contentArea').innerHTML = html;
        
        // Инициализация графика
        this.initExpenseChart(12);
        
        // Обработчики фильтров графика
        document.querySelectorAll('.chart-filter').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.chart-filter').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                const months = parseInt(e.target.dataset.months);
                this.initExpenseChart(months);
            });
        });
    },

    /**
     * Рендеринг элемента услуги
     */
    renderServiceItem(service) {
        const changeClass = service.changePercent > 0 ? 'up' : (service.changePercent < 0 ? 'down' : '');
        const changeText = service.changePercent !== 0 
            ? `${service.changePercent > 0 ? '+' : ''}${service.changePercent.toFixed(1)}%`
            : '—';
        
        return `
            <div class="service-item">
                <div class="service-info">
                    <div class="service-name">${Utils.escapeHtml(service.serviceName)}</div>
                    <div class="service-details">
                        ${service.consumption > 0 ? `${Utils.formatNumber(service.consumption, 2)} ${service.unit}` : 'Фиксированная сумма'}
                    </div>
                </div>
                <div class="service-cost">
                    <div class="service-amount">${Utils.formatCurrency(service.cost)}</div>
                    <div class="service-change ${changeClass}">${changeText}</div>
                </div>
            </div>
        `;
    },

    /**
     * Инициализация графика расходов
     */
    initExpenseChart(months) {
        const expenses = AnalyticsService.getExpensesByMonth(months);
        
        ChartComponent.createExpenseChart('expenseChart', {
            labels: expenses.map(e => e.label),
            values: expenses.map(e => e.total)
        });
    }
};
