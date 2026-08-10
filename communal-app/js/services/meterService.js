/**
 * Сервис работы со счетчиками и показаниями
 */

const MeterService = {
    /**
     * Получение всех счетчиков
     */
    getAllMeters() {
        return AppState.data.meters;
    },

    /**
     * Получение счетчика по ID
     */
    getMeterById(id) {
        return AppState.getMeterById(id);
    },

    /**
     * Добавление нового счетчика
     */
    addMeter(data) {
        const meter = {
            id: Utils.generateId(),
            serviceId: data.serviceId,
            name: data.name,
            number: data.number,
            unit: data.unit,
            type: data.type || 'single',
            canReset: data.canReset || false
        };
        
        AppState.data.meters.push(meter);
        AppState.save();
        return meter;
    },

    /**
     * Обновление счетчика
     */
    updateMeter(id, data) {
        const meter = this.getMeterById(id);
        if (meter) {
            Object.assign(meter, data);
            AppState.save();
            return meter;
        }
        return null;
    },

    /**
     * Удаление счетчика
     */
    deleteMeter(id) {
        const index = AppState.data.meters.findIndex(m => m.id === id);
        if (index !== -1) {
            // Удаляем связанные показания
            AppState.data.readings = AppState.data.readings.filter(r => r.meterId !== id);
            AppState.data.meters.splice(index, 1);
            AppState.save();
            return true;
        }
        return false;
    },

    /**
     * Добавление показаний
     */
    addReading(data) {
        const meter = this.getMeterById(data.meterId);
        if (!meter) {
            return { error: 'Счетчик не найден' };
        }

        const value = parseFloat(data.value);
        if (isNaN(value) || value < 0) {
            return { error: 'Некорректное значение показания' };
        }

        // Проверяем, что показание не меньше предыдущего
        const lastReading = AppState.getLastReading(data.meterId);
        if (lastReading && value < lastReading.value && !meter.canReset) {
            return { 
                error: `Показание не может быть меньше предыдущего (${lastReading.value} ${meter.unit})` 
            };
        }

        const reading = {
            id: Utils.generateId(),
            meterId: data.meterId,
            serviceId: meter.serviceId,
            date: data.date,
            value: value,
            comment: data.comment || ''
        };

        AppState.data.readings.push(reading);
        AppState.save();

        return { success: true, reading };
    },

    /**
     * Расчет расхода для счетчика за период
     */
    calculateConsumption(meterId, monthStr) {
        const meter = this.getMeterById(meterId);
        if (!meter) return null;

        const currentReading = AppState.data.readings
            .filter(r => r.meterId === meterId && r.date.startsWith(monthStr))
            .sort((a, b) => b.date.localeCompare(a.date))[0];

        if (!currentReading) return null;

        const prevMonth = Utils.subtractMonths(new Date(`${monthStr}-15`), 1);
        const prevMonthStr = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, '0')}`;

        const prevReading = AppState.data.readings
            .filter(r => r.meterId === meterId && r.date.startsWith(prevMonthStr))
            .sort((a, b) => b.date.localeCompare(a.date))[0];

        if (!prevReading) return null;

        const consumption = currentReading.value - prevReading.value;
        const tariff = AppState.getCurrentTariff(meter.serviceId, currentReading.date);
        const cost = tariff ? Utils.round2(consumption * tariff.rate) : 0;

        return {
            consumption,
            cost,
            currentReading: currentReading.value,
            previousReading: prevReading.value,
            tariff: tariff ? tariff.rate : 0,
            unit: meter.unit
        };
    },

    /**
     * Валидация показаний
     */
    validateReading(data) {
        const errors = {};

        if (!data.meterId) {
            errors.meterId = 'Выберите счетчик';
        }

        if (!data.date) {
            errors.date = 'Укажите дату';
        }

        if (!data.value || data.value <= 0) {
            errors.value = 'Показание должно быть больше 0';
        }

        return errors;
    },

    /**
     * Получение истории показаний для счетчика
     */
    getReadingsHistory(meterId, limit = 12) {
        return AppState.data.readings
            .filter(r => r.meterId === meterId)
            .sort((a, b) => b.date.localeCompare(a.date))
            .slice(0, limit);
    }
};
