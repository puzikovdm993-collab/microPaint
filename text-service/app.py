from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'service': 'text-service'})

@app.route('/api/text/reverse', methods=['POST'])
def reverse_text():
    data = request.get_json()
    text = data.get('text', '')
    reversed_text = text[::-1]
    return jsonify({'original': text, 'reversed': reversed_text})

@app.route('/api/text/count', methods=['POST'])
def count_text():
    data = request.get_json()
    text = data.get('text', '')
    char_count = len(text)
    word_count = len(text.split())
    line_count = len(text.splitlines()) if text else 0
    return jsonify({
        'text': text,
        'char_count': char_count,
        'word_count': word_count,
        'line_count': line_count
    })

@app.route('/api/text/uppercase', methods=['POST'])
def uppercase_text():
    data = request.get_json()
    text = data.get('text', '')
    return jsonify({'original': text, 'uppercase': text.upper()})

@app.route('/api/text/lowercase', methods=['POST'])
def lowercase_text():
    data = request.get_json()
    text = data.get('text', '')
    return jsonify({'original': text, 'lowercase': text.lower()})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)
