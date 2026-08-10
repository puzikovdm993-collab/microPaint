/**
 * Компонент обучения (Onboarding)
 */

const Onboarding = {
    // Шаги обучения
    steps: [
        {
            id: 'welcome',
            title: 'Добро пожаловать!',
            content: `
                <p><strong>Домашняя коммуналка</strong> — это удобное приложение для учета коммунальных расходов.</p>
                <p>Оно поможет вам:</p>
                <ul class="onboarding-list">
                    <li>📊 Вести учет показаний счетчиков</li>
                    <li>💰 Контролировать расходы по услугам</li>
                    <li>📈 Анализировать потребление и находить аномалии</li>
                    <li>🔮 Прогнозировать расходы на следующий месяц</li>
                    <li>📝 Фиксировать платежи и отслеживать задолженность</li>
                </ul>
                <p class="text-secondary">Приложение работает полностью в браузере, данные хранятся локально.</p>
            `,
            button: 'Начать обзор'
        },
        {
            id: 'dashboard',
            title: 'Дашборд — главная страница',
            content: `
                <p>На дашборде вы видите общую картину:</p>
                <ul class="onboarding-list">
                    <li><strong>Расходы за текущий месяц</strong> — сумма всех начислений</li>
                    <li><strong>Оплачено</strong> — сумма ваших платежей</li>
                    <li><strong>Задолженность</strong> — разница между начислениями и платежами</li>
                    <li><strong>Прогноз</strong> — ожидаемые расходы на следующий месяц</li>
                </ul>
                <p>Ниже расположен <strong>график расходов</strong> за последние месяцы и детализация по каждой услуге с указанием изменения к прошлому месяцу.</p>
            `,
            highlight: '.nav-item[data-page="dashboard"]',
            button: 'Далее'
        },
        {
            id: 'meters',
            title: 'Счетчики — внесение показаний',
            content: `
                <p>В разделе <strong>«Счетчики»</strong> вы можете:</p>
                <ul class="onboarding-list">
                    <li>Видеть текущие показания и расход по каждому счетчику</li>
                    <li>Добавлять новые показания кнопкой <strong>«Внести показания»</strong></li>
                    <li>Добавлять новые счетчики через кнопку <strong>«+ Счетчик»</strong></li>
                </ul>
                <p class="text-secondary">⚠️ Нельзя ввести показания меньше предыдущего (если счетчик не сбрасывается).</p>
                <p>После внесения показаний приложение автоматически рассчитает расход и стоимость по актуальному тарифу.</p>
            `,
            highlight: '.nav-item[data-page="meters"]',
            button: 'Далее'
        },
        {
            id: 'services',
            title: 'Услуги — справочник',
            content: `
                <p>В разделе <strong>«Услуги»</strong> хранится справочник коммунальных услуг:</p>
                <ul class="onboarding-list">
                    <li>Электроэнергия, вода, газ, отопление и др.</li>
                    <li>Для каждой услуги указан тип расчета: по счетчику, фиксированный, по площади, по проживающим</li>
                </ul>
                <p>Вы можете:</p>
                <ul class="onboarding-list">
                    <li>Добавлять новые услуги</li>
                    <li>Изменять тарифы (старые тарифы сохраняются в истории)</li>
                    <li>Отключать ненужные услуги</li>
                </ul>
            `,
            highlight: '.nav-item[data-page="services"]',
            button: 'Далее'
        },
        {
            id: 'payments',
            title: 'Платежи — учет оплат',
            content: `
                <p>В разделе <strong>«Платежи»</strong> фиксируйте фактические оплаты:</p>
                <ul class="onboarding-list">
                    <li>Указывайте дату, период и сумму платежа</li>
                    <li>Выбирайте способ оплаты: карта, наличные, перевод, автоплатеж</li>
                    <li>Фильтруйте платежи по году и способу оплаты</li>
                </ul>
                <p>На основании платежей рассчитывается <strong>задолженность</strong> на дашборде.</p>
            `,
            highlight: '.nav-item[data-page="payments"]',
            button: 'Далее'
        },
        {
            id: 'history',
            title: 'История — журнал операций',
            content: `
                <p>В разделе <strong>«История»</strong> отображаются все операции:</p>
                <ul class="onboarding-list">
                    <li>Внесение показаний счетчиков</li>
                    <li>Изменение тарифов</li>
                    <li>Начисления по услугам</li>
                    <li>Платежи</li>
                </ul>
                <p>Можно фильтровать историю по типу событий для быстрого поиска.</p>
            `,
            highlight: '.nav-item[data-page="history"]',
            button: 'Далее'
        },
        {
            id: 'analytics',
            title: 'Аналитика — анализ расходов',
            content: `
                <p>Раздел <strong>«Аналитика»</strong> поможет понять структуру расходов:</p>
                <ul class="onboarding-list">
                    <li>Графики расходов по месяцам и категориям</li>
                    <li>Статистика: средний, минимальный, максимальный расход</li>
                    <li>Обнаружение аномалий — если расход значительно выше среднего</li>
                    <li>Динамика потребления по каждому счетчику</li>
                </ul>
                <p class="text-secondary">Порог аномалии настраивается в разделе «Настройки».</p>
            `,
            highlight: '.nav-item[data-page="analytics"]',
            button: 'Далее'
        },
        {
            id: 'settings',
            title: 'Настройки — управление приложением',
            content: `
                <p>В разделе <strong>«Настройки»</strong> вы можете:</p>
                <ul class="onboarding-list">
                    <li>Указать название объекта, площадь, количество проживающих</li>
                    <li>Настроить день оплаты для напоминания</li>
                    <li>Изменить порог обнаружения аномалий</li>
                    <li>Настроить количество месяцев для прогноза</li>
                </ul>
                <p><strong>Управление данными:</strong></p>
                <ul class="onboarding-list">
                    <li>📥 Экспорт данных в JSON</li>
                    <li>📤 Импорт данных из JSON</li>
                    <li>💾 Создание резервной копии</li>
                    <li>🗑️ Очистка всех данных (начать заново)</li>
                </ul>
            `,
            highlight: '.nav-item[data-page="settings"]',
            button: 'Завершить'
        }
    ],

    currentStep: 0,

    /**
     * Проверка, нужно ли показывать обучение
     */
    shouldShow() {
        const shown = localStorage.getItem('communal_app_onboarding_shown');
        return !shown;
    },

    /**
     * Показ обучения
     */
    show() {
        if (!this.shouldShow()) {
            return;
        }
        
        this.currentStep = 0;
        this.renderStep();
    },

    /**
     * Рендеринг текущего шага
     */
    renderStep() {
        const step = this.steps[this.currentStep];
        if (!step) return;

        const html = `
            <div class="onboarding-overlay" id="onboardingOverlay">
                <div class="onboarding-modal">
                    <div class="onboarding-header">
                        <h3>${step.title}</h3>
                        <button class="btn-close" onclick="Onboarding.close()">×</button>
                    </div>
                    <div class="onboarding-content">
                        ${step.content}
                    </div>
                    <div class="onboarding-footer">
                        <div class="onboarding-progress">
                            ${this.steps.map((_, index) => 
                                `<span class="onboarding-dot ${index === this.currentStep ? 'active' : ''} ${index < this.currentStep ? 'completed' : ''}"></span>`
                            ).join('')}
                        </div>
                        <div class="onboarding-buttons">
                            ${this.currentStep > 0 ? '<button class="btn btn-secondary" onclick="Onboarding.prev()">Назад</button>' : ''}
                            <button class="btn btn-primary" onclick="Onboarding.next()">${step.button}</button>
                            ${this.currentStep < this.steps.length - 1 ? `<button class="btn btn-text" onclick="Onboarding.skip()">Пропустить</button>` : ''}
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Вставляем HTML
        const container = document.getElementById('onboardingContainer');
        if (container) {
            container.innerHTML = html;
        } else {
            const div = document.createElement('div');
            div.id = 'onboardingContainer';
            div.innerHTML = html;
            document.body.appendChild(div);
        }

        // Подсветка элемента если есть
        if (step.highlight) {
            setTimeout(() => {
                const element = document.querySelector(step.highlight);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 100);
        }
    },

    /**
     * Следующий шаг
     */
    next() {
        if (this.currentStep < this.steps.length - 1) {
            this.currentStep++;
            this.renderStep();
        } else {
            this.complete();
        }
    },

    /**
     * Предыдущий шаг
     */
    prev() {
        if (this.currentStep > 0) {
            this.currentStep--;
            this.renderStep();
        }
    },

    /**
     * Пропустить обучение
     */
    skip() {
        this.complete();
    },

    /**
     * Завершение обучения
     */
    complete() {
        localStorage.setItem('communal_app_onboarding_shown', 'true');
        this.close();
        Notification.success('Обучение завершено!');
    },

    /**
     * Закрытие обучения
     */
    close() {
        const container = document.getElementById('onboardingContainer');
        if (container) {
            container.remove();
        }
    },

    /**
     * Показать обучение заново (для настроек)
     */
    showAgain() {
        localStorage.removeItem('communal_app_onboarding_shown');
        this.currentStep = 0;
        this.renderStep();
    }
};
