/* Comprehensive Face Detection AR Implementation - Fixed Version */

// Model Management Utility
class ModelManager {
  // Updated Model Sources with Working Links
  static MODEL_SOURCE = "https://unpkg.com/@vladmandic/face-api@1.7.1/model/";

  // Required Model Files
  static REQUIRED_MODELS = [
    "face_landmark_68_model-weights_manifest.json",
    "tiny_face_detector_model.bin",
    "tiny_face_detector_model-weights_manifest.json",
    "face_landmark_68_model.bin",
  ];

  // Load Face API Script
  static loadFaceAPIScript() {
    return new Promise((resolve, reject) => {
      if (typeof faceapi !== "undefined") {
        resolve();
        return;
      }

      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/face-api.js/dist/face-api.js";
      script.onload = () => resolve();
      script.onerror = (error) => reject(error);
      document.head.appendChild(script);
    });
  }

  // Comprehensive Model Download
  static async downloadModels() {
    console.group("Face API Model Download");

    try {
      const downloadPromises = this.REQUIRED_MODELS.map(async (modelFile) => {
        const fullUrl = `${this.MODEL_SOURCE}${modelFile}`;

        try {
          const response = await fetch(fullUrl, {
            method: "GET",
            mode: "cors",
            cache: "no-cache",
          });

          if (!response.ok) {
            console.warn(`❌ Failed to fetch: ${fullUrl}`);
            return false;
          }

          console.log(`✅ Downloaded: ${modelFile}`);
          return true;
        } catch (error) {
          console.error(`Error downloading ${modelFile}:`, error);
          return false;
        }
      });

      const results = await Promise.all(downloadPromises);

      if (results.every((result) => result === true)) {
        console.log("🎉 All models downloaded successfully");
        console.groupEnd();
        return true;
      }
    } catch (error) {
      console.error("Model download failed:", error);
    }

    console.error("❌ Failed to download models from all sources");
    console.groupEnd();
    return false;
  }

  // Create Error Modal
  static showErrorModal(message) {
    const modal = document.createElement("div");
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.9);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10000;
      color: white;
      font-family: Arial, sans-serif;
    `;

    modal.innerHTML = `
      <div style="
        background: #333;
        padding: 30px;
        border-radius: 10px;
        max-width: 500px;
        text-align: center;
      ">
        <h2>AR Feature Error</h2>
        <p>${message}</p>
        <div style="margin-top: 20px;">
          <p>Recommended Actions:</p>
          <p>
            • Check your internet connection<br>
            • Disable ad blockers<br>
            • Try a different browser<br>
            • Reload the page
          </p>
          <button id="close-modal" style="
            background: #007bff;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            margin-top: 15px;
          ">Close</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    document.getElementById("close-modal").addEventListener("click", () => {
      document.body.removeChild(modal);
    });
  }
}

// Face Detection AR Class
class FaceDetectionAR {
  constructor(slider) {
    this.slider = slider;
    this.arContainer = null;
    this.video = null;
    this.canvas = null;
    this.closeButton = null;
    this.sunglasses = null;
    this.isRunning = false;
  }

  createARContainer() {
    this.arContainer = document.createElement("div");
    Object.assign(this.arContainer.style, {
      position: "fixed",
      top: "0",
      left: "0",
      width: "100%",
      height: "100%",
      backgroundColor: "rgba(0,0,0,0.9)",
      zIndex: "9999",
      display: "none",
      justifyContent: "center",
      alignItems: "center",
      overflow: "hidden",
    });

    // Video Element
    this.video = document.createElement("video");
    this.video.setAttribute("playsinline", "");
    this.video.setAttribute("autoplay", "");
    this.video.style.display = "none";

    // Canvas takes full display
    this.canvas = document.createElement("canvas");
    Object.assign(this.canvas.style, {
      position: "absolute",
      top: "0",
      left: "0",
      width: "100%",
      height: "100%",
      objectFit: "contain",
    });

    // Close Button
    this.closeButton = document.createElement("button");
    this.closeButton.textContent = "Close AR";
    Object.assign(this.closeButton.style, {
      position: "absolute",
      top: "20px",
      right: "20px",
      backgroundColor: "red",
      color: "white",
      border: "none",
      padding: "10px",
      borderRadius: "5px",
      cursor: "pointer",
      zIndex: "10000",
    });

    // Append Elements
    this.arContainer.appendChild(this.canvas);
    this.arContainer.appendChild(this.video);
    this.arContainer.appendChild(this.closeButton);
    document.body.appendChild(this.arContainer);

    // Event Listeners
    this.closeButton.addEventListener("click", () => this.stopAR());
  }

  async startAR() {
    try {
      this.isRunning = true;

      // Request Camera Access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
      });

      this.video.srcObject = stream;
      this.arContainer.style.display = "flex";

      await new Promise((resolve) => {
        this.video.onloadedmetadata = () => {
          this.canvas.width = this.video.videoWidth;
          this.canvas.height = this.video.videoHeight;
          resolve();
        };
      });

      this.detectFaces();
    } catch (error) {
      this.isRunning = false;
      console.error("AR Start Error:", error);
      ModelManager.showErrorModal(
        "Could not start AR. Check camera permissions."
      );
    }
  }
  async detectFaces() {
    if (!this.isRunning || !this.sunglasses) return;

    const ctx = this.canvas.getContext("2d");
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Aspect ratio calculations
    const videoAspect = this.video.videoWidth / this.video.videoHeight;
    const canvasAspect = this.canvas.width / this.canvas.height;
    let renderWidth, renderHeight;

    if (canvasAspect > videoAspect) {
      renderHeight = this.canvas.height;
      renderWidth =
        this.video.videoWidth * (renderHeight / this.video.videoHeight);
    } else {
      renderWidth = this.canvas.width;
      renderHeight =
        this.video.videoHeight * (renderWidth / this.video.videoWidth);
    }

    const scaleX = renderWidth / this.video.videoWidth;
    const scaleY = renderHeight / this.video.videoHeight;
    const offsetX = (this.canvas.width - renderWidth) / 2;
    const offsetY = (this.canvas.height - renderHeight) / 2;

    ctx.drawImage(this.video, offsetX, offsetY, renderWidth, renderHeight);

    try {
      const detections = await faceapi
        .detectAllFaces(this.video, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks();

      detections.forEach((detection) => {
        const landmarks = detection.landmarks;
        const leftEye = landmarks.getLeftEye();
        const rightEye = landmarks.getRightEye();

        if (leftEye.length === 0 || rightEye.length === 0) return;

        // Calculate eye centers
        const leftEyeCenter = {
          x: leftEye.reduce((sum, pt) => sum + pt.x, 0) / leftEye.length,
          y: leftEye.reduce((sum, pt) => sum + pt.y, 0) / leftEye.length,
        };

        const rightEyeCenter = {
          x: rightEye.reduce((sum, pt) => sum + pt.x, 0) / rightEye.length,
          y: rightEye.reduce((sum, pt) => sum + pt.y, 0) / rightEye.length,
        };

        // Calculate glasses parameters
        const eyeDistance = Math.hypot(
          rightEyeCenter.x - leftEyeCenter.x,
          rightEyeCenter.y - leftEyeCenter.y
        );

        const glassesWidth = eyeDistance * 2.5;
        const glassesHeight = glassesWidth * 0.4;
        const verticalOffset = glassesHeight * 0.5;

        // Calculate center position with scaling and offset
        const centerX = leftEyeCenter.x - rightEyeCenter.x;
        const centerY =
          leftEyeCenter.y + rightEyeCenter.y / 2 - (offsetY + verticalOffset);

        // Calculate rotation angle
        const angle = Math.atan2(
          rightEyeCenter.y - leftEyeCenter.y,
          rightEyeCenter.x - leftEyeCenter.x
        );

        // Update sunglasses position and transform
        this.sunglasses.style.position = "fixed";
        this.sunglasses.style.transform = `translate(15%, -50%) rotate(${angle}rad)`;
        this.sunglasses.style.top = `${centerY}px`;
        this.sunglasses.style.marginLeft = `${centerX}px`;
        this.sunglasses.style.width = `${glassesWidth * 2}px`;
        this.sunglasses.style.height = `${glassesHeight * 3}px`;
      });

      if (this.isRunning) {
        requestAnimationFrame(() => this.detectFaces());
      }
    } catch (error) {
      console.error("Face detection error:", error);
      if (this.isRunning) {
        requestAnimationFrame(() => this.detectFaces());
      }
    }
  }

  loadSunglassesImage() {
    if (!this.sunglasses) {
      return new Promise((resolve, reject) => {
        this.sunglasses = new Image();
        this.sunglasses.crossOrigin = "anonymous";

        // Update this path to your actual sunglasses image location
        this.sunglasses.src =
          "https://cdn-icons-png.flaticon.com/128/7826/7826914.png";

        this.sunglasses.onload = () => {
          if (this.sunglasses.width === 0 || this.sunglasses.height === 0) {
            reject(new Error("Invalid image dimensions"));
            return;
          }
          // Add necessary styles
          // this.sunglasses.style.transform = "translate(-50%, -50%)";
          this.sunglasses.style.zIndex = "10000";
          this.sunglasses.style.position = "absolute";
          this.sunglasses.style.pointerEvents = "none";
          this.arContainer.appendChild(this.sunglasses);
          resolve();
        };

        this.sunglasses.onerror = (error) => {
          reject(new Error("Sunglasses image could not be loaded."));
        };
      });
    }
  }

  async init() {
    this.createARContainer();
    try {
      await this.loadSunglassesImage();
      console.log("✅ AR initialization complete");
    } catch (error) {
      console.error("❌ AR initialization failed:", error);
      throw error;
    }
  }

  stopAR() {
    this.isRunning = false;
    document.body.removeChild(this.arContainer);
    if (this.video.srcObject) {
      this.video.srcObject.getTracks().forEach((track) => track.stop());
    }
    this.arContainer.style.display = "none";
    const ctx = this.canvas.getContext("2d");
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }
}

// AR Manager Class
class ARManager {
  static injectARButton(slider) {
    const arButton = document.createElement("button");
    arButton.textContent = "Try AR Glasses";
    arButton.classList.add("ar-glasses-btn");

    Object.assign(arButton.style, {
      position: "absolute",
      top: "10px",
      right: "10px",
      zIndex: "1000",
      padding: "8px 16px",
      backgroundColor: "#007bff",
      color: "white",
      border: "none",
      borderRadius: "4px",
      cursor: "pointer",
    });

    arButton.addEventListener("click", async () => {
      try {
        await ModelManager.loadFaceAPIScript();
        const modelsLoaded = await ModelManager.downloadModels();

        if (!modelsLoaded) throw new Error("Failed to load models");

        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(ModelManager.MODEL_SOURCE),
          faceapi.nets.faceLandmark68Net.loadFromUri(ModelManager.MODEL_SOURCE),
        ]);

        const arInstance = new FaceDetectionAR(slider);
        await arInstance.init();
        await arInstance.startAR();
      } catch (error) {
        ModelManager.showErrorModal("Failed to start AR feature.");
      }
    });

    slider.style.position = "relative";
    slider.appendChild(arButton);
  }

  static initializeARButtons() {
    const sliders = document.querySelectorAll('[id^="details-slider"]');
    sliders.forEach((slider) => this.injectARButton(slider));
  }
}

// Main Initialization
function initFaceDetectionAR() {
  document.addEventListener("DOMContentLoaded", () => {
    ARManager.initializeARButtons();
  });
}

initFaceDetectionAR();
