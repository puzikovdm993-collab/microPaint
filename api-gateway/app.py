from flask import Flask, request, jsonify, send_from_directory
import requests
import os

app = Flask(__name__, static_folder='../frontend/static', template_folder='../frontend/templates')

TEXT_SERVICE_URL = 'http://localhost:5001'
FILE_SERVICE_URL = 'http://localhost:5002'

@app.route('/')
def index():
    return send_from_directory('../frontend/templates', 'index.html')

@app.route('/static/<path:filename>')
def serve_static(filename):
    return send_from_directory('../frontend/static', filename)

@app.route('/api/text/<endpoint>', methods=['POST'])
def proxy_text(endpoint):
    try:
        data = request.get_json()
        response = requests.post(f'{TEXT_SERVICE_URL}/api/text/{endpoint}', json=data)
        return jsonify(response.json()), response.status_code
    except requests.exceptions.RequestException as e:
        return jsonify({'error': f'Text service unavailable: {str(e)}'}), 503

@app.route('/api/file/<endpoint>', methods=['POST'])
def proxy_file(endpoint):
    try:
        if request.files:
            response = requests.post(f'{FILE_SERVICE_URL}/api/file/{endpoint}', 
                                   files=request.files, 
                                   data=request.form.to_dict())
        else:
            data = request.get_json()
            response = requests.post(f'{FILE_SERVICE_URL}/api/file/{endpoint}', json=data)
        return jsonify(response.json()), response.status_code
    except requests.exceptions.RequestException as e:
        return jsonify({'error': f'File service unavailable: {str(e)}'}), 503

@app.route('/health', methods=['GET'])
def health():
    services = {}
    
    try:
        text_response = requests.get(f'{TEXT_SERVICE_URL}/health', timeout=2)
        services['text-service'] = text_response.json()
    except:
        services['text-service'] = {'status': 'unavailable'}
    
    try:
        file_response = requests.get(f'{FILE_SERVICE_URL}/health', timeout=2)
        services['file-service'] = file_response.json()
    except:
        services['file-service'] = {'status': 'unavailable'}
    
    return jsonify({
        'status': 'ok',
        'service': 'api-gateway',
        'services': services
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
