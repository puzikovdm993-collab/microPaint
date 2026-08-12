/**
 * Accruals Service Module
 * CRUD operations for utility accruals (начисления)
 */

const AccrualsService = {
    /**
     * Get all accruals
     */
    async getAll() {
        return await DB.getAll(DB.STORES.ACCRUALS);
    },

    /**
     * Get accrual by ID
     */
    async getById(id) {
        return await DB.getById(DB.STORES.ACCRUALS, id);
    },

    /**
     * Get accruals by service ID
     */
    async getByServiceId(serviceId) {
        return await DB.getByIndex(DB.STORES.ACCRUALS, 'serviceId', serviceId);
    },

    /**
     * Get accruals by month
     */
    async getByMonth(month) {
        return await DB.getByIndex(DB.STORES.ACCRUALS, 'month', month);
    },

    /**
     * Get accrual for specific service and month
     */
    async getByServiceAndMonth(serviceId, month) {
        const accruals = await this.getByServiceId(serviceId);
        return accruals.find(a => a.month === month) || null;
    },

    /**
     * Create new accrual
     */
    async create(data) {
        const accrual = Models.createAccrual(data);
        const errors = Models.validateAccrual(accrual);

        if (errors.length > 0) {
            throw new Error(errors.join('; '));
        }

        // Check if accrual already exists
        const existing = await this.getByServiceAndMonth(accrual.serviceId, accrual.month);
        if (existing) {
            accrual.id = existing.id;
            return await DB.put(DB.STORES.ACCRUALS, accrual);
        }

        return await DB.add(DB.STORES.ACCRUALS, accrual);
    },

    /**
     * Update accrual
     */
    async update(id, data) {
        const existing = await this.getById(id);
        if (!existing) {
            throw new Error('Начисление не найдено');
        }

        const updated = Models.createAccrual({ ...existing, ...data, id });
        updated.updatedAt = new Date().toISOString();

        const errors = Models.validateAccrual(updated);
        if (errors.length > 0) {
            throw new Error(errors.join('; '));
        }

        return await DB.put(DB.STORES.ACCRUALS, updated);
    },

    /**
     * Delete accrual
     */
    async delete(id) {
        return await DB.delete(DB.STORES.ACCRUALS, id);
    },

    /**
     * Delete accruals for a month
     */
    async deleteByMonth(month) {
        const accruals = await this.getByMonth(month);
        for (const accrual of accruals) {
            await this.delete(accrual.id);
        }
    },

    /**
     * Bulk import accruals
     */
    async import(accruals) {
        if (!Array.isArray(accruals)) {
            throw new Error('Данные должны быть массивом');
        }

        const validAccruals = [];
        for (const data of accruals) {
            try {
                const accrual = Models.createAccrual(data);
                validAccruals.push(accrual);
            } catch (e) {
                console.warn('Skipping invalid accrual:', data, e);
            }
        }

        if (validAccruals.length > 0) {
            await DB.bulkPut(DB.STORES.ACCRUALS, validAccruals);
        }

        return validAccruals.length;
    },

    /**
     * Calculate accrual from meter readings and tariff
     */
    async calculateFromMeter(serviceId, month) {
        const service = await ServicesService.getById(serviceId);
        if (!service || !service.meterId) {
            return null;
        }

        // Get current and previous readings
        const readings = await ReadingsService.getByMeterId(service.meterId);
        if (readings.length < 2) {
            return null;
        }

        // Sort by month descending
        const sorted = readings.sort((a, b) => 
            Utils.compareMonths(b.month, a.month)
        );

        // Find reading for the target month
        const currentReading = sorted.find(r => r.month === month);
        if (!currentReading) {
            return null;
        }

        // Find previous reading
        const currentIndex = sorted.findIndex(r => r.month === month);
        const previousReading = sorted[currentIndex + 1];
        if (!previousReading) {
            return null;
        }

        // Calculate consumption
        const consumption = Calculations.calculateConsumption(
            currentReading.value, 
            previousReading.value
        );

        if (!consumption.isValid) {
            return { error: consumption.warning };
        }

        // Get tariff for the month
        const tariffObj = await TariffsService.getForServiceAndMonth(serviceId, month);
        const tariff = tariffObj ? tariffObj.value : 0;

        // Calculate amount
        const calculatedAmount = Calculations.calculateAmount(consumption.consumption, tariff);

        return {
            serviceId,
            month,
            volume: consumption.consumption,
            tariff,
            calculatedAmount,
            source: Models.SOURCES.CALCULATED
        };
    },

    /**
     * Get all accruals for a month with service info
     */
    async getWithServicesForMonth(month) {
        const [accruals, services] = await Promise.all([
            this.getByMonth(month),
            ServicesService.getAll()
        ]);

        const serviceMap = {};
        services.forEach(s => serviceMap[s.id] = s);

        return accruals.map(a => ({
            ...a,
            service: serviceMap[a.serviceId] || null
        }));
    },

    /**
     * Get total amount for a month
     */
    async getTotalForMonth(month) {
        const accruals = await this.getByMonth(month);
        return Utils.sum(accruals, a => a.amount);
    },

    /**
     * Get totals by category for a month
     */
    async getTotalsByCategory(month) {
        const [accruals, services] = await Promise.all([
            this.getByMonth(month),
            ServicesService.getAll()
        ]);

        return Calculations.calculateTotalsByCategory(accruals, services);
    },

    /**
     * Copy accruals from one month to another
     */
    async copyMonth(fromMonth, toMonth) {
        const fromAccruals = await this.getByMonth(fromMonth);
        
        if (fromAccruals.length === 0) {
            throw new Error('Нет данных для копирования');
        }

        const copied = [];
        for (const accrual of fromAccruals) {
            const newAccrual = Models.createAccrual({
                serviceId: accrual.serviceId,
                month: toMonth,
                volume: accrual.volume,
                tariff: accrual.tariff,
                amount: accrual.amount,
                calculatedAmount: accrual.calculatedAmount,
                source: Models.SOURCES.MANUAL,
                comment: `Скопировано из ${Utils.formatMonth(fromMonth)}`
            });
            copied.push(newAccrual);
        }

        await DB.bulkPut(DB.STORES.ACCRUALS, copied);
        return copied.length;
    },

    /**
     * Detect discrepancies between calculated and actual amounts
     */
    async detectDiscrepancies(month = null) {
        let accruals = await this.getAll();
        
        if (month) {
            accruals = accruals.filter(a => a.month === month);
        }

        return Calculations.compareCalculatedVsActual(accruals);
    },

    /**
     * Get consumption history for a service
     */
    async getConsumptionHistory(serviceId) {
        const accruals = await this.getByServiceId(serviceId);
        const service = await ServicesService.getById(serviceId);

        return accruals
            .sort((a, b) => Utils.compareMonths(a.month, b.month))
            .map(a => ({
                month: a.month,
                consumption: a.volume,
                amount: a.amount,
                tariff: a.tariff,
                serviceName: service ? service.name : ''
            }));
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AccrualsService;
}
