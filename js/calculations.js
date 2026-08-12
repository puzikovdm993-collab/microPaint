/**
 * Calculations Module
 * All mathematical operations and formulas for utility calculations
 */

const Calculations = {
    /**
     * Calculate consumption from meter readings
     * @param {number} current - Current reading
     * @param {number} previous - Previous reading
     * @returns {object} Result with consumption and validation info
     */
    calculateConsumption(current, previous) {
        const result = {
            consumption: 0,
            isValid: true,
            warning: null
        };

        if (current === null || current === undefined || 
            previous === null || previous === undefined) {
            result.isValid = false;
            result.warning = 'Отсутствуют показания';
            return result;
        }

        const consumption = current - previous;

        if (consumption < 0) {
            result.consumption = 0;
            result.isValid = false;
            result.warning = 'Показание меньше предыдущего. Возможна замена счетчика или ошибка ввода.';
        } else {
            result.consumption = consumption;
        }

        return result;
    },

    /**
     * Calculate amount from volume and tariff
     * @param {number} volume - Volume/consumption
     * @param {number} tariff - Tariff rate
     * @param {number} precision - Decimal precision for rounding
     * @returns {number} Calculated amount
     */
    calculateAmount(volume, tariff, precision = 2) {
        if (volume === null || volume === undefined || 
            tariff === null || tariff === undefined) {
            return 0;
        }
        return Utils.roundTo(volume * tariff, precision);
    },

    /**
     * Calculate difference between calculated and actual amounts
     * @param {number} actual - Actual amount from receipt
     * @param {number} calculated - Calculated amount
     * @returns {object} Difference info
     */
    calculateDifference(actual, calculated) {
        const diff = (actual || 0) - (calculated || 0);
        return {
            absolute: Math.abs(diff),
            relative: diff,
            percent: calculated !== 0 ? (diff / calculated) * 100 : 0
        };
    },

    /**
     * Get tariff for specific month
     * @param {array} tariffs - Array of tariff objects
     * @param {string} month - Month in YYYY-MM format
     * @returns {object|null} Matching tariff or null
     */
    getTariffForMonth(tariffs, month) {
        if (!tariffs || tariffs.length === 0) return null;

        // Sort tariffs by validFrom descending
        const sorted = [...tariffs].sort((a, b) => 
            Utils.compareMonths(b.validFrom, a.validFrom)
        );

        for (const tariff of sorted) {
            const fromValid = Utils.compareMonths(month, tariff.validFrom) >= 0;
            const toValid = !tariff.validTo || Utils.compareMonths(month, tariff.validTo) <= 0;
            
            if (fromValid && toValid) {
                return tariff;
            }
        }

        // If no exact match, return the latest tariff
        return sorted[0] || null;
    },

    /**
     * Calculate water consumption (ХВ + ГВ = ВО)
     * @param {number} hv - Cold water consumption
     * @param {number} gv - Hot water consumption
     * @returns {number} Total water discharge
     */
    calculateWaterDischarge(hv, gv) {
        return (hv || 0) + (gv || 0);
    },

    /**
     * Detect anomalies in consumption data
     * @param {array} readings - Array of monthly readings with consumption
     * @param {number} threshold - Percentage threshold for anomaly detection (default 50%)
     * @returns {array} Array of detected anomalies
     */
    detectAnomalies(readings, threshold = 50) {
        const anomalies = [];

        if (!readings || readings.length < 2) return anomalies;

        // Sort by month
        const sorted = [...readings].sort((a, b) => 
            Utils.compareMonths(a.month, b.month)
        );

        for (let i = 1; i < sorted.length; i++) {
            const current = sorted[i];
            const previous = sorted[i - 1];

            // Skip if either value is missing
            if (!current.consumption || !previous.consumption) continue;

            const change = Utils.calculatePercentChange(current.consumption, previous.consumption);

            // Check for significant increase
            if (change > threshold) {
                anomalies.push({
                    type: 'consumption_increase',
                    month: current.month,
                    service: current.serviceName,
                    previous: previous.consumption,
                    current: current.consumption,
                    change: change,
                    message: `Расход ${current.serviceName || ''} вырос на ${Utils.formatPercent(change)}`
                });
            }

            // Check for significant decrease
            if (change < -threshold && previous.consumption > 0) {
                anomalies.push({
                    type: 'consumption_decrease',
                    month: current.month,
                    service: current.serviceName,
                    previous: previous.consumption,
                    current: current.consumption,
                    change: change,
                    message: `Расход ${current.serviceName || ''} снизился на ${Utils.formatPercent(Math.abs(change))}`
                });
            }

            // Check for negative consumption
            if (current.consumption < 0) {
                anomalies.push({
                    type: 'negative_consumption',
                    month: current.month,
                    service: current.serviceName,
                    value: current.consumption,
                    message: `Отрицательный расход ${current.serviceName || ''}: ${current.consumption}`
                });
            }
        }

        return anomalies;
    },

    /**
     * Detect tariff changes
     * @param {array} tariffs - Array of tariffs for a service
     * @param {string} serviceName - Name of the service
     * @returns {array} Array of tariff change notifications
     */
    detectTariffChanges(tariffs, serviceName = '') {
        const changes = [];

        if (!tariffs || tariffs.length < 2) return changes;

        const sorted = [...tariffs].sort((a, b) => 
            Utils.compareMonths(a.validFrom, b.validFrom)
        );

        for (let i = 1; i < sorted.length; i++) {
            const current = sorted[i];
            const previous = sorted[i - 1];
            const change = ((current.value - previous.value) / previous.value) * 100;

            changes.push({
                type: 'tariff_change',
                serviceId: current.serviceId,
                serviceName: serviceName,
                fromMonth: previous.validTo || previous.validFrom,
                toMonth: current.validFrom,
                oldTariff: previous.value,
                newTariff: current.value,
                change: change,
                message: `Тариф ${serviceName} изменился: ${previous.value} → ${current.value} (${Utils.formatPercent(change)})`
            });
        }

        return changes;
    },

    /**
     * Compare calculated vs actual amounts across months
     * @param {array} accruals - Array of accrual objects
     * @param {number} threshold - Significant difference threshold in rubles
     * @returns {array} Array of significant differences
     */
    compareCalculatedVsActual(accruals, threshold = 1) {
        const differences = [];

        if (!accruals) return differences;

        for (const accrual of accruals) {
            if (accrual.calculatedAmount === null || accrual.calculatedAmount === undefined) {
                continue;
            }

            const diff = this.calculateDifference(accrual.amount, accrual.calculatedAmount);

            if (diff.absolute > threshold) {
                differences.push({
                    serviceId: accrual.serviceId,
                    month: accrual.month,
                    calculated: accrual.calculatedAmount,
                    actual: accrual.amount,
                    difference: diff.relative,
                    percent: diff.percent,
                    message: `Разница в начислении: расчет ${diff.calculated}₽, факт ${diff.actual}₽`
                });
            }
        }

        return differences;
    },

    /**
     * Calculate total by category for a month
     * @param {array} accruals - Array of accruals for the month
     * @param {array} services - Array of services for category lookup
     * @returns {object} Totals by category
     */
    calculateTotalsByCategory(accruals, services) {
        const totals = {
            water: 0,
            electricity: 0,
            heating: 0,
            maintenance: 0,
            waste: 0,
            phone: 0,
            other: 0,
            total: 0
        };

        const serviceMap = {};
        services.forEach(s => serviceMap[s.id] = s);

        for (const accrual of accruals) {
            const service = serviceMap[accrual.serviceId];
            const category = service ? service.category : 'other';
            
            if (totals.hasOwnProperty(category)) {
                totals[category] += accrual.amount || 0;
            }
            totals.total += accrual.amount || 0;
        }

        // Round all values
        for (const key in totals) {
            totals[key] = Utils.roundTo(totals[key], 2);
        }

        return totals;
    },

    /**
     * Calculate percentage breakdown by category
     * @param {object} totals - Totals by category
     * @returns {object} Percentages by category
     */
    calculateCategoryPercentages(totals) {
        const percentages = {};
        const total = totals.total || 1; // Avoid division by zero

        for (const [key, value] of Object.entries(totals)) {
            if (key !== 'total') {
                percentages[key] = Utils.roundTo((value / total) * 100, 1);
            }
        }

        return percentages;
    },

    /**
     * Predict next month consumption using simple average
     * @param {array} consumptions - Array of historical consumptions
     * @param {number} monthsToAverage - Number of months to average
     * @returns {number} Predicted consumption
     */
    predictConsumption(consumptions, monthsToAverage = 3) {
        if (!consumptions || consumptions.length === 0) return 0;

        const recent = consumptions.slice(-monthsToAverage);
        const sum = recent.reduce((a, b) => a + (b || 0), 0);
        return Utils.roundTo(sum / recent.length, 3);
    },

    /**
     * Validate meter reading against previous
     * @param {number} currentValue - New reading value
     * @param {number} previousValue - Previous reading value
     * @param {object} options - Validation options
     * @returns {object} Validation result
     */
    validateReading(currentValue, previousValue, options = {}) {
        const {
            allowDecrease = false,
            maxIncrease = null,
            minIncrease = null
        } = options;

        const result = {
            isValid: true,
            errors: [],
            warnings: []
        };

        if (currentValue < 0) {
            result.isValid = false;
            result.errors.push('Значение не может быть отрицательным');
        }

        if (previousValue !== null && previousValue !== undefined) {
            const diff = currentValue - previousValue;

            if (diff < 0 && !allowDecrease) {
                result.isValid = false;
                result.errors.push('Показание меньше предыдущего');
            }

            if (maxIncrease !== null && diff > maxIncrease) {
                result.warnings.push(`Превышен максимальный рост: ${diff} > ${maxIncrease}`);
            }

            if (minIncrease !== null && diff < minIncrease && diff >= 0) {
                result.warnings.push(`Ниже минимального роста: ${diff} < ${minIncrease}`);
            }
        }

        return result;
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Calculations;
}
