// --- Da'ira Recycling App Frontend JavaScript (Arabic RTL) ---

// State Variables
let currentMode = 'camera'; // 'camera' or 'upload'
let stream = null;
let uploadedBase64 = null;
let currentUser = null; // stores { name, email, points, history }
let lastScanResult = null; // stores the active prediction metadata

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

const badgeRecyclable = document.getElementById('badge-recyclable');
const resultLabel = document.getElementById('result-label');
const resultCategory = document.getElementById('result-category');
const confidencePercentage = document.getElementById('confidence-percentage');
const confidenceFill = document.getElementById('confidence-fill');
const resultDescription = document.getElementById('result-description');
const resultSavings = document.getElementById('result-savings');

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    // Check user auth status on startup
    checkAuthStatus();
    
    // Start camera stream on startup
    initCamera();
    
    // Bind file selection changes
    fileInput.addEventListener('change', handleFileSelect);
    
    // Drag & Drop event bindings
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

    // Capture button
    btnCapture.addEventListener('click', captureAndClassify);
    
    // File upload classify button
    btnUploadClassify.addEventListener('click', classifyUploadedImage);

    // Form Event Listeners
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('register-form').addEventListener('submit', handleRegister);
    document.getElementById('btn-confirm-drop').addEventListener('click', confirmDropAndAddPoints);
});

// --- Camera Management ---
async function initCamera() {
    cameraLoading.classList.remove('hidden');
    cameraFallback.classList.add('hidden');
    btnCapture.disabled = true;

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
            btnCapture.disabled = false;
        };
    } catch (err) {
        console.error("Camera access error:", err);
        cameraLoading.classList.add('hidden');
        cameraFallback.classList.remove('hidden');
        btnCapture.disabled = true;
    }
}

// Ensure proper resource cleanup
function stopCamera() {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
    }
    webcam.srcObject = null;
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
        const response = await fetch('/predict', {
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
    
    if (data.class === 'general_trash' || data.label === 'نفايات عامة / غير مدعومة') {
        resultLabel.innerText = "غير قابلة للتدوير ❌ - ممنوع رميها في هذه السلة!";
        resultLabel.style.color = "#ef4444";
        resultLabel.style.fontWeight = "bold";
        lastScanResult = null;
    } else {
        resultLabel.innerText = `النتيجة: ${data.label} - الدقة: ${confidencePct}%`;
        resultLabel.style.color = "#10b981";
        resultLabel.style.fontWeight = "normal";
        // Save scan metadata for points claim
        lastScanResult = data;
    }
    
    // Hide unused elements to match strict text requirements
    badgeRecyclable.style.display = 'none';
    resultCategory.style.display = 'none';
    document.querySelector('.confidence-section').style.display = 'none';
    
    resultDescription.innerText = data.description;
    resultSavings.innerText = data.savings;
    
    // Highlight sidebar color depending on category
    const sidebarInfo = document.querySelector('.info-description');
    if (sidebarInfo) {
        sidebarInfo.style.borderRightColor = data.color;
    }
    
    // Update Auth dependent action buttons (Confirm Drop vs Login Prompt)
    updateUIForUser(!!currentUser);
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
    updateUIForUser(!!currentUser);
    
    if (currentMode === 'upload') {
        resetUpload();
    }
}

// --- Authentication Systems ---
async function checkAuthStatus() {
    try {
        const response = await fetch('/user-profile');
        const data = await response.json();
        if (data.success) {
            currentUser = data.user;
            updateUIForUser(true);
            loadRewards();
        } else {
            currentUser = null;
            updateUIForUser(false);
        }
    } catch (err) {
        console.error("Auth status check failed:", err);
        currentUser = null;
        updateUIForUser(false);
    }
}

function updateUIForUser(isLoggedIn) {
    const guestControls = document.getElementById('guest-controls');
    const userControls = document.getElementById('user-controls');
    const authenticatedSection = document.getElementById('authenticated-section');
    const confirmDropContainer = document.getElementById('confirm-drop-container');
    const loginPromptContainer = document.getElementById('login-prompt-container');
    
    if (isLoggedIn && currentUser) {
        guestControls.classList.add('hidden');
        userControls.classList.remove('hidden');
        authenticatedSection.classList.remove('hidden');
        
        document.getElementById('username-display').innerText = currentUser.name;
        document.getElementById('points-display').innerText = currentUser.points;
        document.getElementById('dashboard-points').innerText = currentUser.points;
        
        // Show confirm drop buttons if scan results are active and recyclable
        if (lastScanResult && lastScanResult.recyclable) {
            confirmDropContainer.classList.remove('hidden');
            loginPromptContainer.classList.add('hidden');
        } else {
            confirmDropContainer.classList.add('hidden');
            loginPromptContainer.classList.add('hidden');
        }
        
        renderHistory(currentUser.history);
    } else {
        guestControls.classList.remove('hidden');
        userControls.classList.add('hidden');
        authenticatedSection.classList.add('hidden');
        
        confirmDropContainer.classList.add('hidden');
        if (lastScanResult && lastScanResult.recyclable) {
            loginPromptContainer.classList.remove('hidden');
        } else {
            loginPromptContainer.classList.add('hidden');
        }
    }
}

function renderHistory(history) {
    const tbody = document.getElementById('history-tbody');
    if (!history || history.length === 0) {
        tbody.innerHTML = `<tr><td colspan="3" class="text-center">لا توجد عمليات مسجلة بعد.</td></tr>`;
        return;
    }
    
    tbody.innerHTML = history.map(t => `
        <tr>
            <td>${t.material}</td>
            <td style="color: var(--color-green); font-weight: bold;">+${t.points}</td>
            <td style="color: var(--text-secondary);">${t.timestamp}</td>
        </tr>
    `).join('');
}

// --- Auth Submit Handlers ---
async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const errorDiv = document.getElementById('login-error');
    
    errorDiv.classList.add('hidden');
    
    try {
        const response = await fetch('/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await response.json();
        
        if (data.success) {
            closeModal('login-modal');
            await checkAuthStatus();
        } else {
            errorDiv.innerText = data.error || "خطأ في البريد الإلكتروني أو كلمة المرور.";
            errorDiv.classList.remove('hidden');
        }
    } catch (err) {
        errorDiv.innerText = "خطأ في الاتصال بالخادم.";
        errorDiv.classList.remove('hidden');
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const errorDiv = document.getElementById('register-error');
    
    errorDiv.classList.add('hidden');
    
    try {
        const response = await fetch('/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });
        const data = await response.json();
        
        if (data.success) {
            closeModal('register-modal');
            await checkAuthStatus();
        } else {
            errorDiv.innerText = data.error || "فشل التسجيل. يرجى التحقق من المدخلات.";
            errorDiv.classList.remove('hidden');
        }
    } catch (err) {
        errorDiv.innerText = "خطأ في الاتصال بالخادم.";
        errorDiv.classList.remove('hidden');
    }
}

async function handleLogout() {
    try {
        await fetch('/logout', { method: 'POST' });
        currentUser = null;
        updateUIForUser(false);
        resetResults();
    } catch (err) {
        console.error("Logout failed:", err);
    }
}

// --- Points Engine Confirmation ---
async function confirmDropAndAddPoints() {
    if (!lastScanResult) return;
    
    const btn = document.getElementById('btn-confirm-drop');
    btn.disabled = true;
    
    try {
        const response = await fetch('/add-points', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ class: lastScanResult.class })
        });
        const data = await response.json();
        
        if (data.success) {
            alert(data.message);
            document.getElementById('confirm-drop-container').classList.add('hidden');
            lastScanResult = null; // clear active scan claims
            await checkAuthStatus();
        } else {
            alert(`خطأ: ${data.error}`);
            btn.disabled = false;
        }
    } catch (err) {
        alert("فشل الاتصال بالخادم لتأكيد كسب النقاط.");
        btn.disabled = false;
    }
}

// --- Rewards Store Logic ---
async function loadRewards() {
    try {
        const response = await fetch('/rewards');
        const data = await response.json();
        if (data.success) {
            renderRewards(data.rewards);
        }
    } catch (err) {
        console.error("Failed to load rewards:", err);
    }
}

function renderRewards(rewards) {
    const listContainer = document.getElementById('rewards-list');
    if (!rewards || rewards.length === 0) {
        listContainer.innerHTML = `<p class="text-center text-muted">لا تتوفر مكافآت حالياً في المتجر.</p>`;
        return;
    }
    
    listContainer.innerHTML = rewards.map(r => `
        <div class="reward-item-card">
            <div class="reward-info-side">
                <span class="reward-name">${r.name}</span>
                <span class="reward-desc">${r.description || ''}</span>
            </div>
            <div class="reward-action-side">
                <span class="reward-cost">${r.points_cost} نقطة</span>
                <button class="btn btn-primary btn-sm" onclick="redeemReward(${r.id})">استبدال</button>
            </div>
        </div>
    `).join('');
}

async function redeemReward(rewardId) {
    try {
        const response = await fetch('/redeem-reward', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reward_id: rewardId })
        });
        const data = await response.json();
        
        if (data.success) {
            // Render Coupon details and pop modal
            document.getElementById('coupon-display').innerText = data.coupon_code;
            openModal('coupon-modal');
            await checkAuthStatus();
        } else {
            alert(`خطأ: ${data.error}`);
        }
    } catch (err) {
        alert("حدث خطأ أثناء الاتصال بالخادم لاستبدال المكافأة.");
    }
}

// --- Modal Helper Functions ---
function openModal(id) {
    document.getElementById(id).classList.remove('hidden');
}

function closeModal(id) {
    document.getElementById(id).classList.add('hidden');
    // Clear forms inside modal
    if (id === 'login-modal') {
        document.getElementById('login-error').classList.add('hidden');
        document.getElementById('login-form').reset();
    } else if (id === 'register-modal') {
        document.getElementById('register-error').classList.add('hidden');
        document.getElementById('register-form').reset();
    }
}
