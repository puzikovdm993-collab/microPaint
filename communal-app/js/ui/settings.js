/**
 * UI компонента Настройки
 */

const SettingsUI = {
    /**
     * Рендеринг страницы настроек
     */
    render() {
        const settings = AppState.data.settings;
        
        const html = `
            <div class="section-header">
                <h3 class="section-title">Настройки</h3>
            </div>
            
            <!-- Основные настройки -->
            <div class="section">
                <div class="section-header">
                    <h4 class="section-title">Объект недвижимости</h4>
                </div>
                <form id="settingsForm" onsubmit="SettingsUI.saveSettings(event)">
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Название объекта</label>
                            <input type="text" name="propertyName" class="form-input" value="${Utils.escapeHtml(settings.propertyName)}" placeholder="Например: Дом на Ленина">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Площадь (м²)</label>
                            <input type="number" step="0.01" name="area" class="form-input" value="${settings.area}" placeholder="65">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Количество проживающих</label>
                            <input type="number" name="residents" class="form-input" value="${settings.residents}" placeholder="3">
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Валюта</label>
                            <select name="currency" class="form-select">
                                <option value="RUB" ${settings.currency === 'RUB' ? 'selected' : ''}>₽ RUB</option>
                                <option value="USD" ${settings.currency === 'USD' ? 'selected' : ''}>$ USD</option>
                                <option value="EUR" ${settings.currency === 'EUR' ? 'selected' : ''}>€ EUR</option>
                                <option value="KZT" ${settings.currency === 'KZT' ? 'selected' : ''}>₸ KZT</option>
                                <option value="BYN" ${settings.currency === 'BYN' ? 'selected' : ''}>Br BYN</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">День оплаты (число месяца)</label>
                            <input type="number" min="1" max="31" name="paymentDeadlineDay" class="form-input" value="${settings.paymentDeadlineDay}">
                        </div>
                    </div>
                    
                    <button type="submit" class="btn btn-primary">Сохранить настройки</button>
                </form>
            </div>
            
            <!-- Настройки аналитики -->
            <div class="section">
                <div class="section-header">
                    <h4 class="section-title">Аналитика и прогнозы</h4>
                </div>
                <form id="analyticsForm" onsubmit="SettingsUI.saveAnalyticsSettings(event)">
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Порог аномального расхода (%)</label>
                            <input type="number" min="10" max="100" name="anomalyThreshold" class="form-input" value="${settings.anomalyThreshold}">
                            <small class="text-secondary">Если расход превышает среднее на этот процент, показывать предупреждение</small>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Месяцев для прогноза</label>
                            <input type="number" min="1" max="12" name="forecastMonths" class="form-input" value="${settings.forecastMonths}">
                            <small class="text-secondary">Количество месяцев для расчета среднего при прогнозе</small>
                        </div>
                    </div>
                    
                    <button type="submit" class="btn btn-primary">Сохранить</button>
                </form>
            </div>
            
            <!-- Управление данными -->
            <div class="section">
                <div class="section-header">
                    <h4 class="section-title">Управление данными</h4>
                </div>
                <div class="form-row">
                    <button class="btn btn-secondary" onclick="SettingsUI.exportData()">
                        📥 Экспорт данных (JSON)
                    </button>
                    <button class="btn btn-secondary" onclick="document.getElementById('importFile').click()">
                        📤 Импорт данных (JSON)
                    </button>
                    <input type="file" id="importFile" accept=".json" style="display: none" onchange="SettingsUI.importData(this)">
                    <button class="btn btn-secondary" onclick="SettingsUI.downloadBackup()">
                        💾 Создать резервную копию
                    </button>
                    <button class="btn btn-danger" onclick="SettingsUI.clearAllData()">
                        🗑️ Очистить все данные
                    </button>
                </div>
            </div>
            
            <!-- Информация о приложении -->
            <div class="section">
                <div class="section-header">
                    <h4 class="section-title">О приложении</h4>
                </div>
                <div class="text-secondary">
                    <p><strong>Домашняя коммуналка</strong> — приложение для учета коммунальных расходов</p>
                    <p>Версия: 1.0.0</p>
                    <p>Данные хранятся локально в браузере (localStorage)</p>
                </div>
            </div>
        `;

        document.getElementById('contentArea').innerHTML = html;
    },

    /**
     * Сохранение основных настроек
     */
    saveSettings(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        
        AppState.data.settings.propertyName = formData.get('propertyName');
        AppState.data.settings.area = parseFloat(formData.get('area')) || 0;
        AppState.data.settings.residents = parseInt(formData.get('residents')) || 0;
        AppState.data.settings.currency = formData.get('currency');
        AppState.data.settings.paymentDeadlineDay = parseInt(formData.get('paymentDeadlineDay')) || 10;
        
        AppState.save();
        Notification.success('Настройки сохранены');
    },

    /**
     * Сохранение настроек аналитики
     */
    saveAnalyticsSettings(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        
        AppState.data.settings.anomalyThreshold = parseInt(formData.get('anomalyThreshold')) || 20;
        AppState.data.settings.forecastMonths = parseInt(formData.get('forecastMonths')) || 3;
        
        AppState.save();
        Notification.success('Настройки аналитики сохранены');
    },

    /**
     * Экспорт данных
     */
    exportData() {
        const json = StorageService.export();
        if (!json) {
            Notification.error('Ошибка экспорта данных');
            return;
        }
        
        // Показываем в модальном окне
        const content = `
            <textarea style="width: 100%; height: 300px; font-family: monospace; font-size: 12px;" readonly>${json}</textarea>
        `;
        
        Modal.open({
            title: 'Экспорт данных',
            content,
            buttons: [
                { text: 'Закрыть', class: 'btn-secondary' }
            ]
        });
        
        Notification.info('Данные экспортированы');
    },

    /**
     * Импорт данных
     */
    importData(input) {
        const file = input.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            const result = StorageService.import(e.target.result);
            if (result) {
                Notification.success('Данные импортированы');
                setTimeout(() => location.reload(), 1000);
            } else {
                Notification.error('Ошибка импорта данных');
            }
        };
        reader.readAsText(file);
        
        // Сбрасываем input
        input.value = '';
    },

    /**
     * Скачивание резервной копии
     */
    downloadBackup() {
        if (StorageService.downloadBackup()) {
            Notification.success('Резервная копия скачана');
        } else {
            Notification.error('Ошибка создания резервной копии');
        }
    },

    /**
     * Очистка всех данных
     */
    clearAllData() {
        if (confirm('⚠️ Вы уверены, что хотите удалить ВСЕ данные? Это действие нельзя отменить!')) {
            if (confirm('Вы действительно уверены? Все показания, платежи и настройки будут удалены.')) {
                StorageService.clear();
                Notification.success('Данные очищены');
                setTimeout(() => location.reload(), 1000);
            }
        }
    }
};
