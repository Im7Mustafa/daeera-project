// --- Da'ira Recycling App - Simplified Sandbox Script (Arabic RTL) ---

// State Variables
let currentMode = 'camera'; // 'camera' or 'upload'
let stream = null;
let uploadedBase64 = null;
let lastScanResult = null; // stores the active prediction metadata
let userPoints = parseInt(localStorage.getItem('daeera_points')) || 0;

// DOM Elements
const webcam = document.getElementById('webcam');
const cameraLoading = document.getElementById('camera-loading');
const cameraFallback = document.getElementById('camera-fallback');
const captureCanvas = document.getElementById('capture-canvas');

const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const previewContainer = document.getElementById('preview-container');
const imagePreview = document.getElementById('image-preview');

const btnCapture = document.getElementById('btn-capture');
const btnUploadClassify = document.getElementById('btn-upload-classify');

const resultsIdle = document.getElementById('results-idle');
const resultsLoading = document.getElementById('results-loading');
const resultsActive = document.getElementById('results-active');

const resultLabel = document.getElementById('result-label');
const resultCategory = document.getElementById('result-category');
const resultDescription = document.getElementById('result-description');
const resultSavings = document.getElementById('result-savings');
const badgeRecyclable = document.getElementById('badge-recyclable');
const confidenceSection = document.querySelector('.confidence-section');
const confidencePercentage = document.getElementById('confidence-percentage');
const confidenceFill = document.getElementById('confidence-fill');

const confirmDropContainer = document.getElementById('confirm-drop-container');
const btnConfirmDrop = document.getElementById('btn-confirm-drop');

// Points Displays
const pointsDisplayNavbar = document.getElementById('points-display-navbar');

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    // Initial UI state setup for points
    updatePointsUI();
    
    // Bind Hero section button to scroll smoothly
    const startScanBtn = document.getElementById('btn-start-scan');
    if (startScanBtn) {
        startScanBtn.addEventListener('click', () => {
            const scannerSec = document.getElementById('scanner-section');
            if (scannerSec) {
                scannerSec.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }

    // Start camera stream on startup
    initCamera();
    
    // Bind file selection changes
    if (fileInput) {
        fileInput.addEventListener('change', handleFileSelect);
    }
    
    // Drag & Drop event bindings for upload mode
    if (dropZone) {
        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, (e) => {
                e.preventDefault();
                dropZone.classList.add('drag-over');
            }, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, (e) => {
                e.preventDefault();
                dropZone.classList.remove('drag-over');
            }, false);
        });

        dropZone.addEventListener('drop', (e) => {
            const dt = e.dataTransfer;
            const files = dt.files;
            if (files.length > 0) {
                fileInput.files = files;
                handleFileSelect({ target: { files: files } });
            }
        });
    }

    // Capture button
    if (btnCapture) {
        btnCapture.addEventListener('click', captureAndClassify);
    }
    
    // File upload classify button
    if (btnUploadClassify) {
        btnUploadClassify.addEventListener('click', classifyUploadedImage);
    }

    // Confirm deposit button
    if (btnConfirmDrop) {
        btnConfirmDrop.addEventListener('click', confirmDropAndAddPoints);
    }
});

// --- Points Counter Management ---
function updatePointsUI() {
    if (pointsDisplayNavbar) {
        pointsDisplayNavbar.innerText = userPoints;
    }
}

function addLocalPoints(points) {
    // 1. Fetch current total points from localStorage (default to 0 if not exists)
    let currentPoints = parseInt(localStorage.getItem('daeera_points')) || 0;
    
    // 2. Add the new points to the retrieved total
    currentPoints += points;
    
    // 3. Save the updated total back to localStorage
    localStorage.setItem('daeera_points', currentPoints);
    
    // 4. Keep the in-memory state variable in sync
    userPoints = currentPoints;
    
    // 5. Update the Navbar Points Counter dynamically
    updatePointsUI();
}

// --- Camera Management ---
async function initCamera() {
    if (!webcam || !cameraLoading) return;
    
    cameraLoading.classList.remove('hidden');
    cameraFallback.classList.add('hidden');
    if (btnCapture) btnCapture.disabled = true;

    // Stop existing stream if any
    stopCamera();

    const constraints = {
        video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: 'environment' // Prefers rear camera on mobile devices
        },
        audio: false
    };

    try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
        webcam.srcObject = stream;
        webcam.onloadedmetadata = () => {
            cameraLoading.classList.add('hidden');
            if (btnCapture) btnCapture.disabled = false;
        };
    } catch (err) {
        console.error("Camera access error:", err);
        cameraLoading.classList.add('hidden');
        cameraFallback.classList.remove('hidden');
        if (btnCapture) btnCapture.disabled = true;
    }
}

// Ensure proper resource cleanup
function stopCamera() {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
    }
    if (webcam) {
        webcam.srcObject = null;
    }
}

// --- Mode Switching ---
function switchMode(mode) {
    if (mode === currentMode) return;
    currentMode = mode;
    
    // Toggle active classes on tab buttons
    document.getElementById('btn-camera-mode').classList.toggle('active', mode === 'camera');
    document.getElementById('btn-upload-mode').classList.toggle('active', mode === 'upload');
    
    // Toggle view panel visibility
    document.getElementById('camera-container').classList.toggle('hidden', mode !== 'camera');
    document.getElementById('upload-container').classList.toggle('hidden', mode !== 'upload');
    
    if (mode === 'camera') {
        initCamera();
    } else {
        stopCamera();
    }
}

// --- Upload Management ---
function handleFileSelect(e) {
    const files = e.target.files;
    if (files.length === 0) return;
    
    const file = files[0];
    
    // Verify file is an image
    if (!file.type.startsWith('image/')) {
        alert("يرجى تحديد ملف صورة صالح.");
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(event) {
        // Show Preview
        imagePreview.src = event.target.result;
        dropZone.classList.add('hidden');
        previewContainer.classList.remove('hidden');
        
        // Save base64 string
        uploadedBase64 = event.target.result;
        btnUploadClassify.disabled = false;
    };
    reader.readAsDataURL(file);
}

function resetUpload() {
    fileInput.value = '';
    uploadedBase64 = null;
    imagePreview.src = '#';
    dropZone.classList.remove('hidden');
    previewContainer.classList.add('hidden');
    btnUploadClassify.disabled = true;
}

// --- Inference Requests & UI Rendering ---
async function captureAndClassify() {
    if (!stream) return;
    
    // Prepare canvas dimensions
    const videoWidth = webcam.videoWidth;
    const videoHeight = webcam.videoHeight;
    captureCanvas.width = videoWidth;
    captureCanvas.height = videoHeight;
    
    // Draw current frame onto canvas
    const ctx = captureCanvas.getContext('2d');
    ctx.drawImage(webcam, 0, 0, videoWidth, videoHeight);
    
    // Convert to Base64 image
    const dataUrl = captureCanvas.toDataURL('image/jpeg', 0.85);
    
    // Send to server
    await sendInferenceRequest(dataUrl);
}

async function classifyUploadedImage() {
    if (!uploadedBase64) return;
    await sendInferenceRequest(uploadedBase64);
}

async function sendInferenceRequest(base64Image) {
    // UI states
    resultsIdle.classList.add('hidden');
    resultsActive.classList.add('hidden');
    resultsLoading.classList.remove('hidden');
    
    try {
        const response = await fetch('/classify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ image: base64Image })
        });
        
        const data = await response.json();
        
        if (data.success) {
            renderResults(data);
        } else {
            showErrorState(data.error || "حدث خطأ أثناء تصنيف الصورة في الخادم.");
        }
    } catch (err) {
        console.error("API Fetch Error:", err);
        showErrorState("تعذر الاتصال بخادم التصنيف الذكي.");
    }
}

function renderResults(data) {
    // Hide Loader
    resultsLoading.classList.add('hidden');
    resultsActive.classList.remove('hidden');
    
    const confidencePct = (data.confidence * 100).toFixed(0);
    
    // Check if item is general trash (non-recyclable)
    if (data.class === 'general_trash' || data.recyclable === false) {
        // Red color, bold, warning message
        resultLabel.innerText = "غير قابلة للتدوير ❌ - ممنوع رميها في هذه السلة!";
        resultLabel.className = "result-title text-red font-bold";
        
        badgeRecyclable.innerText = "غير قابلة للتدوير";
        badgeRecyclable.className = "status-badge badge-danger";
        
        // Hide confidence meter and points claim action
        confidenceSection.classList.add('hidden');
        confirmDropContainer.classList.add('hidden');
        
        lastScanResult = null;
    } else {
        // Friendly green, normal weight, confidence score
        resultLabel.innerText = `النتيجة: ${data.label} - الدقة: ${confidencePct}%`;
        resultLabel.className = "result-title text-green font-normal";
        
        badgeRecyclable.innerText = "قابل لإعادة التدوير";
        badgeRecyclable.className = "status-badge badge-success";
        
        // Show confidence meter
        confidenceSection.classList.remove('hidden');
        confidencePercentage.innerText = `${confidencePct}%`;
        confidenceFill.style.width = `${confidencePct}%`;
        confidenceFill.style.backgroundColor = 'var(--primary)';
        
        // Show confirm drop button to claim points
        confirmDropContainer.classList.remove('hidden');
        btnConfirmDrop.disabled = false;
        
        // Save scan metadata for points claim
        lastScanResult = data;
    }
    
    // Set text descriptions
    resultCategory.innerText = `الفئة: ${data.category}`;
    resultCategory.style.display = 'block';
    resultDescription.innerText = data.description;
    resultSavings.innerText = data.savings;
    
    // Highlight sidebar color depending on category
    const sidebarInfo = document.querySelector('.info-description');
    if (sidebarInfo) {
        sidebarInfo.style.borderRight = `4px solid ${data.color}`;
    }
}

function showErrorState(errorMsg) {
    resultsLoading.classList.add('hidden');
    resultsIdle.classList.remove('hidden');
    alert(`خطأ: ${errorMsg}`);
}

function resetResults() {
    resultsActive.classList.add('hidden');
    resultsIdle.classList.remove('hidden');
    
    lastScanResult = null;
    
    if (currentMode === 'upload') {
        resetUpload();
    }
}

// --- Points Deposit Confirmation ---
function confirmDropAndAddPoints() {
    if (!lastScanResult) return;
    
    const pointsToEarn = lastScanResult.points || 0;
    if (pointsToEarn > 0) {
        addLocalPoints(pointsToEarn);
        alert(`رائع! لقد قمت بإيداع ${lastScanResult.label} بنجاح وحصلت على ${pointsToEarn} نقطة. رصيدك الحالي: ${userPoints} نقطة.`);
    }
    
    // Disable point claiming until next scan
    btnConfirmDrop.disabled = true;
    confirmDropContainer.classList.add('hidden');
    
    // Reset scanner view
    resetResults();
}
