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

// Main initialization function that wraps all the code
async function initializeAR() {
  try {
    // Wait for face-api.js to load
    await loadFaceAPI();

    // First, create and add the button
    const detailsSlider = document.querySelector('[id^="details-slider"]');
    const startARButton = document.createElement("button");
    startARButton.id = "startAR";
    startARButton.textContent = "Start AR";
    startARButton.style.cssText = `
            padding: 10px 20px;
            font-size: 16px;
            background-color: #007bff;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            transition: background-color 0.3s;
            margin: 10px;
        `;
    detailsSlider.appendChild(startARButton);

    // Create stop button
    const stopARButton = document.createElement("button");
    stopARButton.id = "stopAR";
    stopARButton.textContent = "Stop AR";
    stopARButton.style.cssText = `
        padding: 10px 20px;
        font-size: 16px;
        background-color: #dc3545;
        color: white;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        transition: background-color 0.3s;
        margin: 10px;
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 1000;
        display: none;
    `;
    document.body.appendChild(stopARButton);

    // Create container and video elements
    const container = document.createElement("div");
    container.className = "container";
    container.style.cssText = `
            position: relative;
            min-height: 100vh;
            display: none;
            justify-content: center;
            align-items: center;
        `;

    const video = document.createElement("video");
    video.id = "video";
    video.autoplay = true;
    video.muted = true;
    video.style.cssText = "position: absolute;";

    const canvas = document.createElement("canvas");
    canvas.id = "overlay";
    canvas.style.cssText = "position: absolute; z-index: 1;";

    const loadingElement = document.createElement("div");
    loadingElement.id = "loading";
    loadingElement.className = "loading";
    loadingElement.textContent = "Loading models...";
    loadingElement.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 24px;
            display: none;
        `;

    // Add elements to container
    container.appendChild(video);
    container.appendChild(canvas);
    container.appendChild(loadingElement);

    // Add container to body
    document.body.appendChild(container);

    // Get canvas context
    const ctx = canvas.getContext("2d");

    // Constants
    const MODEL_SOURCE = "https://unpkg.com/@vladmandic/face-api@1.7.1/model/";
    let isInitialized = false;
    let animationFrameId = null;

    // Pre-load glasses image
    const glassesImg = new Image();
    glassesImg.src = "https://cdn-icons-png.flaticon.com/128/7826/7826914.png"; // Replace with your glasses image path

    // Promise to ensure glasses image is loaded
    const glassesLoaded = new Promise((resolve) => {
      glassesImg.onload = resolve;
    });

    // Setup camera stream
    async function setupCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
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

    // Load face-api models
    async function loadModels() {
      try {
        loadingElement.style.display = "block";
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_SOURCE),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_SOURCE),
        ]);
        loadingElement.style.display = "none";
      } catch (error) {
        console.error("Model loading failed:", error);
        loadingElement.textContent = "Error loading models";
        throw error;
      }
    }

    // Draw glasses on the canvas
    function drawGlasses(leftEye, rightEye) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const eyeDistance = Math.abs(leftEye[0].x - rightEye[3].x);
      const eyeCenterX = (leftEye[0].x + rightEye[3].x) / 2;
      const eyeCenterY = (leftEye[0].y + rightEye[3].y) / 2;

      const glassesWidth = eyeDistance * 2.5;
      const glassesHeight = glassesWidth * 0.4;

      ctx.drawImage(
        glassesImg,
        eyeCenterX - glassesWidth / 2,
        eyeCenterY - glassesHeight / 2,
        glassesWidth,
        glassesHeight
      );
    }

    // Main detection loop
    async function detectFace() {
      if (!isInitialized) return;

      try {
        const detections = await faceapi
          .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks();

        if (detections) {
          const landmarks = detections.landmarks;
          const leftEye = landmarks.getLeftEye();
          const rightEye = landmarks.getRightEye();
          drawGlasses(leftEye, rightEye);
        }
      } catch (error) {
        console.error("Face detection error:", error);
      }

      animationFrameId = requestAnimationFrame(detectFace);
    }

    // Initialize the application
    async function initialize() {
      try {
        await loadModels();
        await setupCamera();
        await glassesLoaded;

        isInitialized = true;
        detectFace();
      } catch (error) {
        console.error("Initialization failed:", error);
        loadingElement.textContent = "Error initializing application";
      }
    }

    // Cleanup function
    function cleanup() {
      isInitialized = false;
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      if (video.srcObject) {
        video.srcObject.getTracks().forEach((track) => track.stop());
      }
      // Reset UI
      container.style.display = "none";
      startARButton.style.display = "block";
      stopARButton.style.display = "none";
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    // Add button click event listener
    startARButton.addEventListener("click", async () => {
      container.style.display = "flex";
      startARButton.style.display = "none";
      stopARButton.style.display = "block";
      await initialize();
    });

    // Add stop button click event listener
    stopARButton.addEventListener("click", () => {
      cleanup();
    });

    // Add cleanup event listener
    window.addEventListener("beforeunload", cleanup);

    // Error handling for video
    video.addEventListener("error", (error) => {
      console.error("Video error:", error);
      loadingElement.textContent = "Error with video stream";
    });
  } catch (error) {
    console.error("Failed to initialize AR:", error);
  }
}

// Start the initialization
initializeAR();
