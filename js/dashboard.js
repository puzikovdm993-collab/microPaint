/**
 * Dashboard Module
 * Main dashboard view rendering and updates
 */

const Dashboard = {
    currentMonth: null,

    /**
     * Initialize dashboard
     */
    async init(month) {
        this.currentMonth = month;
        await this.render();
    },

    /**
     * Update dashboard for new month
     */
    async update(month) {
        this.currentMonth = month;
        await this.render();
    },

    /**
     * Render complete dashboard
     */
    async render() {
        await Promise.all([
            this.renderSummary(),
            this.renderCharts(),
            this.renderAlerts()
        ]);
    },

    /**
     * Render summary cards
     */
    async renderSummary() {
        const [accruals, services] = await Promise.all([
            AccrualsService.getByMonth(this.currentMonth),
            ServicesService.getAll()
        ]);

        const totals = Calculations.calculateTotalsByCategory(accruals, services);
        const percentages = Calculations.calculateCategoryPercentages(totals);

        // Get previous month data for comparison
        const prevMonth = Utils.addMonths(this.currentMonth, -1);
        const prevAccruals = await AccrualsService.getByMonth(prevMonth);
        const prevTotals = Calculations.calculateTotalsByCategory(prevAccruals, services);

        // Update total card
        document.getElementById('dashTotalAmount').textContent = Utils.formatCurrency(totals.total);
        const totalChange = Utils.calculatePercentChange(totals.total, prevTotals.total);
        const totalChangeEl = document.getElementById('dashTotalChange');
        totalChangeEl.textContent = Utils.formatPercent(totalChange);
        totalChangeEl.className = `summary-change ${totalChange > 0 ? 'positive' : totalChange < 0 ? 'negative' : 'neutral'}`;

        // Water category (water + waste water related)
        const waterTotal = totals.water + (totals.waste || 0);
        const prevWaterTotal = prevTotals.water + (prevTotals.waste || 0);
        document.getElementById('dashWaterAmount').textContent = Utils.formatCurrency(waterTotal);
        const waterChange = Utils.calculatePercentChange(waterTotal, prevWaterTotal);
        const waterChangeEl = document.getElementById('dashWaterChange');
        waterChangeEl.textContent = Utils.formatPercent(waterChange);
        waterChangeEl.className = `summary-change ${waterChange > 0 ? 'positive' : waterChange < 0 ? 'negative' : 'neutral'}`;

        // Electricity
        document.getElementById('dashElectricityAmount').textContent = Utils.formatCurrency(totals.electricity);
        const elecChange = Utils.calculatePercentChange(totals.electricity, prevTotals.electricity);
        const elecChangeEl = document.getElementById('dashElectricityChange');
        elecChangeEl.textContent = Utils.formatPercent(elecChange);
        elecChangeEl.className = `summary-change ${elecChange > 0 ? 'positive' : elecChange < 0 ? 'negative' : 'neutral'}`;

        // Heating
        document.getElementById('dashHeatingAmount').textContent = Utils.formatCurrency(totals.heating);
        const heatChange = Utils.calculatePercentChange(totals.heating, prevTotals.heating);
        const heatChangeEl = document.getElementById('dashHeatingChange');
        heatChangeEl.textContent = Utils.formatPercent(heatChange);
        heatChangeEl.className = `summary-change ${heatChange > 0 ? 'positive' : heatChange < 0 ? 'negative' : 'neutral'}`;

        // Maintenance
        document.getElementById('dashMaintenanceAmount').textContent = Utils.formatCurrency(totals.maintenance);
        const maintChange = Utils.calculatePercentChange(totals.maintenance, prevTotals.maintenance);
        const maintChangeEl = document.getElementById('dashMaintenanceChange');
        maintChangeEl.textContent = Utils.formatPercent(maintChange);
        maintChangeEl.className = `summary-change ${maintChange > 0 ? 'positive' : maintChange < 0 ? 'negative' : 'neutral'}`;

        // Waste (TKO)
        document.getElementById('dashWasteAmount').textContent = Utils.formatCurrency(totals.waste);
        const wasteChange = Utils.calculatePercentChange(totals.waste, prevTotals.waste);
        const wasteChangeEl = document.getElementById('dashWasteChange');
        wasteChangeEl.textContent = Utils.formatPercent(wasteChange);
        wasteChangeEl.className = `summary-change ${wasteChange > 0 ? 'positive' : wasteChange < 0 ? 'negative' : 'neutral'}`;

        // Phone
        document.getElementById('dashPhoneAmount').textContent = Utils.formatCurrency(totals.phone);
        const phoneChange = Utils.calculatePercentChange(totals.phone, prevTotals.phone);
        const phoneChangeEl = document.getElementById('dashPhoneChange');
        phoneChangeEl.textContent = Utils.formatPercent(phoneChange);
        phoneChangeEl.className = `summary-change ${phoneChange > 0 ? 'positive' : phoneChange < 0 ? 'negative' : 'neutral'}`;

        // Update header total display
        const totalDisplay = document.getElementById('totalDisplay');
        if (totalDisplay) {
            totalDisplay.innerHTML = `Всего: <span>${Utils.formatCurrency(totals.total)}</span>`;
        }
    },

    /**
     * Render charts
     */
    async renderCharts() {
        // Structure chart (pie)
        const categoryData = await AnalyticsService.getCategoryData(this.currentMonth);
        AnalyticsService.renderPieChart('structureChart', categoryData);

        // Trend chart (line) - last 6 months
        const trendData = await AnalyticsService.getAmountTrendData(6);
        AnalyticsService.renderLineChart('trendChart', trendData);
    },

    /**
     * Render alerts section
     */
    async renderAlerts() {
        const anomalies = await AnalyticsService.getAnomalies();
        
        // Filter anomalies for current/recent months
        const recentAnomalies = anomalies.filter(a => {
            if (!a.month) return true;
            const monthDiff = Utils.compareMonths(this.currentMonth, a.month);
            return monthDiff >= 0 && monthDiff <= 3; // Last 3 months
        }).slice(0, 5); // Show max 5 alerts

        UI.renderAlerts(recentAnomalies, 'alertsList');
    },

    /**
     * Refresh dashboard
     */
    async refresh() {
        await this.render();
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Dashboard;
}
