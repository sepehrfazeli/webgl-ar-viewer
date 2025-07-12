import './style.css';
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
    
    this.init();
  }

  init() {
    // Get DOM elements
    this.container = document.getElementById('viewer-container');
    this.modelInput = document.getElementById('model-input');
    this.arButton = document.getElementById('ar-button');
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
      const support = await WebXRUtils.checkWebXRSupport();
      
      if (support.ar) {
        this.arButton.disabled = false;
        this.arButton.textContent = 'Enter AR Mode';
      } else {
        this.arButton.disabled = true;
        this.arButton.textContent = 'AR Not Supported';
        this.arButton.title = support.reason;
      }
    } catch (error) {
      console.error('WebXR support check failed:', error);
      this.showError('WebXR support check failed');
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
      
      // Enable AR button if WebXR is supported
      if (!this.arButton.disabled) {
        this.arButton.disabled = false;
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
      
      this.hideLoading();
      
    } catch (error) {
      console.error('AR session failed:', error);
      this.showError(`AR failed: ${error.message}`);
      this.hideLoading();
    }
  }

  exitAR() {
    this.arMode.endARSession();
    this.isARActive = false;
    this.arButton.textContent = 'Enter AR Mode';
    document.body.classList.remove('ar-mode');
    
    // Reset animation loop
    this.modelViewer.renderer.setAnimationLoop(null);
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
}

// Initialize the app
window.addEventListener('DOMContentLoaded', () => {
  new WebGLARApp();
});

// Add some sample models for testing
console.log('WebGL/AR 3D Model Viewer initialized');
console.log('Supported formats:', ModelLoader.getSupportedFormats());
