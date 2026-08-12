/**
 * IndexedDB Database Module
 * Handles all database operations with proper error handling
 */

const DB = {
    DB_NAME: 'CommunalAppDB',
    DB_VERSION: 1,
    db: null,

    /**
     * Store names
     */
    STORES: {
        SERVICES: 'services',
        METERS: 'meters',
        METER_READINGS: 'meterReadings',
        TARIFFS: 'tariffs',
        ACCRUALS: 'accruals',
        MONTHS: 'months',
        SETTINGS: 'settings'
    },

    /**
     * Initialize database connection
     */
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

            request.onerror = () => {
                console.error('Database error:', request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                console.log('Database initialized successfully');
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                this.createStores(db);
            };
        });
    },

    /**
     * Create object stores and indexes
     */
    createStores(db) {
        // Services store
        if (!db.objectStoreNames.contains(this.STORES.SERVICES)) {
            const serviceStore = db.createObjectStore(this.STORES.SERVICES, { keyPath: 'id' });
            serviceStore.createIndex('category', 'category', { unique: false });
            serviceStore.createIndex('isActive', 'isActive', { unique: false });
            serviceStore.createIndex('meterId', 'meterId', { unique: false });
        }

        // Meters store
        if (!db.objectStoreNames.contains(this.STORES.METERS)) {
            const meterStore = db.createObjectStore(this.STORES.METERS, { keyPath: 'id' });
            meterStore.createIndex('type', 'type', { unique: false });
            meterStore.createIndex('isActive', 'isActive', { unique: false });
        }

        // Meter readings store
        if (!db.objectStoreNames.contains(this.STORES.METER_READINGS)) {
            const readingStore = db.createObjectStore(this.STORES.METER_READINGS, { keyPath: 'id' });
            readingStore.createIndex('meterId', 'meterId', { unique: false });
            readingStore.createIndex('month', 'month', { unique: false });
            readingStore.createIndex('meterId_month', ['meterId', 'month'], { unique: true });
        }

        // Tariffs store
        if (!db.objectStoreNames.contains(this.STORES.TARIFFS)) {
            const tariffStore = db.createObjectStore(this.STORES.TARIFFS, { keyPath: 'id' });
            tariffStore.createIndex('serviceId', 'serviceId', { unique: false });
            tariffStore.createIndex('validFrom', 'validFrom', { unique: false });
        }

        // Accruals store
        if (!db.objectStoreNames.contains(this.STORES.ACCRUALS)) {
            const accrualStore = db.createObjectStore(this.STORES.ACCRUALS, { keyPath: 'id' });
            accrualStore.createIndex('serviceId', 'serviceId', { unique: false });
            accrualStore.createIndex('month', 'month', { unique: false });
            accrualStore.createIndex('serviceId_month', ['serviceId', 'month'], { unique: false });
        }

        // Months store
        if (!db.objectStoreNames.contains(this.STORES.MONTHS)) {
            const monthStore = db.createObjectStore(this.STORES.MONTHS, { keyPath: 'id' });
            monthStore.createIndex('year', 'year', { unique: false });
            monthStore.createIndex('status', 'status', { unique: false });
        }

        // Settings store
        if (!db.objectStoreNames.contains(this.STORES.SETTINGS)) {
            db.createObjectStore(this.STORES.SETTINGS, { keyPath: 'key' });
        }
    },

    /**
     * Generic CRUD operations
     */
    async getAll(storeName) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    async getById(storeName, id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(id);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    async add(storeName, item) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.add(item);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    async put(storeName, item) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put(item);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    async delete(storeName, id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(id);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    },

    async clear(storeName) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.clear();

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    },

    /**
     * Query by index
     */
    async getByIndex(storeName, indexName, value) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const index = store.index(indexName);
            const request = index.getAll(value);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    /**
     * Get by composite index (meterId + month)
     */
    async getByCompositeKey(storeName, keys) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const index = store.index('meterId_month');
            const request = index.get(keys);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    /**
     * Bulk operations
     */
    async bulkAdd(storeName, items) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            
            const promises = items.map(item => {
                return new Promise((res, rej) => {
                    const req = store.add(item);
                    req.onsuccess = () => res(req.result);
                    req.onerror = () => rej(req.error);
                });
            });

            Promise.all(promises)
                .then(resolve)
                .catch(reject);
        });
    },

    async bulkPut(storeName, items) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            
            const promises = items.map(item => {
                return new Promise((res, rej) => {
                    const req = store.put(item);
                    req.onsuccess = () => res(req.result);
                    req.onerror = () => rej(req.error);
                });
            });

            Promise.all(promises)
                .then(resolve)
                .catch(reject);
        });
    },

    /**
     * Settings operations
     */
    async getSetting(key, defaultValue = null) {
        const setting = await this.getById(this.STORES.SETTINGS, key);
        return setting ? setting.value : defaultValue;
    },

    async setSetting(key, value) {
        return this.put(this.STORES.SETTINGS, { key, value, updatedAt: new Date().toISOString() });
    },

    /**
     * Export all data
     */
    async exportAll() {
        const exportData = {};
        for (const storeName of Object.values(this.STORES)) {
            try {
                exportData[storeName] = await this.getAll(storeName);
            } catch (e) {
                console.warn(`Could not export ${storeName}:`, e);
                exportData[storeName] = [];
            }
        }
        return exportData;
    },

    /**
     * Import all data
     */
    async importAll(data) {
        for (const [storeName, items] of Object.entries(data)) {
            if (Array.isArray(items) && items.length > 0) {
                await this.bulkPut(storeName, items);
            }
        }
    },

    /**
     * Clear all data
     */
    async clearAll() {
        for (const storeName of Object.values(this.STORES)) {
            await this.clear(storeName);
        }
    },

    /**
     * Check if database has data
     */
    async hasData() {
        for (const storeName of Object.values(this.STORES)) {
            const items = await this.getAll(storeName);
            if (items.length > 0) {
                return true;
            }
        }
        return false;
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DB;
}
