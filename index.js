// Create and load face-api.js script
// Function to check if URL contains sunglasses or eyeglasses
function shouldShowARButton() {
  const currentUrl = window.location.href.toLowerCase();
  return currentUrl.includes("sunglasses") || currentUrl.includes("eyeglasses");
}

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

// Function to wait for Swiper initialization
function waitForSwiper() {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const maxAttempts = 20;
    const interval = 500;

    const checkSwiper = setInterval(() => {
      const swiperContainer = document.querySelector(
        ".swiper.s-slider-thumbs-container.swiper-initialized.swiper-horizontal.swiper-pointer-events.swiper-rtl.swiper-watch-progress.swiper-backface-hidden.swiper-thumbs"
      );

      if (swiperContainer) {
        const swiperWrapper = swiperContainer.querySelector(
          '[id^="swiper-wrapper-"]'
        );
        if (swiperWrapper) {
          clearInterval(checkSwiper);
          setTimeout(() => {
            const images = swiperWrapper.querySelectorAll("div img");
            if (images.length > 0) {
              console.log("Swiper and images found successfully");
              resolve(Array.from(images));
            } else {
              reject(new Error("Swiper found but no images"));
            }
          }, 100);
        }
      } else {
        attempts++;
        console.log(`Waiting for Swiper... Attempt ${attempts}`);
        if (attempts >= maxAttempts) {
          clearInterval(checkSwiper);
          reject(new Error("Timeout waiting for Swiper"));
        }
      }
    }, interval);
  });
}

// Main initialization function
async function initializeAR() {
  try {
    // Check if we should show AR button based on URL
    if (!shouldShowARButton()) {
      console.log(
        "AR button not shown - URL doesn't contain sunglasses or eyeglasses"
      );
      return; // Exit if URL doesn't contain required keywords
    }

    // Wait for Swiper first
    const swiperImages = await waitForSwiper();
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

    // Create sunglasses button container
    const sunglassesButtonContainer = document.createElement("div");
    sunglassesButtonContainer.style.cssText = `
      position: absolute;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      gap: 10px;
      padding: 10px;
      background-color: rgba(255, 255, 255, 0.8);
      border-radius: 10px;
      z-index: 1001;
    `;

    // Create buttons for each pair of sunglasses
    swiperImages.forEach((img, index) => {
      const button = document.createElement("button");
      button.style.cssText = `
        padding: 5px;
        border: 2px solid #ccc;
        border-radius: 5px;
        cursor: pointer;
        background-color: white;
        transition: all 0.3s ease;
      `;

      const previewImg = document.createElement("img");
      previewImg.src = img.src;
      previewImg.style.cssText = `
        width: 50px;
        height: 30px;
        object-fit: contain;
      `;

      button.appendChild(previewImg);
      button.addEventListener("click", () => {
        // Update selected button style
        sunglassesButtonContainer.querySelectorAll("button").forEach((btn) => {
          btn.style.borderColor = "#ccc";
        });
        button.style.borderColor = "#007bff";

        // Update glasses image
        glassesImg.src = img.src;
      });

      sunglassesButtonContainer.appendChild(button);
    });

    modalContent.appendChild(sunglassesButtonContainer);

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
    const FRAME_RATE = 30;
    const frameInterval = 1000 / FRAME_RATE;

    // Pre-load glasses image
    const glassesImg = new Image();
    glassesImg.src = swiperImages[0].src;
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
      // Reset selected button styles
      sunglassesButtonContainer.querySelectorAll("button").forEach((btn) => {
        btn.style.borderColor = "#ccc";
      });
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
window.addEventListener("load", () => {
  initializeAR();
});
