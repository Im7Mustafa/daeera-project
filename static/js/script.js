// --- Da'ira Recycling App - Simplified Sandbox Script (Arabic RTL) ---

// State Variables
let currentMode = 'camera'; // 'camera' or 'upload'
let stream = null;
let uploadedBase64 = null;
let lastScanResult = null; // stores the active prediction metadata
let userPoints = parseInt(localStorage.getItem('daeera_points')) || 0;
let currentLanguage = localStorage.getItem('daeera_lang') || 'ar';
let currentTheme = localStorage.getItem('daeera_theme') || 'light';

// Localization Dictionary
const i18n = {
    ar: {
        "logo-title": "دائرة",
        "logo-subtitle": "Da'ira",
        "points-label": "نقاطك: ",
        "points-unit": "نقطة",
        "settings-title": "الإعدادات",
        "lang-section-title": "اللغة",
        "theme-toggle-label": "المظهر الداكن",
        "hero-badge": '<i class="fa-solid fa-recycle"></i> بيئة مستدامة ومستقبل أنظف',
        "hero-title": 'أهلاً بك في <span>دائرة</span>',
        "hero-subtitle": 'أغلق الدائرة وساهم في حماية البيئة. نقوم بتصنيف النفايات باستخدام الذكاء الاصطناعي لمساعدتك على التدوير بشكل صحيح ومكافأتك بالنقاط.',
        "btn-start-scan": 'ابدأ الفرز <i class="fa-solid fa-arrow-down-long"></i>',
        "scanner-header": '<i class="fa-solid fa-camera-retro"></i> ماسح الذكاء الاصطناعي',
        "scanner-subtitle": 'التقط صورة للنفايات أو ارفعها لتصنيفها فوراً',
        "tab-camera": '<i class="fa-solid fa-video"></i> الكاميرا الحية',
        "tab-upload": '<i class="fa-solid fa-file-arrow-up"></i> رفع صورة',
        "camera-loading": 'جاري تشغيل الكاميرا...',
        "camera-fallback-text": 'صلاحية الوصول إلى الكاميرا مرفوضة أو غير متوفرة',
        "btn-fallback-upload": 'التحويل إلى وضع الرفع',
        "btn-capture": '<i class="fa-solid fa-circle-dot"></i> التقاط وتصنيف النفايات',
        "drop-title": 'اسحب وأسقط الصورة هنا',
        "drop-subtitle": 'يدعم صيغ JPG، PNG أو WEBP (بحد أقصى 5 ميجابايت)',
        "drop-divider": 'أو',
        "btn-browse": 'تصفح الملفات',
        "btn-upload-classify": '<i class="fa-solid fa-magnifying-glass"></i> تصنيف العنصر المرفوع',
        "results-idle-title": 'جاهز للتصنيف',
        "results-idle-desc": 'وجه الكاميرا نحو المادة وانقر على التقاط، أو ارفع صورة للتحقق من قابليتها لإعادة التدوير وكسب النقاط.',
        "results-loading-title": 'جاري تحليل العنصر...',
        "results-loading-desc": 'تشغيل نموذج تصنيف Da\'ira الذكي لاستخراج النتائج البيئية...',
        "confidence-label": 'دقة التصنيف للنموذج',
        "info-desc-title": '<i class="fa-solid fa-circle-info"></i> إرشادات التخلص البيئي',
        "info-savings-title": '<i class="fa-solid fa-seedling"></i> حقائق الأثر البيئي',
        "confirm-drop-alert": 'تأكيد الإيداع في السلة لكسب النقاط المحلية.',
        "btn-confirm-drop": '<i class="fa-solid fa-square-check"></i> تأكيد إيداع النفايات',
        "btn-scan-another": '<i class="fa-solid fa-rotate-left"></i> تصنيف عنصر آخر',
        
        // Image Alt Texts
        "img-preview-alt": "معاينة الصورة المرفوعة",
        
        // Alerts & Prompts
        "alert-valid-image": "يرجى تحديد ملف صورة صالح.",
        "alert-server-error": "حدث خطأ أثناء تصنيف الصورة في الخادم.",
        "alert-conn-error": "تعذر الاتصال بخادم التصنيف الذكي.",
        "alert-error-prefix": "خطأ: ",
        "camera-starting": "جاري تشغيل الكاميرا...",
        
        // Dynamic elements
        "non-recyclable-title": "غير قابلة للتدوير ❌ - ممنوع رميها في هذه السلة!",
        "non-recyclable-badge": "غير قابلة للتدوير",
        "recyclable-title-prefix": "النتيجة: ",
        "recyclable-title-middle": " - الدقة: ",
        "recyclable-badge": "قابل لإعادة التدوير",
        "category-prefix": "الفئة: ",
        
        "claim-success-p1": "رائع! لقد قمت بإيداع ",
        "claim-success-p2": " بنجاح وحصلت على ",
        "claim-success-p3": " نقطة. رصيدك الحالي: ",
        "claim-success-p4": " نقطة."
    },
    en: {
        "logo-title": "Da'ira",
        "logo-subtitle": "دائرة",
        "points-label": "Your Points: ",
        "points-unit": "Points",
        "settings-title": "Settings",
        "lang-section-title": "Language",
        "theme-toggle-label": "Dark Mode",
        "hero-badge": '<i class="fa-solid fa-recycle"></i> Sustainable Environment & Cleaner Future',
        "hero-title": 'Welcome to <span>Da\'ira</span>',
        "hero-subtitle": 'Close the loop and protect the environment. We classify waste using AI to help you recycle properly and reward you with points.',
        "btn-start-scan": 'Start Scanning <i class="fa-solid fa-arrow-down-long"></i>',
        "scanner-header": '<i class="fa-solid fa-camera-retro"></i> AI Scanner',
        "scanner-subtitle": 'Capture a photo of the waste or upload it to classify instantly',
        "tab-camera": '<i class="fa-solid fa-video"></i> Live Camera',
        "tab-upload": '<i class="fa-solid fa-file-arrow-up"></i> Upload Image',
        "camera-loading": 'Starting camera...',
        "camera-fallback-text": 'Camera access denied or unavailable',
        "btn-fallback-upload": 'Switch to Upload Mode',
        "btn-capture": '<i class="fa-solid fa-circle-dot"></i> Capture and Classify Waste',
        "drop-title": 'Drag and drop image here',
        "drop-subtitle": 'Supports JPG, PNG or WEBP (Max 5MB)',
        "drop-divider": 'or',
        "btn-browse": 'Browse Files',
        "btn-upload-classify": '<i class="fa-solid fa-magnifying-glass"></i> Classify Uploaded Item',
        "results-idle-title": 'Ready to Classify',
        "results-idle-desc": 'Point the camera at the item and click capture, or upload an image to verify its recyclability and earn points.',
        "results-loading-title": 'Analyzing item...',
        "results-loading-desc": 'Running Da\'ira smart classification model to extract environmental results...',
        "confidence-label": 'Model Classification Accuracy',
        "info-desc-title": '<i class="fa-solid fa-circle-info"></i> Environmental Disposal Guidelines',
        "info-savings-title": '<i class="fa-solid fa-seedling"></i> Environmental Impact Facts',
        "confirm-drop-alert": 'Confirm deposit in the bin to earn local points.',
        "btn-confirm-drop": '<i class="fa-solid fa-square-check"></i> Confirm Waste Deposit',
        "btn-scan-another": '<i class="fa-solid fa-rotate-left"></i> Classify Another Item',
        
        // Image Alt Texts
        "img-preview-alt": "Uploaded image preview",
        
        // Alerts & Prompts
        "alert-valid-image": "Please select a valid image file.",
        "alert-server-error": "An error occurred while classifying the image on the server.",
        "alert-conn-error": "Could not connect to the smart classification server.",
        "alert-error-prefix": "Error: ",
        "camera-starting": "Starting camera...",
        
        // Dynamic elements
        "non-recyclable-title": "Non-recyclable ❌ - Do not throw in this bin!",
        "non-recyclable-badge": "Non-recyclable",
        "recyclable-title-prefix": "Result: ",
        "recyclable-title-middle": " - Confidence: ",
        "recyclable-badge": "Recyclable",
        "category-prefix": "Category: ",
        
        "claim-success-p1": "Great! You have successfully deposited ",
        "claim-success-p2": " and earned ",
        "claim-success-p3": " points. Your current balance: ",
        "claim-success-p4": " points."
    }
};

// Custom Class Dynamic Translations mapping
const classTranslations = {
    en: {
        'metal_can': {
            'name': 'Metal Can',
            'category': 'Metals',
            'description': 'Aluminum and iron cans are 100% recyclable and save a lot of energy when remanufactured.',
            'savings': 'Recycling metals saves about 95% of the energy required to produce them from raw materials.'
        },
        'plastic_bottle': {
            'name': 'Plastic Bottle',
            'category': 'Plastic',
            'description': 'Plastic bottles are recyclable. Please make sure to empty and rinse them with water before placing them in the bin.',
            'savings': 'Recycling plastic saves enough energy to power a laptop for more than 25 hours.'
        },
        'glass_bottle': {
            'name': 'Glass Bottle',
            'category': 'Glass',
            'description': 'Glass is 100% recyclable and can be recycled endlessly without losing its purity or quality.',
            'savings': 'Recycling glass reduces air pollution by 20% and water pollution by 50% compared to new glass.'
        },
        'paper_waste': {
            'name': 'Paper & Cardboard',
            'category': 'Paper',
            'description': 'Clean paper and cardboard are recyclable. Please ensure they are not contaminated with liquids or food waste.',
            'savings': 'Recycling one ton of paper saves 17 trees and about 7,000 gallons of water.'
        },
        'general_trash': {
            'name': 'General Trash / Unsupported',
            'category': 'Non-recyclable',
            'description': 'This item is not recyclable in this bin. Please dispose of it in the general trash bin.',
            'savings': 'Proper waste disposal protects the environment from pollution.'
        }
    }
};

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
    // Initialize Theme and Language state
    initThemeAndLanguage();

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

// --- Theme & Bilingual Initialization and Setup ---
function initThemeAndLanguage() {
    // 1. Theme configuration
    const themeCheckbox = document.getElementById('theme-dark-checkbox');
    if (themeCheckbox) {
        if (currentTheme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
            themeCheckbox.checked = true;
        } else {
            document.documentElement.removeAttribute('data-theme');
            themeCheckbox.checked = false;
        }
        
        themeCheckbox.addEventListener('change', () => {
            if (themeCheckbox.checked) {
                document.documentElement.setAttribute('data-theme', 'dark');
                localStorage.setItem('daeera_theme', 'dark');
                currentTheme = 'dark';
            } else {
                document.documentElement.removeAttribute('data-theme');
                localStorage.setItem('daeera_theme', 'light');
                currentTheme = 'light';
            }
        });
    }

    // 2. Settings dropdown event triggers
    const settingsToggleBtn = document.getElementById('settings-toggle-btn');
    const settingsDropdown = document.getElementById('settings-dropdown');
    if (settingsToggleBtn && settingsDropdown) {
        settingsToggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            settingsDropdown.classList.toggle('hidden');
        });
        
        document.addEventListener('click', (e) => {
            if (!settingsDropdown.contains(e.target) && e.target !== settingsToggleBtn && !settingsToggleBtn.contains(e.target)) {
                settingsDropdown.classList.add('hidden');
            }
        });
    }

    // 3. Language list selection triggers
    const langArItem = document.getElementById('lang-ar-item');
    const langEnItem = document.getElementById('lang-en-item');
    
    if (langArItem) {
        langArItem.addEventListener('click', () => setLanguage('ar'));
    }
    if (langEnItem) {
        langEnItem.addEventListener('click', () => setLanguage('en'));
    }
    
    // Initialize standard state
    applyLanguage(currentLanguage);
}

function setLanguage(lang) {
    if (lang === currentLanguage) return;
    currentLanguage = lang;
    localStorage.setItem('daeera_lang', lang);
    applyLanguage(lang);
    
    // Re-render scanning results instantly to translate UI dynamically
    if (lastScanResult) {
        renderResults(lastScanResult);
    }
}

function applyLanguage(lang) {
    if (lang === 'en') {
        document.documentElement.setAttribute('dir', 'ltr');
        document.documentElement.setAttribute('lang', 'en');
    } else {
        document.documentElement.setAttribute('dir', 'rtl');
        document.documentElement.setAttribute('lang', 'ar');
    }
    
    const langArItem = document.getElementById('lang-ar-item');
    const langEnItem = document.getElementById('lang-en-item');
    if (langArItem && langEnItem) {
        langArItem.classList.toggle('active', lang === 'ar');
        langEnItem.classList.toggle('active', lang === 'en');
    }
    
    // Replace text of marked elements
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (i18n[lang] && i18n[lang][key]) {
            const val = i18n[lang][key];
            if (val.includes('<')) {
                el.innerHTML = val;
            } else {
                el.innerText = val;
            }
        }
    });

    // Replace alt values
    document.querySelectorAll('[data-i18n-alt]').forEach(el => {
        const key = el.getAttribute('data-i18n-alt');
        if (i18n[lang] && i18n[lang][key]) {
            el.setAttribute('alt', i18n[lang][key]);
        }
    });
}

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
        alert(i18n[currentLanguage]["alert-valid-image"]);
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
            const errorMsg = currentLanguage === 'en' ? "An error occurred while classifying the image on the server." : "حدث خطأ أثناء تصنيف الصورة في الخادم.";
            showErrorState(data.error || errorMsg);
        }
    } catch (err) {
        console.error("API Fetch Error:", err);
        const errorMsg = currentLanguage === 'en' ? "Could not connect to the smart classification server." : "تعذر الاتصال بخادم التصنيف الذكي.";
        showErrorState(errorMsg);
    }
}

function renderResults(data) {
    if (!data) return;

    // Hide Loader
    resultsLoading.classList.add('hidden');
    resultsActive.classList.remove('hidden');
    
    const confidencePct = (data.confidence * 100).toFixed(0);
    
    // Translate data values if English is set
    let label = data.label;
    let category = data.category;
    let description = data.description;
    let savings = data.savings;
    
    if (currentLanguage === 'en' && classTranslations.en[data.class]) {
        label = classTranslations.en[data.class].name;
        category = classTranslations.en[data.class].category;
        description = classTranslations.en[data.class].description;
        savings = classTranslations.en[data.class].savings;
    }
    
    // Check if item is general trash (non-recyclable)
    if (data.class === 'general_trash' || data.recyclable === false) {
        // Red color, bold, warning message
        resultLabel.innerText = i18n[currentLanguage]["non-recyclable-title"];
        resultLabel.className = "result-title text-red font-bold";
        
        badgeRecyclable.innerText = i18n[currentLanguage]["non-recyclable-badge"];
        badgeRecyclable.className = "status-badge badge-danger";
        
        // Hide confidence meter and points claim action
        confidenceSection.classList.add('hidden');
        confirmDropContainer.classList.add('hidden');
        
        lastScanResult = null;
    } else {
        // Friendly green, normal weight, confidence score
        const titlePrefix = i18n[currentLanguage]["recyclable-title-prefix"];
        const titleMiddle = i18n[currentLanguage]["recyclable-title-middle"];
        resultLabel.innerText = `${titlePrefix}${label}${titleMiddle}${confidencePct}%`;
        resultLabel.className = "result-title text-green font-normal";
        
        badgeRecyclable.innerText = i18n[currentLanguage]["recyclable-badge"];
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
    const catPrefix = i18n[currentLanguage]["category-prefix"];
    resultCategory.innerText = `${catPrefix}${category}`;
    resultCategory.style.display = 'block';
    resultDescription.innerText = description;
    resultSavings.innerText = savings;
    
    // Highlight sidebar color depending on category and layout direction
    const sidebarInfo = document.querySelector('.info-description');
    if (sidebarInfo) {
        if (currentLanguage === 'en') {
            sidebarInfo.style.borderLeft = `4px solid ${data.color}`;
            sidebarInfo.style.borderRight = 'none';
        } else {
            sidebarInfo.style.borderRight = `4px solid ${data.color}`;
            sidebarInfo.style.borderLeft = 'none';
        }
    }
}

function showErrorState(errorMsg) {
    resultsLoading.classList.add('hidden');
    resultsIdle.classList.remove('hidden');
    const prefix = i18n[currentLanguage]["alert-error-prefix"];
    alert(`${prefix}${errorMsg}`);
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
        
        let label = lastScanResult.label;
        if (currentLanguage === 'en' && classTranslations.en[lastScanResult.class]) {
            label = classTranslations.en[lastScanResult.class].name;
        }
        
        const msg = `${i18n[currentLanguage]["claim-success-p1"]}${label}${i18n[currentLanguage]["claim-success-p2"]}${pointsToEarn}${i18n[currentLanguage]["claim-success-p3"]}${userPoints}${i18n[currentLanguage]["claim-success-p4"]}`;
        alert(msg);
    }
    
    // Disable point claiming until next scan
    btnConfirmDrop.disabled = true;
    confirmDropContainer.classList.add('hidden');
    
    // Reset scanner view
    resetResults();
}
