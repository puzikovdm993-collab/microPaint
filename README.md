# Микросервисное приложение для работы с файлами и текстом

## Архитектура

Приложение состоит из трех микросервисов:

1. **API Gateway** (порт 5000) - единая точка входа, маршрутизирует запросы к соответствующим сервисам
2. **Text Service** (порт 5001) - обработка текста (обращение, подсчет, регистр)
3. **File Service** (порт 5002) - работа с файлами (загрузка, кодирование/декодирование)

## Структура проекта

```
/workspace
├── api-gateway/          # API шлюз
│   └── app.py
├── text-service/         # Сервис обработки текста
│   └── app.py
├── file-service/         # Сервис работы с файлами
│   └── app.py
├── frontend/             # Фронтенд
│   ├── templates/
│   │   └── index.html
│   └── static/
│       ├── style.css
│       └── script.js
├── requirements.txt      # Зависимости Python
├── run.sh               # Скрипт запуска
└── README.md            # Этот файл
```

## Установка и запуск

### Вариант 1: Автоматический запуск

```bash
chmod +x run.sh
./run.sh
```

### Вариант 2: Ручной запуск

```bash
# Установка зависимостей
pip install -r requirements.txt

# Запуск Text Service (терминал 1)
cd text-service
python app.py

# Запуск File Service (терминал 2)
cd file-service
python app.py

# Запуск API Gateway (терминал 3)
cd api-gateway
python app.py
```

## Доступ к приложению

Откройте в браузере: **http://localhost:5000**

## Функционал

### Инструменты для текста:
- 🔄 Обратить текст
- 📊 Подсчитать символы, слова, строки
- 🔠 Преобразовать в верхний регистр
- 🔡 Преобразовать в нижний регистр

### Инструменты для файлов:
- 📁 Загрузка файлов
- 🔐 Кодирование в Base64
- 🔓 Декодирование из Base64

## API Endpoints

### Text Service (порт 5001)
- `POST /api/text/reverse` - обратить текст
- `POST /api/text/count` - подсчитать статистику
- `POST /api/text/uppercase` - верхний регистр
- `POST /api/text/lowercase` - нижний регистр

### File Service (порт 5002)
- `POST /api/file/upload` - загрузить файл
- `POST /api/file/info` - получить информацию о файле
- `POST /api/file/encode` - кодировать (Base64)
- `POST /api/file/decode` - декодировать (Base64)

### API Gateway (порт 5000)
- `GET /health` - статус всех сервисов
- Проксирует все запросы к соответствующим сервисам

## Технологии

- **Backend**: Python + Flask (микросервисы)
- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Архитектура**: Микросервисы с API Gateway
