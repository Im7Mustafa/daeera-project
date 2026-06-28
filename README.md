# دائرة • Da'ira Recycling Classifier

Da'ira (meaning *Circle* or *Cycle* in Arabic) is a web application designed to help promote a circular economy by identifying recyclable containers (cans, bottles, boxes) locally on the server using deep learning.

It features a Flask backend that runs local image classification with **TensorFlow / MobileNetV2**, and a premium camera-enabled glassmorphic web frontend built with vanilla HTML/CSS/JS.

---

## Project Structure

```
daeera-project/
├── app.py                  # Flask backend (Routing, Image preprocessing, Local inference)
├── requirements.txt        # Backend dependencies
├── README.md               # Setup and usage instructions
├── models/
│   └── daira_mobilenetv2.h5 # (Optional) Place your custom fine-tuned model here
├── templates/
│   └── index.html          # Camera scanner & results UI (HTML5)
└── static/
    ├── css/
    │   └── style.css       # Premium glassmorphic styling, animations, responsiveness
    └── js/
        └── app.js          # Device camera feed, drag-and-drop uploads, fetch API payload handler
```

---

## Features

- **NO External APIs:** All image classification runs locally on the host machine.
- **Smart Model Fallback:**
  - If a custom fine-tuned model is found at `models/daira_mobilenetv2.h5`, the server loads and runs inference using your custom categories.
  - If no custom model is found, the server automatically downloads/loads the official MobileNetV2 model pre-trained on ImageNet. A heuristic matching script translates standard object labels (e.g., `tin_can`, `pop_bottle`, `water_bottle`) to the corresponding recycling rules, so the app remains fully functional out of the box.
- **Device Camera Scanner:** Captures images directly from phone/tablet cameras or webcams via WebRTC.
- **File Upload Fallback:** Supports drag-and-drop uploads and image browser files.
- **Glassmorphic UI Design:** Translucent panels, leaf and recycling accent glows, circular progress indicators, and custom styling for desktop/mobile views.

---

## Setup & Running the Application

### 1. Install Python Dependencies
Open your command prompt or terminal in the project directory and run:
```bash
pip install -r requirements.txt
```

### 2. (Optional) Provide a Custom Fine-tuned Model
To load a custom-trained model:
1. Train a model (such as a MobileNetV2) on your specific dataset of containers.
2. Save the model in Keras H5 format named `daira_mobilenetv2.h5`.
3. Move the file into the `models/` directory.
4. *Note:* The backend uses a default configuration of 4 classes for custom models: `['Aluminum Can', 'Plastic Bottle', 'Glass Bottle', 'Cardboard Box']`. You can customize this class index mapping in `app.py` under `CUSTOM_CLASSES`.

### 3. Run the Flask Server
Start the local server by executing:
```bash
python app.py
```

### 4. Access the Application
Open your web browser and navigate to:
```
http://127.0.0.1:5000
```
- Grant camera permission when prompted, or upload an image file using the drop zone.
- Click **Capture & Classify** to see the results.
