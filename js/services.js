/**
 * Services Module
 * CRUD operations for utility services
 */

const ServicesService = {
    /**
     * Get all services
     */
    async getAll() {
        return await DB.getAll(DB.STORES.SERVICES);
    },

    /**
     * Get service by ID
     */
    async getById(id) {
        return await DB.getById(DB.STORES.SERVICES, id);
    },

    /**
     * Get services by category
     */
    async getByCategory(category) {
        return await DB.getByIndex(DB.STORES.SERVICES, 'category', category);
    },

    /**
     * Get active services
     */
    async getActive() {
        const all = await this.getAll();
        return all.filter(s => s.isActive);
    },

    /**
     * Create new service
     */
    async create(data) {
        const service = Models.createService(data);
        const errors = Models.validateService(service);
        
        if (errors.length > 0) {
            throw new Error(errors.join('; '));
        }
        
        return await DB.add(DB.STORES.SERVICES, service);
    },

    /**
     * Update service
     */
    async update(id, data) {
        const existing = await this.getById(id);
        if (!existing) {
            throw new Error('Услуга не найдена');
        }

        const updated = Models.createService({ ...existing, ...data, id });
        updated.updatedAt = new Date().toISOString();
        
        const errors = Models.validateService(updated);
        if (errors.length > 0) {
            throw new Error(errors.join('; '));
        }

        return await DB.put(DB.STORES.SERVICES, updated);
    },

    /**
     * Delete service
     */
    async delete(id) {
        return await DB.delete(DB.STORES.SERVICES, id);
    },

    /**
     * Toggle service active status
     */
    async toggleActive(id) {
        const service = await this.getById(id);
        if (!service) throw new Error('Услуга не найдена');
        
        service.isActive = !service.isActive;
        service.updatedAt = new Date().toISOString();
        
        return await DB.put(DB.STORES.SERVICES, service);
    },

    /**
     * Initialize default services
     */
    async initDefaults() {
        const existing = await this.getAll();
        if (existing.length > 0) return;

        const defaults = Models.getDefaultServices();
        await DB.bulkAdd(DB.STORES.SERVICES, defaults);
    },

    /**
     * Get service with meter info
     */
    async getServiceWithMeter(serviceId) {
        const service = await this.getById(serviceId);
        if (!service || !service.meterId) return service;

        const meter = await MetersService.getById(service.meterId);
        return { ...service, meter };
    },

    /**
     * Get services that need tariff for month
     */
    async getServicesForMonth(month) {
        const active = await this.getActive();
        return active.filter(s => {
            // Filter out services that shouldn't be shown for certain months
            // e.g., heating might not be shown in summer months
            return true;
        });
    },

    /**
     * Bulk import services
     */
    async import(services) {
        if (!Array.isArray(services)) {
            throw new Error('Данные должны быть массивом');
        }

        const validServices = [];
        for (const data of services) {
            try {
                const service = Models.createService(data);
                const errors = Models.validateService(service);
                if (errors.length === 0) {
                    validServices.push(service);
                }
            } catch (e) {
                console.warn('Skipping invalid service:', data, e);
            }
        }

        if (validServices.length > 0) {
            await DB.bulkPut(DB.STORES.SERVICES, validServices);
        }

        return validServices.length;
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ServicesService;
}
