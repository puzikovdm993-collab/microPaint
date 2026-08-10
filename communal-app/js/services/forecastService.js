/**
 * Сервис прогнозирования расходов
 */

const ForecastService = {
    /**
     * Прогноз для конкретной услуги
     */
    forecastService(serviceId, months = null) {
        const settings = AppState.data.settings;
        const forecastMonths = months || settings.forecastMonths;
        
        const service = AppState.getServiceById(serviceId);
        if (!service) return null;

        // Для услуг со счетчиками используем среднее потребление
        if (service.calcType === 'meter') {
            const meter = AppState.data.meters.find(m => m.serviceId === serviceId);
            if (!meter) return null;

            const consumption = AnalyticsService.getMeterConsumption(meter.id, forecastMonths);
            const values = consumption.filter(c => c.consumption > 0).map(c => c.consumption);
            
            if (values.length === 0) return null;

            const avgConsumption = Utils.round2(values.reduce((a, b) => a + b, 0) / values.length);
            const tariff = AppState.getCurrentTariff(serviceId);
            
            if (!tariff) return null;

            const forecastCost = Utils.round2(avgConsumption * tariff.rate);

            return {
                serviceName: service.name,
                avgConsumption,
                unit: service.unit,
                tariff: tariff.rate,
                forecastCost,
                type: 'meter'
            };
        }

        // Для фиксированных услуг
        if (service.calcType === 'fixed') {
            const tariff = AppState.getCurrentTariff(serviceId);
            if (!tariff) return null;

            return {
                serviceName: service.name,
                avgConsumption: 1,
                unit: service.unit,
                tariff: tariff.rate,
                forecastCost: tariff.rate,
                type: 'fixed'
            };
        }

        // Для расчета по площади
        if (service.calcType === 'area') {
            const tariff = AppState.getCurrentTariff(serviceId);
            if (!tariff) return null;

            const cost = Utils.round2(tariff.rate * settings.area / 1000);
            return {
                serviceName: service.name,
                avgConsumption: settings.area / 1000,
                unit: service.unit,
                tariff: tariff.rate,
                forecastCost: cost,
                type: 'area'
            };
        }

        // Для расчета по проживающим
        if (service.calcType === 'residents') {
            const tariff = AppState.getCurrentTariff(serviceId);
            if (!tariff) return null;

            const cost = Utils.round2(tariff.rate * settings.residents);
            return {
                serviceName: service.name,
                avgConsumption: settings.residents,
                unit: service.unit,
                tariff: tariff.rate,
                forecastCost: cost,
                type: 'residents'
            };
        }

        // Для водоотведения
        if (service.calcType === 'volume') {
            const coldMeter = AppState.data.meters.find(m => m.type === 'cold');
            const hotMeter = AppState.data.meters.find(m => m.type === 'hot');
            
            let totalConsumption = 0;
            [coldMeter, hotMeter].forEach(meter => {
                if (meter) {
                    const consumption = AnalyticsService.getMeterConsumption(meter.id, forecastMonths);
                    const values = consumption.filter(c => c.consumption > 0).map(c => c.consumption);
                    if (values.length > 0) {
                        totalConsumption += values.reduce((a, b) => a + b, 0) / values.length;
                    }
                }
            });

            const tariff = AppState.getCurrentTariff(serviceId);
            if (!tariff) return null;

            const forecastCost = Utils.round2(totalConsumption * tariff.rate);

            return {
                serviceName: service.name,
                avgConsumption: Utils.round2(totalConsumption),
                unit: service.unit,
                tariff: tariff.rate,
                forecastCost,
                type: 'volume'
            };
        }

        return null;
    },

    /**
     * Общий прогноз на следующий месяц
     */
    forecastTotal(months = null) {
        const services = AppState.data.services.filter(s => s.active);
        let totalForecast = 0;
        const forecasts = [];

        services.forEach(service => {
            const forecast = this.forecastService(service.id, months);
            if (forecast) {
                forecasts.push(forecast);
                totalForecast += forecast.forecastCost;
            }
        });

        return {
            total: Utils.round2(totalForecast),
            forecasts
        };
    },

    /**
     * Прогноз с учетом сезонности (упрощенная версия)
     */
    forecastWithSeasonality(serviceId) {
        const now = new Date();
        const currentMonth = now.getMonth();
        
        // Получаем данные за прошлый год по месяцам
        const history = [];
        for (let i = 12; i >= 1; i--) {
            const date = Utils.subtractMonths(now, i);
            const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const expenses = AppState.calculateMonthlyExpenses(monthStr);
            const expense = expenses.find(e => e.serviceId === serviceId);
            
            if (expense) {
                history.push({
                    month: date.getMonth(),
                    cost: expense.cost
                });
            }
        }

        // Группируем по месяцам года
        const byMonth = {};
        history.forEach(h => {
            if (!byMonth[h.month]) {
                byMonth[h.month] = [];
            }
            byMonth[h.month].push(h.cost);
        });

        // Рассчитываем средний коэффициент для текущего месяца
        const allAvg = history.reduce((sum, h) => sum + h.cost, 0) / history.length;
        const monthAvg = byMonth[currentMonth] 
            ? byMonth[currentMonth].reduce((sum, c) => sum + c, 0) / byMonth[currentMonth].length 
            : allAvg;

        const seasonalityFactor = monthAvg / allAvg;

        // Базовый прогноз
        const baseForecast = this.forecastService(serviceId);
        if (!baseForecast) return null;

        // Применяем сезонный коэффициент
        const adjustedForecast = Utils.round2(baseForecast.forecastCost * seasonalityFactor);

        return {
            ...baseForecast,
            seasonalityFactor: Utils.round2(seasonalityFactor),
            adjustedForecast
        };
    }
};
