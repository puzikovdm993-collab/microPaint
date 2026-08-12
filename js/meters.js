/**
 * Meters Service Module
 * CRUD operations for utility meters and readings
 */

const MetersService = {
    /**
     * Get all meters
     */
    async getAll() {
        return await DB.getAll(DB.STORES.METERS);
    },

    /**
     * Get meter by ID
     */
    async getById(id) {
        return await DB.getById(DB.STORES.METERS, id);
    },

    /**
     * Get active meters
     */
    async getActive() {
        const all = await this.getAll();
        return all.filter(m => m.isActive);
    },

    /**
     * Create new meter
     */
    async create(data) {
        const meter = Models.createMeter(data);
        return await DB.add(DB.STORES.METERS, meter);
    },

    /**
     * Update meter
     */
    async update(id, data) {
        const existing = await this.getById(id);
        if (!existing) {
            throw new Error('Счетчик не найден');
        }

        const updated = Models.createMeter({ ...existing, ...data, id });
        updated.updatedAt = new Date().toISOString();

        return await DB.put(DB.STORES.METERS, updated);
    },

    /**
     * Delete meter
     */
    async delete(id) {
        // First delete all readings for this meter
        const readings = await ReadingsService.getByMeterId(id);
        for (const reading of readings) {
            await ReadingsService.delete(reading.id);
        }

        return await DB.delete(DB.STORES.METERS, id);
    },

    /**
     * Toggle meter active status
     */
    async toggleActive(id) {
        const meter = await this.getById(id);
        if (!meter) throw new Error('Счетчик не найден');

        meter.isActive = !meter.isActive;
        meter.updatedAt = new Date().toISOString();

        return await DB.put(DB.STORES.METERS, meter);
    },

    /**
     * Initialize default meters
     */
    async initDefaults() {
        const existing = await this.getAll();
        if (existing.length > 0) return;

        const defaults = Models.getDefaultMeters();
        await DB.bulkAdd(DB.STORES.METERS, defaults);
    },

    /**
     * Get meter with latest reading
     */
    async getMeterWithLatestReading(meterId) {
        const meter = await this.getById(meterId);
        if (!meter) return null;

        const readings = await ReadingsService.getByMeterId(meterId);
        if (readings.length === 0) {
            return { ...meter, latestReading: null };
        }

        const sorted = readings.sort((a, b) => 
            Utils.compareMonths(b.month, a.month)
        );

        return { ...meter, latestReading: sorted[0] };
    },

    /**
     * Bulk import meters
     */
    async import(meters) {
        if (!Array.isArray(meters)) {
            throw new Error('Данные должны быть массивом');
        }

        const validMeters = [];
        for (const data of meters) {
            try {
                const meter = Models.createMeter(data);
                validMeters.push(meter);
            } catch (e) {
                console.warn('Skipping invalid meter:', data, e);
            }
        }

        if (validMeters.length > 0) {
            await DB.bulkPut(DB.STORES.METERS, validMeters);
        }

        return validMeters.length;
    }
};

/**
 * Meter Readings Service
 */
const ReadingsService = {
    /**
     * Get all readings
     */
    async getAll() {
        return await DB.getAll(DB.STORES.METER_READINGS);
    },

    /**
     * Get reading by ID
     */
    async getById(id) {
        return await DB.getById(DB.STORES.METER_READINGS, id);
    },

    /**
     * Get readings by meter ID
     */
    async getByMeterId(meterId) {
        return await DB.getByIndex(DB.STORES.METER_READINGS, 'meterId', meterId);
    },

    /**
     * Get readings by month
     */
    async getByMonth(month) {
        return await DB.getByIndex(DB.STORES.METER_READINGS, 'month', month);
    },

    /**
     * Get reading for specific meter and month
     */
    async getByMeterAndMonth(meterId, month) {
        return await DB.getByCompositeKey(DB.STORES.METER_READINGS, [meterId, month]);
    },

    /**
     * Create new reading
     */
    async create(data) {
        const reading = Models.createMeterReading(data);
        const errors = Models.validateMeterReading(reading);

        if (errors.length > 0) {
            throw new Error(errors.join('; '));
        }

        // Check if reading already exists for this meter/month
        const existing = await this.getByMeterAndMonth(reading.meterId, reading.month);
        if (existing) {
            // Update existing instead
            reading.id = existing.id;
            return await DB.put(DB.STORES.METER_READINGS, reading);
        }

        return await DB.add(DB.STORES.METER_READINGS, reading);
    },

    /**
     * Update reading
     */
    async update(id, data) {
        const existing = await this.getById(id);
        if (!existing) {
            throw new Error('Показание не найдено');
        }

        const updated = Models.createMeterReading({ ...existing, ...data, id });
        const errors = Models.validateMeterReading(updated);

        if (errors.length > 0) {
            throw new Error(errors.join('; '));
        }

        return await DB.put(DB.STORES.METER_READINGS, updated);
    },

    /**
     * Delete reading
     */
    async delete(id) {
        return await DB.delete(DB.STORES.METER_READINGS, id);
    },

    /**
     * Get consumption for meter between two months
     */
    async getConsumption(meterId, fromMonth, toMonth) {
        const fromReading = await this.getByMeterAndMonth(meterId, fromMonth);
        const toReading = await this.getByMeterAndMonth(meterId, toMonth);

        if (!fromReading || !toReading) {
            return null;
        }

        const result = Calculations.calculateConsumption(toReading.value, fromReading.value);
        return {
            fromValue: fromReading.value,
            toValue: toReading.value,
            consumption: result.consumption,
            isValid: result.isValid,
            warning: result.warning
        };
    },

    /**
     * Get all readings with consumption calculated
     */
    async getReadingsWithConsumption(meterId) {
        const readings = await this.getByMeterId(meterId);
        if (readings.length === 0) return [];

        // Sort by month
        const sorted = readings.sort((a, b) => 
            Utils.compareMonths(a.month, b.month)
        );

        const result = [];
        let previousValue = null;

        for (const reading of sorted) {
            let consumption = null;
            let isValid = true;
            let warning = null;

            if (previousValue !== null) {
                const calc = Calculations.calculateConsumption(reading.value, previousValue);
                consumption = calc.consumption;
                isValid = calc.isValid;
                warning = calc.warning;
            }

            result.push({
                ...reading,
                consumption,
                isValid,
                warning
            });

            previousValue = reading.value;
        }

        return result;
    },

    /**
     * Get readings for all meters for a specific month
     */
    async getAllForMonth(month) {
        const meters = await MetersService.getActive();
        const result = {};

        for (const meter of meters) {
            const reading = await this.getByMeterAndMonth(meter.id, month);
            result[meter.id] = reading || null;
        }

        return result;
    },

    /**
     * Bulk import readings
     */
    async import(readings) {
        if (!Array.isArray(readings)) {
            throw new Error('Данные должны быть массивом');
        }

        const validReadings = [];
        for (const data of readings) {
            try {
                const reading = Models.createMeterReading(data);
                const errors = Models.validateMeterReading(reading);
                if (errors.length === 0) {
                    validReadings.push(reading);
                }
            } catch (e) {
                console.warn('Skipping invalid reading:', data, e);
            }
        }

        if (validReadings.length > 0) {
            await DB.bulkPut(DB.STORES.METER_READINGS, validReadings);
        }

        return validReadings.length;
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MetersService, ReadingsService };
}
