/**
 * Tariffs Service Module
 * CRUD operations for utility tariffs
 */

const TariffsService = {
    /**
     * Get all tariffs
     */
    async getAll() {
        return await DB.getAll(DB.STORES.TARIFFS);
    },

    /**
     * Get tariff by ID
     */
    async getById(id) {
        return await DB.getById(DB.STORES.TARIFFS, id);
    },

    /**
     * Get tariffs by service ID
     */
    async getByServiceId(serviceId) {
        return await DB.getByIndex(DB.STORES.TARIFFS, 'serviceId', serviceId);
    },

    /**
     * Get tariff for specific service and month
     */
    async getForServiceAndMonth(serviceId, month) {
        const tariffs = await this.getByServiceId(serviceId);
        return Calculations.getTariffForMonth(tariffs, month);
    },

    /**
     * Create new tariff
     */
    async create(data) {
        const tariff = Models.createTariff(data);
        return await DB.add(DB.STORES.TARIFFS, tariff);
    },

    /**
     * Update tariff
     */
    async update(id, data) {
        const existing = await this.getById(id);
        if (!existing) {
            throw new Error('Тариф не найден');
        }

        const updated = Models.createTariff({ ...existing, ...data, id });
        updated.updatedAt = new Date().toISOString();

        return await DB.put(DB.STORES.TARIFFS, updated);
    },

    /**
     * Delete tariff
     */
    async delete(id) {
        return await DB.delete(DB.STORES.TARIFFS, id);
    },

    /**
     * Bulk import tariffs
     */
    async import(tariffs) {
        if (!Array.isArray(tariffs)) {
            throw new Error('Данные должны быть массивом');
        }

        const validTariffs = [];
        for (const data of tariffs) {
            try {
                const tariff = Models.createTariff(data);
                validTariffs.push(tariff);
            } catch (e) {
                console.warn('Skipping invalid tariff:', data, e);
            }
        }

        if (validTariffs.length > 0) {
            await DB.bulkPut(DB.STORES.TARIFFS, validTariffs);
        }

        return validTariffs.length;
    },

    /**
     * Get all tariffs grouped by service
     */
    async getGroupedByService() {
        const all = await this.getAll();
        const grouped = {};

        for (const tariff of all) {
            if (!grouped[tariff.serviceId]) {
                grouped[tariff.serviceId] = [];
            }
            grouped[tariff.serviceId].push(tariff);
        }

        // Sort each group by validFrom
        for (const serviceId in grouped) {
            grouped[serviceId].sort((a, b) => 
                Utils.compareMonths(a.validFrom, b.validFrom)
            );
        }

        return grouped;
    },

    /**
     * Detect tariff changes for a service
     */
    async getTariffChanges(serviceId, serviceName = '') {
        const tariffs = await this.getByServiceId(serviceId);
        return Calculations.detectTariffChanges(tariffs, serviceName);
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TariffsService;
}
