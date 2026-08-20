const API_BASE = '/api';

async function checkServiceStatus() {
    try {
        const response = await fetch('/health');
        const data = await response.json();
        
        document.getElementById('gateway-status').classList.add('active');
        
        if (data.services['text-service'].status === 'ok') {
            document.getElementById('text-status').classList.add('active');
        }
        
        if (data.services['file-service'].status === 'ok') {
            document.getElementById('file-status').classList.add('active');
        }
    } catch (error) {
        console.error('Error checking service status:', error);
    }
}

async function reverseText() {
    const text = document.getElementById('text-input').value;
    if (!text) {
        alert('Введите текст');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/text/reverse`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({text})
        });
        const data = await response.json();
        displayResult('text-result', 'Обращенный текст:', data.reversed);
    } catch (error) {
        displayResult('text-result', 'Ошибка:', error.message);
    }
}

async function countText() {
    const text = document.getElementById('text-input').value;
    if (!text) {
        alert('Введите текст');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/text/count`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({text})
        });
        const data = await response.json();
        const result = `
            <h4>Статистика текста:</h4>
            <p>📊 Символов: ${data.char_count}</p>
            <p>📝 Слов: ${data.word_count}</p>
            <p>📄 Строк: ${data.line_count}</p>
        `;
        document.getElementById('text-result').innerHTML = result;
    } catch (error) {
        displayResult('text-result', 'Ошибка:', error.message);
    }
}

async function uppercaseText() {
    const text = document.getElementById('text-input').value;
    if (!text) {
        alert('Введите текст');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/text/uppercase`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({text})
        });
        const data = await response.json();
        displayResult('text-result', 'Верхний регистр:', data.uppercase);
    } catch (error) {
        displayResult('text-result', 'Ошибка:', error.message);
    }
}

async function lowercaseText() {
    const text = document.getElementById('text-input').value;
    if (!text) {
        alert('Введите текст');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/text/lowercase`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({text})
        });
        const data = await response.json();
        displayResult('text-result', 'Нижний регистр:', data.lowercase);
    } catch (error) {
        displayResult('text-result', 'Ошибка:', error.message);
    }
}

async function uploadFile() {
    const fileInput = document.getElementById('file-input');
    const file = fileInput.files[0];
    
    if (!file) {
        alert('Выберите файл');
        return;
    }
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
        const response = await fetch(`${API_BASE}/file/upload`, {
            method: 'POST',
            body: formData
        });
        const data = await response.json();
        
        if (data.error) {
            displayResult('file-result', 'Ошибка:', data.error);
        } else {
            const result = `
                <h4>Файл загружен успешно!</h4>
                <p>📁 Имя файла: ${data.filename}</p>
                <p>📊 Размер: ${data.size} байт</p>
                <p>🏷️ Оригинальное имя: ${data.original_filename}</p>
            `;
            document.getElementById('file-result').innerHTML = result;
        }
    } catch (error) {
        displayResult('file-result', 'Ошибка:', error.message);
    }
}

async function encodeBase64() {
    const content = document.getElementById('encode-input').value;
    if (!content) {
        alert('Введите текст');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/file/encode`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({content, type: 'base64'})
        });
        const data = await response.json();
        
        if (data.error) {
            displayResult('encode-result', 'Ошибка:', data.error);
        } else {
            displayResult('encode-result', 'Закодированный текст (Base64):', data.encoded);
        }
    } catch (error) {
        displayResult('encode-result', 'Ошибка:', error.message);
    }
}

async function decodeBase64() {
    const content = document.getElementById('encode-input').value;
    if (!content) {
        alert('Введите текст');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/file/decode`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({content, type: 'base64'})
        });
        const data = await response.json();
        
        if (data.error) {
            displayResult('encode-result', 'Ошибка:', data.error);
        } else {
            displayResult('encode-result', 'Декодированный текст:', data.decoded);
        }
    } catch (error) {
        displayResult('encode-result', 'Ошибка:', error.message);
    }
}

function displayResult(elementId, title, content) {
    const resultBox = document.getElementById(elementId);
    resultBox.innerHTML = `
        <h4>${title}</h4>
        <pre>${content}</pre>
    `;
}

document.addEventListener('DOMContentLoaded', checkServiceStatus);
