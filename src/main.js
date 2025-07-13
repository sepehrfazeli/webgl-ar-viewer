import './style.css';
import * as THREE from 'three';
import { ModelViewer } from './components/ModelViewer.js';
import { ARMode } from './components/ARMode.js';
import { WebXRUtils } from './utils/WebXRUtils.js';
import { ModelLoader } from './utils/ModelLoader.js';

class WebGLARApp {
  constructor() {
    this.modelViewer = null;
    this.arMode = null;
    this.modelLoader = null;
    this.currentModel = null;
    this.isARActive = false;
    this.hasWebXR = false;
    this.isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    
    this.init();
  }

  init() {
    // Get DOM elements
    this.container = document.getElementById('viewer-container');
    this.modelInput = document.getElementById('model-input');
    this.arButton = document.getElementById('ar-button');
    this.debugButton = document.getElementById('debug-button');
    this.debugInfo = document.getElementById('debug-info');
    this.loadingDiv = document.getElementById('loading');
    this.errorDiv = document.getElementById('error');
    
    // Initialize components
    this.modelViewer = new ModelViewer(this.container);
    this.arMode = new ARMode(this.modelViewer);
    this.modelLoader = new ModelLoader();
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Check WebXR support
    this.checkWebXRSupport();
    
    // Add info panel
    this.createInfoPanel();
  }

  setupEventListeners() {
    // Model file input
    this.modelInput.addEventListener('change', (event) => {
      const file = event.target.files[0];
      if (file) {
        this.loadModel(file);
      }
    });

    // AR button
    this.arButton.addEventListener('click', () => {
      if (this.isARActive) {
        this.exitAR();
      } else {
        this.enterAR();
      }
    });

    // Debug button
    this.debugButton.addEventListener('click', () => {
      this.toggleDebugInfo();
    });

    // Drag and drop support
    this.container.addEventListener('dragover', (event) => {
      event.preventDefault();
      this.container.style.backgroundColor = '#e3f2fd';
    });

    this.container.addEventListener('dragleave', () => {
      this.container.style.backgroundColor = '';
    });

    this.container.addEventListener('drop', (event) => {
      event.preventDefault();
      this.container.style.backgroundColor = '';
      
      const files = event.dataTransfer.files;
      if (files.length > 0) {
        this.loadModel(files[0]);
      }
    });
  }

  async checkWebXRSupport() {
    try {
      // Add detailed logging for debugging
      console.log('Checking WebXR support...');
      console.log('User Agent:', navigator.userAgent);
      console.log('HTTPS:', location.protocol === 'https:');
      console.log('WebXR available:', 'xr' in navigator);
      
      const support = await WebXRUtils.checkWebXRSupport();
      console.log('WebXR Support Result:', support);
      
      if (support.ar) {
        this.hasWebXR = true;
        this.arButton.disabled = false;
        this.arButton.textContent = 'Enter AR Mode';
        console.log('✅ AR Mode enabled');
      } else {
        this.hasWebXR = false;
        
        // Enable fallback AR for iOS devices with models loaded
        if (this.isIOS && this.currentModel) {
          this.arButton.disabled = false;
          this.arButton.textContent = 'AR Simulation';
          this.arButton.title = 'Fallback AR mode for iOS (no WebXR)';
          console.log('📱 iOS AR Simulation enabled');
        } else if (this.isIOS) {
          this.arButton.disabled = true;
          this.arButton.textContent = 'Load Model First';
          this.arButton.title = support.reason;
          console.log('📱 iOS: Load model to enable AR simulation');
        } else {
          this.arButton.disabled = true;
          this.arButton.textContent = 'AR Not Supported';
          this.arButton.title = support.reason;
          console.log('❌ AR Mode disabled:', support.reason);
        }
        
        // Show debug info for mobile users
        if (/Mobi|Android/i.test(navigator.userAgent)) {
          this.showError(`AR Debug: ${support.reason}. Device: ${navigator.userAgent.substring(0, 50)}...`);
        }
      }
    } catch (error) {
      console.error('WebXR support check failed:', error);
      this.arButton.disabled = true;
      this.arButton.textContent = 'AR Check Failed';
      this.showError(`WebXR support check failed: ${error.message}`);
    }
  }

  async loadModel(file) {
    try {
      // Validate file
      ModelLoader.validateFile(file);
      
      console.log(`Loading ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);
      
      // Show loading
      this.showLoading('Loading model...');
      this.hideError();
      
      // Load model
      const result = await this.modelLoader.loadModel(file);
      
      // Clear current model and add new one
      this.modelViewer.clearCurrentModel();
      this.modelViewer.scene.add(result.model);
      this.modelViewer.currentModel = result.model;
      this.currentModel = result;
      
      // Enable AR button based on support and model availability
      if (this.hasWebXR) {
        this.arButton.disabled = false;
        this.arButton.textContent = 'Enter AR Mode';
      } else if (this.isIOS) {
        // Enable iOS fallback AR simulation
        this.arButton.disabled = false;
        this.arButton.textContent = 'AR Simulation';
        this.arButton.title = 'iOS AR simulation mode (no WebXR)';
        console.log('📱 iOS AR Simulation now available with loaded model');
      }
      
      // Hide loading
      this.hideLoading();
      
      console.log('Model loaded successfully:', result);
      
    } catch (error) {
      console.error('Model loading failed:', error);
      this.showError(`Failed to load model: ${error.message}`);
      this.hideLoading();
    }
  }

  async enterAR() {
    if (!this.currentModel) {
      this.showError('Please load a 3D model first');
      return;
    }

    try {
      this.showLoading('Starting AR session...');
      
      // Check if we should use WebXR or fallback mode
      if (this.hasWebXR) {
        // Use real WebXR AR
        await this.arMode.startARSession();
        
        this.isARActive = true;
        this.arButton.textContent = 'Exit AR';
        document.body.classList.add('ar-mode');
        
        // Set up AR frame loop
        this.modelViewer.renderer.setAnimationLoop((timestamp, frame) => {
          if (frame) {
            this.arMode.onXRFrame(frame);
          }
          this.modelViewer.controls.update();
          this.modelViewer.renderer.render(this.modelViewer.scene, this.modelViewer.camera);
        });
      } else {
        // Use iOS AR simulation
        this.startARSimulation();
      }
      
      this.hideLoading();
      
    } catch (error) {
      console.error('AR session failed:', error);
      this.showError(`AR failed: ${error.message}`);
      this.hideLoading();
    }
  }

  async startARSimulation() {
    console.log('📱 Starting iOS AR Simulation');
    
    try {
      // Request camera access for AR background
      await this.setupCameraBackground();
      
      // Switch to fullscreen mobile-friendly view
      this.isARActive = true;
      this.arButton.textContent = 'Exit AR Simulation';
      document.body.classList.add('ar-mode');
      
      // Adjust camera for mobile AR-like view
      this.modelViewer.camera.position.set(0, 0, 3);
      this.modelViewer.camera.lookAt(0, 0, 0);
      
      // Make background transparent to show camera feed
      this.modelViewer.scene.background = null;
      this.modelViewer.renderer.setClearColor(0x000000, 0); // Transparent
      
      // Position model to appear on a surface (like a table)
      if (this.currentModel) {
        this.currentModel.model.position.set(0, -0.5, 0); // Place on surface
        this.currentModel.model.scale.set(0.3, 0.3, 0.3); // Make smaller for AR
      }
      
      // Add instructions for iOS users
      this.showError('📱 iOS AR Simulation: Camera active! Move your device to view the model. The model appears on a virtual surface.');
      
      // Enable device orientation if available
      if (window.DeviceOrientationEvent) {
        this.enableDeviceOrientation();
      }
      
    } catch (error) {
      console.error('Camera access failed:', error);
      this.showError('📱 Camera access denied. Using basic AR simulation without camera.');
      
      // Fallback to basic AR simulation
      this.startBasicARSimulation();
    }
  }

  async setupCameraBackground() {
    try {
      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment', // Use back camera
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      // Create video element for camera feed
      const videoElement = document.createElement('video');
      videoElement.srcObject = stream;
      videoElement.autoplay = true;
      videoElement.playsInline = true;
      videoElement.muted = true;
      
      // Style video to cover the entire background
      videoElement.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        object-fit: cover;
        z-index: -1;
        background: #000;
      `;
      
      // Add to DOM
      document.body.appendChild(videoElement);
      this.arVideoElement = videoElement;
      
      console.log('📱 Camera background activated');
      
    } catch (error) {
      throw new Error(`Camera access failed: ${error.message}`);
    }
  }

  startBasicARSimulation() {
    console.log('📱 Starting basic AR simulation (no camera)');
    
    // Switch to fullscreen mobile-friendly view
    this.isARActive = true;
    this.arButton.textContent = 'Exit AR Simulation';
    document.body.classList.add('ar-mode');
    
    // Adjust camera for mobile AR-like view
    this.modelViewer.camera.position.set(0, 0, 3);
    this.modelViewer.camera.lookAt(0, 0, 0);
    
    // Create a simple gradient background to simulate environment
    this.modelViewer.scene.background = new THREE.Color(0x87CEEB); // Sky blue
    
    // Position model to appear on a surface
    if (this.currentModel) {
      this.currentModel.model.position.set(0, -0.5, 0);
      this.currentModel.model.scale.set(0.3, 0.3, 0.3);
    }
    
    // Add instructions for iOS users
    this.showError('📱 Basic AR Simulation: Move your device to view the model from different angles.');
    
    // Enable device orientation if available
    if (window.DeviceOrientationEvent) {
      this.enableDeviceOrientation();
    }
  }

  enableDeviceOrientation() {
    const handleOrientation = (event) => {
      if (this.isARActive && !this.hasWebXR) {
        // Use device orientation to simulate AR camera movement
        const alpha = event.alpha || 0; // Z axis
        const beta = event.beta || 0;   // X axis
        const gamma = event.gamma || 0; // Y axis
        
        // Apply rotation to camera (simplified AR simulation)
        this.modelViewer.camera.rotation.x = (beta - 90) * Math.PI / 180;
        this.modelViewer.camera.rotation.y = alpha * Math.PI / 180;
        this.modelViewer.camera.rotation.z = gamma * Math.PI / 180;
      }
    };

    // Request permission for iOS 13+
    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
      DeviceOrientationEvent.requestPermission()
        .then(response => {
          if (response == 'granted') {
            window.addEventListener('deviceorientation', handleOrientation);
            console.log('📱 Device orientation enabled for AR simulation');
          }
        })
        .catch(console.error);
    } else {
      // Non-iOS or older iOS
      window.addEventListener('deviceorientation', handleOrientation);
    }
  }

  exitAR() {
    if (this.hasWebXR) {
      this.arMode.endARSession();
      // Reset animation loop
      this.modelViewer.renderer.setAnimationLoop(null);
    } else {
      // Exit iOS AR simulation
      console.log('📱 Exiting iOS AR Simulation');
      
      // Stop camera feed and remove video element
      if (this.arVideoElement) {
        const stream = this.arVideoElement.srcObject;
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }
        this.arVideoElement.remove();
        this.arVideoElement = null;
      }
      
      // Reset camera position
      this.modelViewer.camera.position.set(0, 0, 5);
      this.modelViewer.camera.rotation.set(0, 0, 0);
      this.modelViewer.controls.reset();
      
      // Reset background
      this.modelViewer.scene.background = new THREE.Color(0xf0f0f0);
      this.modelViewer.renderer.setClearColor(0xf0f0f0, 1);
      
      // Reset model position and scale
      if (this.currentModel) {
        this.currentModel.model.position.set(0, 0, 0);
        this.currentModel.model.scale.set(1, 1, 1);
      }
      
      // Remove device orientation listener
      window.removeEventListener('deviceorientation', this.handleOrientation);
      
      this.hideError();
    }
    
    this.isARActive = false;
    this.arButton.textContent = this.hasWebXR ? 'Enter AR Mode' : 'AR Simulation';
    document.body.classList.remove('ar-mode');
  }

  createInfoPanel() {
    const infoPanel = document.createElement('div');
    infoPanel.className = 'info-panel';
    infoPanel.innerHTML = `
      <h3>WebGL/AR 3D Model Viewer</h3>
      <ul>
        <li>📁 Drag & drop or select 3D models</li>
        <li>🔄 Mouse/touch to rotate view</li>
        <li>🥽 AR mode for real-world placement</li>
        <li>📱 Works on mobile devices</li>
      </ul>
      <p>Supported formats: glTF, glB, STL</p>
    `;
    
    this.container.appendChild(infoPanel);
  }

  showLoading(message) {
    this.loadingDiv.textContent = message;
    this.loadingDiv.style.display = 'block';
  }

  hideLoading() {
    this.loadingDiv.style.display = 'none';
  }

  showError(message) {
    this.errorDiv.textContent = message;
    this.errorDiv.style.display = 'block';
  }

  hideError() {
    this.errorDiv.style.display = 'none';
  }

  async toggleDebugInfo() {
    if (this.debugInfo.style.display === 'none' || !this.debugInfo.style.display) {
      // Show debug info
      const debugData = await this.collectDebugInfo();
      this.debugInfo.textContent = debugData;
      this.debugInfo.style.display = 'block';
      this.debugButton.textContent = 'Hide Debug';
    } else {
      // Hide debug info
      this.debugInfo.style.display = 'none';
      this.debugButton.textContent = 'Debug Info';
    }
  }

  async collectDebugInfo() {
    const info = {
      // Browser & Environment
      userAgent: navigator.userAgent,
      url: window.location.href,
      protocol: window.location.protocol,
      
      // WebXR Status
      webxrAvailable: 'xr' in navigator,
      
      // Device Info
      platform: navigator.platform,
      language: navigator.language,
      cookieEnabled: navigator.cookieEnabled,
      
      // Screen Info
      screenWidth: screen.width,
      screenHeight: screen.height,
      windowWidth: window.innerWidth,
      windowHeight: window.innerHeight,
      
      // Performance
      memory: performance.memory ? {
        usedJSHeapSize: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024) + 'MB',
        totalJSHeapSize: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024) + 'MB'
      } : 'Not available',
    };

    // Try WebXR detection
    if ('xr' in navigator) {
      try {
        info.arSupported = await navigator.xr.isSessionSupported('immersive-ar');
        info.vrSupported = await navigator.xr.isSessionSupported('immersive-vr');
      } catch (error) {
        info.webxrError = error.message;
      }
    }

    return `=== WebGL/AR Debug Info ===

🌐 ENVIRONMENT:
URL: ${info.url}
Protocol: ${info.protocol}
Platform: ${info.platform}
Language: ${info.language}

📱 DEVICE:
User Agent: ${info.userAgent}
Screen: ${info.screenWidth}x${info.screenHeight}
Window: ${info.windowWidth}x${info.windowHeight}

🥽 WEBXR STATUS:
WebXR Available: ${info.webxrAvailable}
AR Supported: ${info.arSupported || 'Unknown'}
VR Supported: ${info.vrSupported || 'Unknown'}
${info.webxrError ? `Error: ${info.webxrError}` : ''}

💾 PERFORMANCE:
Memory: ${typeof info.memory === 'object' ? info.memory.usedJSHeapSize + ' / ' + info.memory.totalJSHeapSize : info.memory}

🔧 TROUBLESHOOTING:
${info.protocol !== 'https:' ? '❌ HTTPS required for WebXR\n' : '✅ HTTPS detected\n'}${!info.webxrAvailable ? '❌ WebXR not available in browser\n' : '✅ WebXR API detected\n'}${info.arSupported === false ? '❌ AR not supported on this device\n' : ''}${info.arSupported === true ? '✅ AR should work on this device\n' : ''}`;
  }
}

// Initialize the app
window.addEventListener('DOMContentLoaded', () => {
  new WebGLARApp();
});

// Add some sample models for testing
console.log('WebGL/AR 3D Model Viewer initialized');
console.log('Supported formats:', ModelLoader.getSupportedFormats());
