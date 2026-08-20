from flask import Flask, request, jsonify
import os
import base64
from datetime import datetime

app = Flask(__name__)

UPLOAD_FOLDER = '/tmp/uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'service': 'file-service'})

@app.route('/api/file/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    filename = f"{datetime.now().strftime('%Y%m%d_%H%M%S')}_{file.filename}"
    filepath = os.path.join(UPLOAD_FOLDER, filename)
    file.save(filepath)
    
    file_size = os.path.getsize(filepath)
    
    return jsonify({
        'message': 'File uploaded successfully',
        'filename': filename,
        'original_filename': file.filename,
        'size': file_size,
        'path': filepath
    })

@app.route('/api/file/info', methods=['POST'])
def file_info():
    data = request.get_json()
    content = data.get('content', '')
    filename = data.get('filename', 'unknown.txt')
    
    file_size = len(content.encode('utf-8'))
    line_count = len(content.splitlines()) if content else 0
    
    return jsonify({
        'filename': filename,
        'size_bytes': file_size,
        'line_count': line_count,
        'char_count': len(content)
    })

@app.route('/api/file/encode', methods=['POST'])
def encode_file():
    data = request.get_json()
    content = data.get('content', '')
    encoding_type = data.get('type', 'base64')
    
    if encoding_type == 'base64':
        encoded = base64.b64encode(content.encode('utf-8')).decode('utf-8')
        return jsonify({
            'original': content,
            'encoded': encoded,
            'encoding': 'base64'
        })
    else:
        return jsonify({'error': 'Unsupported encoding type'}), 400

@app.route('/api/file/decode', methods=['POST'])
def decode_file():
    data = request.get_json()
    content = data.get('content', '')
    encoding_type = data.get('type', 'base64')
    
    if encoding_type == 'base64':
        try:
            decoded = base64.b64decode(content).decode('utf-8')
            return jsonify({
                'original': content,
                'decoded': decoded,
                'encoding': 'base64'
            })
        except Exception as e:
            return jsonify({'error': str(e)}), 400
    else:
        return jsonify({'error': 'Unsupported encoding type'}), 400

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5002, debug=True)
