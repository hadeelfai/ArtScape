from flask import Flask, request, jsonify
import numpy as np
import tensorflow as tf
from PIL import Image
import requests
from io import BytesIO
from flask_cors import CORS



model = tf.keras.applications.MobileNetV2(include_top=False, pooling='avg')

app = Flask(__name__)
CORS(app)
def get_embedding(image_url):
    img_data = requests.get(image_url).content
    img = Image.open(BytesIO(img_data)).resize((224, 224))
    img = tf.keras.preprocessing.image.img_to_array(img)
    img = tf.keras.applications.mobilenet_v2.preprocess_input(img)
    img = np.expand_dims(img, axis=0)
    vector = model.predict(img)[0]
    return vector.tolist()

@app.route('/embed', methods=['POST'])
def embed_image():
    data = request.get_json()
    url = data['url']
    embedding = get_embedding(url)
    return jsonify({"embedding": embedding})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=6000)
