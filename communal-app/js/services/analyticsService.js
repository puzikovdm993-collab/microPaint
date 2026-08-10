/**
 * Сервис аналитики
 */

const AnalyticsService = {
    /**
     * Получение расходов по месяцам
     */
    getExpensesByMonth(months = 12) {
        const monthList = Utils.getLastNMonths(months);
        const expenses = [];

        monthList.forEach(monthStr => {
            const total = AppState.getTotalCharges(monthStr);
            const monthDate = new Date(`${monthStr}-01`);
            const label = Utils.getMonthName(monthDate.getMonth());

            expenses.push({
                month: monthStr,
                label,
                total
            });
        });

        return expenses;
    },

    /**
     * Получение расходов по услугам за месяц
     */
    getExpensesByService(monthStr) {
        const expenses = AppState.calculateMonthlyExpenses(monthStr);
        return expenses;
    },

    /**
     * Расчет среднего расхода
     */
    getAverageExpense(months = 6) {
        const expenses = this.getExpensesByMonth(months);
        if (expenses.length === 0) return 0;

        const total = expenses.reduce((sum, e) => sum + e.total, 0);
        return Utils.round2(total / expenses.length);
    },

    /**
     * Получение минимального и максимального расхода
     */
    getMinMaxExpense(months = 12) {
        const expenses = this.getExpensesByMonth(months);
        if (expenses.length === 0) return { min: 0, max: 0 };

        const values = expenses.map(e => e.total);
        return {
            min: Math.min(...values),
            max: Math.max(...values)
        };
    },

    /**
     * Изменение относительно предыдущего периода
     */
    getMonthOverMonthChange() {
        const expenses = this.getExpensesByMonth(2);
        if (expenses.length < 2) return { change: 0, percent: 0 };

        const current = expenses[expenses.length - 1].total;
        const previous = expenses[expenses.length - 2].total;

        const change = Utils.round2(current - previous);
        const percent = Utils.calculatePercentChange(current, previous);

        return { change, percent };
    },

    /**
     * Изменение относительно прошлого года
     */
    getYearOverYearChange(monthIndex = null) {
        const now = new Date();
        const currentMonth = monthIndex !== null ? monthIndex : now.getMonth();
        
        const currentYearStr = `${now.getFullYear()}-${String(currentMonth + 1).padStart(2, '0')}`;
        const lastYearStr = `${now.getFullYear() - 1}-${String(currentMonth + 1).padStart(2, '0')}`;

        const current = AppState.getTotalCharges(currentYearStr);
        const lastYear = AppState.getTotalCharges(lastYearStr);

        if (!lastYear || lastYear === 0) return { change: 0, percent: 0 };

        const change = Utils.round2(current - lastYear);
        const percent = Utils.calculatePercentChange(current, lastYear);

        return { change, percent };
    },

    /**
     * Потребление по счетчикам
     */
    getMeterConsumption(meterId, months = 6) {
        const meter = MeterService.getMeterById(meterId);
        if (!meter) return [];

        const consumption = [];
        const monthList = Utils.getLastNMonths(months);

        monthList.forEach(monthStr => {
            const data = MeterService.calculateConsumption(meterId, monthStr);
            const monthDate = new Date(`${monthStr}-01`);
            
            consumption.push({
                month: monthStr,
                label: Utils.getMonthName(monthDate.getMonth()),
                consumption: data ? data.consumption : 0,
                cost: data ? data.cost : 0,
                unit: meter.unit
            });
        });

        return consumption;
    },

    /**
     * Статистика потребления по счетчику
     */
    getMeterStats(meterId, months = 6) {
        const consumption = this.getMeterConsumption(meterId, months);
        const values = consumption.filter(c => c.consumption > 0).map(c => c.consumption);

        if (values.length === 0) {
            return { avg: 0, min: 0, max: 0 };
        }

        const sum = values.reduce((a, b) => a + b, 0);
        return {
            avg: Utils.round2(sum / values.length),
            min: Math.min(...values),
            max: Math.max(...values)
        };
    },

    /**
     * Обнаружение аномалий
     */
    detectAnomalies(threshold = null) {
        const anomalies = [];
        const settings = AppState.data.settings;
        const anomalyThreshold = threshold || settings.anomalyThreshold;

        // Проверяем счетчики с типом расчета по счетчику
        const meters = AppState.data.meters.filter(m => {
            const service = AppState.getServiceById(m.serviceId);
            return service && service.calcType === 'meter';
        });

        const currentMonth = Utils.getCurrentMonth();

        meters.forEach(meter => {
            const stats = this.getMeterStats(meter.id, 6);
            const currentData = this.getMeterConsumption(meter.id, 1)[0];

            if (currentData && currentData.consumption > 0 && stats.avg > 0) {
                const percentAbove = ((currentData.consumption - stats.avg) / stats.avg) * 100;

                if (percentAbove > anomalyThreshold) {
                    const service = AppState.getServiceById(meter.serviceId);
                    anomalies.push({
                        meterId: meter.id,
                        serviceName: service ? service.name : meter.name,
                        consumption: currentData.consumption,
                        average: stats.avg,
                        percentAbove: Utils.round2(percentAbove),
                        unit: meter.unit
                    });
                }
            }
        });

        return anomalies;
    },

    /**
     * Данные для графика расходов по категориям
     */
    getCategoryData(months = 6) {
        const monthList = Utils.getLastNMonths(months);
        const categories = {};

        monthList.forEach(monthStr => {
            const expenses = this.getExpensesByService(monthStr);
            expenses.forEach(exp => {
                if (!categories[exp.serviceName]) {
                    categories[exp.serviceName] = [];
                }
                
                const monthDate = new Date(`${monthStr}-01`);
                const label = Utils.getMonthName(monthDate.getMonth());
                
                categories[exp.serviceName].push({
                    month: monthStr,
                    label,
                    value: exp.cost
                });
            });
        });

        return categories;
    }
};
