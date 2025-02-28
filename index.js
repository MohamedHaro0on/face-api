// Create and load face-api.js script
function loadFaceAPI() {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://unpkg.com/face-api.js@0.22.2/dist/face-api.min.js";
    script.async = true;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

// Main initialization function
async function initializeAR() {
  try {
    await loadFaceAPI();

    // Create modal elements
    const modal = document.createElement("div");
    modal.className = "ar-modal";
    modal.style.cssText = `
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.8);
      z-index: 1000;
    `;

    const modalContent = document.createElement("div");
    modalContent.className = "modal-content";
    modalContent.style.cssText = `
      position: relative;
      width: 95%;
      max-width: 1280px;
      height: 90%;
      margin: 2% auto;
      background-color: #fff;
      border-radius: 10px;
      padding: 10px;
      display: flex;
      flex-direction: column;
      align-items: center;
      overflow: hidden;
    `;

    // Create start button
    const detailsSlider = document.querySelector('[id^="details-slider"]');
    const startARButton = document.createElement("button");
    startARButton.id = "startAR";
    startARButton.textContent = "جربها عليك";
    startARButton.style.cssText = `
      padding: 10px 20px;
      font-size: 16px;
      background-color: #007bff;
      color: white;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      margin: 10px;
    `;
    detailsSlider.appendChild(startARButton);

    // Create stop button
    const stopARButton = document.createElement("button");
    stopARButton.id = "stopAR";
    stopARButton.textContent = "اغلق";
    stopARButton.style.cssText = `
      padding: 10px 20px;
      font-size: 16px;
      background-color: #dc3545;
      color: white;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      margin: 10px;
      position: absolute;
      top: 20px;
      right: 20px;
      z-index: 1001;
    `;

    // Create container and video elements
    const container = document.createElement("div");
    container.className = "container";
    container.style.cssText = `
      position: relative;
      width: 100%;
      height: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
    `;

    const video = document.createElement("video");
    video.id = "video";
    video.autoplay = true;
    video.muted = true;
    video.playsInline = true;
    video.style.cssText = `
      width: 100%;
      height: 100%;
      object-fit: contain;
    `;

    const canvas = document.createElement("canvas");
    canvas.id = "overlay";
    canvas.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
    `;

    const loadingElement = document.createElement("div");
    loadingElement.id = "loading";
    loadingElement.textContent = "Loading models...";
    loadingElement.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 24px;
      display: none;
      color: #007bff;
    `;

    // Add elements to DOM
    container.appendChild(video);
    container.appendChild(canvas);
    container.appendChild(loadingElement);
    modalContent.appendChild(stopARButton);
    modalContent.appendChild(container);
    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    // Initialize variables
    const ctx = canvas.getContext("2d");
    const MODEL_SOURCE = "https://unpkg.com/@vladmandic/face-api@1.7.1/model/";
    let isInitialized = false;
    let animationFrameId = null;
    let lastDrawnFrame = 0;
    const FRAME_RATE = 30; // Limit to 30 FPS
    const frameInterval = 1000 / FRAME_RATE;

    // Pre-load glasses image
    const glassesImg = new Image();
    glassesImg.src = "https://cdn-icons-png.flaticon.com/128/7826/7826914.png";
    await new Promise((resolve) => {
      glassesImg.onload = resolve;
    });

    // Setup camera
    async function setupCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        });
        video.srcObject = stream;
        return new Promise((resolve) => {
          video.onloadedmetadata = () => {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            resolve();
          };
        });
      } catch (error) {
        console.error("Camera access failed:", error);
        throw error;
      }
    }

    // Load models
    async function loadModels() {
      loadingElement.style.display = "block";
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_SOURCE),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_SOURCE),
        ]);
      } finally {
        loadingElement.style.display = "none";
      }
    }

    // Draw glasses
    function drawGlasses(leftEye, rightEye) {
      const eyeDistance = Math.abs(leftEye[0].x - rightEye[3].x);
      const eyeCenterX = (leftEye[0].x + rightEye[3].x) / 2;
      const eyeCenterY = (leftEye[0].y + rightEye[3].y) / 2;
      const glassesWidth = eyeDistance * 2.5;
      const glassesHeight = glassesWidth * 0.4;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(
        glassesImg,
        eyeCenterX - glassesWidth / 2,
        eyeCenterY - glassesHeight / 2,
        glassesWidth,
        glassesHeight
      );
    }

    // Detect face
    async function detectFace() {
      if (!isInitialized) return;

      const now = performance.now();
      if (now - lastDrawnFrame < frameInterval) {
        animationFrameId = requestAnimationFrame(detectFace);
        return;
      }

      try {
        const detections = await faceapi
          .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks();

        if (detections) {
          const landmarks = detections.landmarks;
          drawGlasses(landmarks.getLeftEye(), landmarks.getRightEye());
        }

        lastDrawnFrame = now;
      } catch (error) {
        console.error("Face detection error:", error);
      }

      animationFrameId = requestAnimationFrame(detectFace);
    }

    // Initialize
    async function initialize() {
      try {
        await Promise.all([loadModels(), setupCamera()]);
        isInitialized = true;
        detectFace();
      } catch (error) {
        console.error("Initialization failed:", error);
        loadingElement.textContent = "Error initializing application";
      }
    }

    // Cleanup
    function cleanup() {
      isInitialized = false;
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      if (video.srcObject) {
        video.srcObject.getTracks().forEach((track) => track.stop());
      }
      modal.style.display = "none";
      startARButton.style.display = "block";
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    // Event listeners
    startARButton.addEventListener("click", async () => {
      modal.style.display = "block";
      startARButton.style.display = "none";
      await initialize();
    });

    stopARButton.addEventListener("click", cleanup);
    modal.addEventListener("click", (e) => {
      if (e.target === modal) cleanup();
    });
    window.addEventListener("beforeunload", cleanup);
  } catch (error) {
    console.error("Failed to initialize AR:", error);
  }
}

// Start initialization
initializeAR();
