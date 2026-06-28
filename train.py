import os
import tensorflow as tf
from tensorflow.keras import layers, models
from tensorflow.keras.applications.mobilenet_v2 import MobileNetV2, preprocess_input

# Force CPU for TensorFlow to run predictably on standard systems without requiring CUDA
os.environ['CUDA_VISIBLE_DEVICES'] = '-1'

# Define paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASET_DIR = os.path.join(BASE_DIR, 'dataset')
MODEL_DIR = os.path.join(BASE_DIR, 'models')
os.makedirs(MODEL_DIR, exist_ok=True)
MODEL_SAVE_PATH = os.path.join(MODEL_DIR, 'daira_model.h5')

# Parameters
IMG_SIZE = (224, 224)
BATCH_SIZE = 4
EPOCHS = 15
CLASS_NAMES = ['metal_can', 'plastic_bottle', 'glass_bottle', 'paper_waste', 'general_trash']

def main():
    print("--------------------------------------------------")
    print("Da'ira ML Training Script (Normalized Dataset)")
    print(f"Dataset directory: {DATASET_DIR}")
    print(f"Target model save location: {MODEL_SAVE_PATH}")
    print(f"Target classes: {CLASS_NAMES}")
    print("--------------------------------------------------")

    # Load dataset
    print("Loading image dataset...")
    try:
        train_ds = tf.keras.utils.image_dataset_from_directory(
            DATASET_DIR,
            labels='inferred',
            label_mode='int',
            class_names=CLASS_NAMES,
            color_mode='rgb',
            batch_size=BATCH_SIZE,
            image_size=IMG_SIZE,
            shuffle=True,
            seed=123
        )
    except Exception as e:
        print(f"Error loading dataset: {e}")
        return

    # Apply preprocess_input (scale range [0, 255] to [-1, 1]) as a map function
    # to keep it out of the Keras functional model graph (avoiding TrueDivide errors)
    train_ds = train_ds.map(lambda x, y: (preprocess_input(x), y))

    # Prefetch for performance
    train_ds = train_ds.prefetch(buffer_size=tf.data.AUTOTUNE)

    # Data Augmentation layer
    data_augmentation = tf.keras.Sequential([
        layers.RandomFlip("horizontal_and_vertical"),
        layers.RandomRotation(0.2),
        layers.RandomZoom(0.15),
        layers.RandomTranslation(0.1, 0.1),
    ])

    print("Building MobileNetV2 model architecture...")
    # Load base pre-trained MobileNetV2 model
    base_model = MobileNetV2(
        input_shape=(IMG_SIZE[0], IMG_SIZE[1], 3),
        include_top=False,
        weights='imagenet'
    )
    # Freeze the pre-trained weights
    base_model.trainable = False

    # Add custom dense head
    inputs = tf.keras.Input(shape=(IMG_SIZE[0], IMG_SIZE[1], 3))
    x = data_augmentation(inputs)
    x = base_model(x, training=False)
    x = layers.GlobalAveragePooling2D()(x)
    x = layers.Dropout(0.2)(x)
    outputs = layers.Dense(len(CLASS_NAMES), activation='softmax')(x)
    
    model = tf.keras.Model(inputs, outputs)

    # Compile model
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=0.001),
        loss='sparse_categorical_crossentropy',
        metrics=['accuracy']
    )

    model.summary()

    # Train the custom head
    print(f"Starting training for {EPOCHS} epochs...")
    history = model.fit(
        train_ds,
        epochs=EPOCHS
    )

    # Save the model
    print(f"Saving final model to {MODEL_SAVE_PATH}...")
    model.save(MODEL_SAVE_PATH)
    print("Training process finished successfully!")

if __name__ == '__main__':
    main()
