/**
 * Сервис работы с localStorage
 */

const StorageService = {
    STORAGE_KEY: 'communal_app_data',

    /**
     * Сохранение данных в localStorage
     */
    save(data) {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
            return true;
        } catch (e) {
            console.error('Ошибка сохранения данных:', e);
            return false;
        }
    },

    /**
     * Загрузка данных из localStorage
     */
    load() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            if (data) {
                return JSON.parse(data);
            }
            return null;
        } catch (e) {
            console.error('Ошибка загрузки данных:', e);
            return null;
        }
    },

    /**
     * Очистка всех данных
     */
    clear() {
        try {
            localStorage.removeItem(this.STORAGE_KEY);
            // Удаляем флаг о том, что демо-данные были созданы
            localStorage.removeItem(this.STORAGE_KEY + '_initialized');
            // Устанавливаем флаг, что данные были очищены вручную
            localStorage.setItem(this.STORAGE_KEY + '_cleared', 'true');
            return true;
        } catch (e) {
            console.error('Ошибка очистки данных:', e);
            return false;
        }
    },

    /**
     * Экспорт данных в JSON строку
     */
    export() {
        const data = this.load();
        if (!data) {
            return null;
        }
        return JSON.stringify(data, null, 2);
    },

    /**
     * Импорт данных из JSON строки
     */
    import(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            // Валидация структуры
            if (!this.validateData(data)) {
                throw new Error('Неверная структура данных');
            }
            this.save(data);
            // При импорте данных снимаем флаг очистки
            localStorage.removeItem(this.STORAGE_KEY + '_cleared');
            return true;
        } catch (e) {
            console.error('Ошибка импорта данных:', e);
            return false;
        }
    },

    /**
     * Валидация структуры данных
     */
    validateData(data) {
        if (!data || typeof data !== 'object') {
            return false;
        }
        
        const requiredFields = ['settings', 'services', 'meters', 'readings', 'tariffs', 'payments'];
        for (const field of requiredFields) {
            if (!(field in data)) {
                return false;
            }
        }
        
        return true;
    },

    /**
     * Скачивание файла с данными
     */
    downloadBackup() {
        const json = this.export();
        if (!json) {
            return false;
        }

        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `communal_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        return true;
    },

    /**
     * Загрузка файла с данными
     */
    uploadBackup(file) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const result = this.import(e.target.result);
                resolve(result);
            };
            reader.onerror = () => resolve(false);
            reader.readAsText(file);
        });
    }
};
