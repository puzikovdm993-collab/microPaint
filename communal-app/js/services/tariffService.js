/**
 * Сервис работы с тарифами
 */

const TariffService = {
    /**
     * Получение всех тарифов для услуги
     */
    getServiceTariffs(serviceId) {
        return AppState.data.tariffs
            .filter(t => t.serviceId === serviceId)
            .sort((a, b) => b.validFrom.localeCompare(a.validFrom));
    },

    /**
     * Получение действующего тарифа на дату
     */
    getTariffAtDate(serviceId, date) {
        const checkDate = date || new Date().toISOString().split('T')[0];
        return AppState.data.tariffs
            .filter(t => t.serviceId === serviceId && t.validFrom <= checkDate)
            .sort((a, b) => b.validFrom.localeCompare(a.validFrom))[0] || null;
    },

    /**
     * Добавление нового тарифа
     */
    addTariff(serviceId, rate, validFrom) {
        const tariff = {
            id: Utils.generateId(),
            serviceId,
            rate: parseFloat(rate),
            validFrom
        };
        
        AppState.data.tariffs.push(tariff);
        AppState.save();
        return tariff;
    },

    /**
     * Удаление тарифа
     */
    deleteTariff(tariffId) {
        const index = AppState.data.tariffs.findIndex(t => t.id === tariffId);
        if (index !== -1) {
            AppState.data.tariffs.splice(index, 1);
            AppState.save();
            return true;
        }
        return false;
    },

    /**
     * Валидация тарифа
     */
    validateTariff(data) {
        const errors = {};
        
        if (!data.serviceId) {
            errors.serviceId = 'Выберите услугу';
        }
        
        if (!data.rate || data.rate <= 0) {
            errors.rate = 'Тариф должен быть больше 0';
        }
        
        if (!data.validFrom) {
            errors.validFrom = 'Укажите дату действия';
        }
        
        return errors;
    }
};
