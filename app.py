import os
import io
import base64
import numpy as np
from PIL import Image
from flask import Flask, request, jsonify, render_template

# Force CPU for TensorFlow inference to keep the app lightweight
os.environ['CUDA_VISIBLE_DEVICES'] = '-1'

import tensorflow as tf
from tensorflow.keras.applications.mobilenet_v2 import preprocess_input

app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'daeera_secret_key_123_abc')

# Directory setup
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, 'models', 'daira_model.h5')

# Global variable for model storage
model = None

# Custom classes from train.py
CLASS_NAMES = ['metal_can', 'plastic_bottle', 'glass_bottle', 'paper_waste', 'general_trash']

# Dynamic points mapping
POINTS_MAP = {
    'metal_can': 15,
    'plastic_bottle': 10,
    'glass_bottle': 12,
    'paper_waste': 5,
    'general_trash': 0
}

# Arabic translations, colors, and educational info for the classes
CLASS_INFO = {
    'metal_can': {
        'name': 'علبة معدنية',
        'category': 'معادن',
        'recyclable': True,
        'color': '#10b981',
        'description': 'علب الألمنيوم والحديد قابلة لإعادة التدوير بنسبة 100٪ وتوفر الكثير من الطاقة عند إعادة تصنيعها.',
        'savings': 'إعادة تدوير المعادن توفر حوالي 95٪ من الطاقة اللازمة لإنتاجها من المواد الخام الأصلية.'
    },
    'plastic_bottle': {
        'name': 'علبة بلاستيكية',
        'category': 'بلاستيك',
        'recyclable': True,
        'color': '#10b981',
        'description': 'الزجاجات البلاستيكية قابلة لإعادة التدوير. يرجى التأكد من تفريغها وشطفها بالماء قبل وضعها في سلة المهملات.',
        'savings': 'إعادة تدوير البلاستيك توفر طاقة كافية لتشغيل جهاز كمبيوتر محمول لأكثر من 25 ساعة.'
    },
    'glass_bottle': {
        'name': 'علبة زجاجية',
        'category': 'زجاج',
        'recyclable': True,
        'color': '#10b981',
        'description': 'الزجاج قابل لإعادة التدوير بنسبة 100٪ ويمكن إعادة تدويره بشكل غير محدود دون أن يفقد نقاءه أو جودته.',
        'savings': 'إعادة تدوير الزجاج تقلل من تلوث الهواء بنسبة 20٪ وتلوث المياه بنسبة 50٪ مقارنة بالزجاج الجديد.'
    },
    'paper_waste': {
        'name': 'ورق وكرتون',
        'category': 'ورق',
        'recyclable': True,
        'color': '#10b981',
        'description': 'الورق والكرتون النظيف قابل لإعادة التدوير. يرجى التأكد من عدم تلوثه بالسوائل أو بقايا الطعام.',
        'savings': 'إعادة تدوير طن من الورق يوفر 17 شجرة وحوالي 7000 جالون من الماء.'
    },
    'general_trash': {
        'name': 'نفايات عامة / غير مدعومة',
        'category': 'غير قابل للتدوير',
        'recyclable': False,
        'color': '#ef4444',
        'description': 'هذا العنصر غير قابل لإعادة التدوير في هذه السلة. يرجى التخلص منه في سلة النفايات العامة.',
        'savings': 'التخلص الصحيح من النفايات يحمي البيئة من التلوث.'
    }
}

def load_classification_model():
    """Load the fine-tuned custom Keras model"""
    global model
    if os.path.exists(MODEL_PATH):
        try:
            print(f"Loading fine-tuned model from {MODEL_PATH}...")
            model = tf.keras.models.load_model(MODEL_PATH)
            print("Model loaded successfully!")
        except Exception as e:
            print(f"Error loading custom model: {e}")
            model = None
    else:
        print(f"Model file not found at {MODEL_PATH}. Please run train.py to train the model first.")
        model = None

# Load the model on startup
load_classification_model()

def preprocess_image(image_bytes):
    """Decode, convert to RGB, resize, and normalize the image"""
    image = Image.open(io.BytesIO(image_bytes))
    
    # Ensure RGB color mode
    if image.mode != 'RGB':
        image = image.convert('RGB')
        
    # Resize to MobileNetV2 input shape
    image = image.resize((224, 224))
    
    img_array = np.array(image, dtype=np.float32)
    img_array = np.expand_dims(img_array, axis=0)
    
    # Normalize inputs to [-1, 1] as required by MobileNetV2
    img_array = preprocess_input(img_array)
    return img_array

@app.route('/')
def home():
    """Serve the single-page recycling classifier application"""
    return render_template('index.html')

@app.route('/classify', methods=['POST'])
@app.route('/predict', methods=['POST'])
def classify():
    """Accept a base64 image payload and return prediction results"""
    global model
    if model is None:
        load_classification_model()
        if model is None:
            return jsonify({
                'success': False, 
                'error': 'النموذج غير متوفر حالياً. يرجى التأكد من تشغيل ملف train.py لإنشاء النموذج.'
            }), 500
            
    try:
        if not request.is_json:
            return jsonify({'success': False, 'error': 'يجب أن يكون محتوى الطلب بتنسيق JSON.'}), 400
            
        data = request.get_json()
        if not data or 'image' not in data:
            return jsonify({'success': False, 'error': 'لم يتم العثور على حقل الصورة في طلب JSON.'}), 400
            
        image_data = data['image']
        if ',' in image_data:
            image_data = image_data.split(',')[1]
            
        image_bytes = base64.b64decode(image_data)
        img_tensor = preprocess_image(image_bytes)
        preds = model.predict(img_tensor)
        
        pred_idx = int(np.argmax(preds[0]))
        confidence = float(preds[0][pred_idx])
        class_name = CLASS_NAMES[pred_idx]
        
        info = CLASS_INFO.get(class_name, {
            'name': 'غير معروف',
            'category': 'غير معروف',
            'recyclable': False,
            'color': '#ef4444',
            'description': 'عنصر غير مصنف.',
            'savings': ''
        })
        
        return jsonify({
            'success': True,
            'class': class_name,
            'label': info['name'],
            'category': info['category'],
            'recyclable': info['recyclable'],
            'color': info['color'],
            'confidence': confidence,
            'description': info['description'],
            'savings': info['savings'],
            'points': POINTS_MAP.get(class_name, 0)
        })
        
    except Exception as e:
        print(f"Classification error: {e}")
        return jsonify({'success': False, 'error': f"فشل تصنيف الصورة: {str(e)}"}), 500

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5000, debug=True)
