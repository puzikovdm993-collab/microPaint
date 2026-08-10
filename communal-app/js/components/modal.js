/**
 * Универсальный компонент модального окна
 */

const Modal = {
    overlay: null,
    modal: null,
    titleEl: null,
    bodyEl: null,
    footerEl: null,
    closeBtn: null,

    /**
     * Инициализация модального окна
     */
    init() {
        this.overlay = document.getElementById('modalOverlay');
        this.modal = document.getElementById('modal');
        this.titleEl = document.getElementById('modalTitle');
        this.bodyEl = document.getElementById('modalBody');
        this.footerEl = document.getElementById('modalFooter');
        this.closeBtn = document.getElementById('modalClose');

        // Закрытие по клику на оверлей
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) {
                this.close();
            }
        });

        // Закрытие по кнопке
        this.closeBtn.addEventListener('click', () => {
            this.close();
        });

        // Закрытие по ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.overlay.classList.contains('active')) {
                this.close();
            }
        });
    },

    /**
     * Открытие модального окна
     */
    open(options = {}) {
        const {
            title = '',
            content = '',
            buttons = [],
            onClose = null
        } = options;

        this.titleEl.textContent = title;
        this.bodyEl.innerHTML = content;
        
        // Создаем кнопки
        this.footerEl.innerHTML = '';
        buttons.forEach(btn => {
            const button = document.createElement('button');
            button.className = `btn ${btn.class || 'btn-secondary'}`;
            button.textContent = btn.text;
            button.addEventListener('click', () => {
                if (btn.onClick) {
                    btn.onClick();
                }
                if (btn.close !== false) {
                    this.close();
                }
            });
            this.footerEl.appendChild(button);
        });

        // Сохраняем callback закрытия
        this.onCloseCallback = onClose;

        this.overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    },

    /**
     * Закрытие модального окна
     */
    close() {
        this.overlay.classList.remove('active');
        document.body.style.overflow = '';
        
        if (this.onCloseCallback) {
            this.onCloseCallback();
        }
    },

    /**
     * Получение данных из формы в модальном окне
     */
    getFormData() {
        const formData = {};
        const inputs = this.bodyEl.querySelectorAll('input, select, textarea');
        
        inputs.forEach(input => {
            const name = input.name;
            if (name) {
                formData[name] = input.type === 'checkbox' ? input.checked : input.value;
            }
        });
        
        return formData;
    },

    /**
     * Установка значения поля
     */
    setFieldValue(name, value) {
        const input = this.bodyEl.querySelector(`[name="${name}"]`);
        if (input) {
            if (input.type === 'checkbox') {
                input.checked = value;
            } else {
                input.value = value;
            }
        }
    },

    /**
     * Очистка ошибок валидации
     */
    clearErrors() {
        const errors = this.bodyEl.querySelectorAll('.form-error');
        errors.forEach(el => el.remove());
        
        const invalidInputs = this.bodyEl.querySelectorAll('.form-input.error, .form-select.error');
        invalidInputs.forEach(el => el.classList.remove('error'));
    },

    /**
     * Показать ошибку валидации
     */
    showError(field, message) {
        const input = this.bodyEl.querySelector(`[name="${field}"]`);
        if (input) {
            input.classList.add('error');
            
            const errorEl = document.createElement('div');
            errorEl.className = 'form-error';
            errorEl.textContent = message;
            input.parentNode.appendChild(errorEl);
        }
    },

    /**
     * Показать ошибки валидации
     */
    showErrors(errors) {
        this.clearErrors();
        
        Object.entries(errors).forEach(([field, message]) => {
            this.showError(field, message);
        });
    }
};

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', () => {
    Modal.init();
});
