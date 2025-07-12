import * as THREE from 'three';

export class ARMode {
  constructor(modelViewer) {
    this.modelViewer = modelViewer;
    this.xrSession = null;
    this.xrRefSpace = null;
    this.xrHitTestSource = null;
    this.placedModel = null;
    this.reticle = null;
    this.isARSupported = false;
    
    this.checkARSupport();
  }

  async checkARSupport() {
    if ('xr' in navigator) {
      try {
        this.isARSupported = await navigator.xr.isSessionSupported('immersive-ar');
      } catch (error) {
        console.warn('WebXR not supported:', error);
        this.isARSupported = false;
      }
    }
    return this.isARSupported;
  }

  async startARSession() {
    if (!this.isARSupported) {
      throw new Error('AR not supported on this device');
    }

    try {
      // Request AR session
      this.xrSession = await navigator.xr.requestSession('immersive-ar', {
        requiredFeatures: ['hit-test'],
        optionalFeatures: ['dom-overlay'],
        domOverlay: { root: document.body }
      });

      // Set up XR session
      await this.setupXRSession();
      
      // Enable AR rendering
      this.modelViewer.renderer.xr.enabled = true;
      this.modelViewer.renderer.xr.setSession(this.xrSession);

      // Create reticle for placement
      this.createReticle();

      // Set up hit testing
      await this.setupHitTest();

      // Add session end listener
      this.xrSession.addEventListener('end', () => this.onSessionEnd());

      return true;
    } catch (error) {
      console.error('Failed to start AR session:', error);
      throw error;
    }
  }

  async setupXRSession() {
    // Get reference space
    this.xrRefSpace = await this.xrSession.requestReferenceSpace('local-floor');
    
    // Set up AR lighting
    this.setupARLighting();
  }

  setupARLighting() {
    // Adjust lighting for AR
    const ambientLight = this.modelViewer.lights.find(light => light.type === 'AmbientLight');
    if (ambientLight) {
      ambientLight.intensity = 0.3;
    }

    // Add environment lighting estimation if supported
    if (this.xrSession.environmentBlendMode === 'additive') {
      const directionalLight = this.modelViewer.lights.find(light => light.type === 'DirectionalLight');
      if (directionalLight) {
        directionalLight.intensity = 0.5;
      }
    }
  }

  createReticle() {
    const geometry = new THREE.RingGeometry(0.1, 0.12, 32);
    const material = new THREE.MeshBasicMaterial({ 
      color: 0x00ff00,
      transparent: true,
      opacity: 0.7
    });
    
    this.reticle = new THREE.Mesh(geometry, material);
    this.reticle.matrixAutoUpdate = false;
    this.reticle.visible = false;
    this.modelViewer.scene.add(this.reticle);
  }

  async setupHitTest() {
    const session = this.xrSession;
    const viewerSpace = await session.requestReferenceSpace('viewer');
    this.xrHitTestSource = await session.requestHitTestSource({ space: viewerSpace });
  }

  placeModel(hitPose) {
    if (!this.modelViewer.currentModel) return;

    // Clone the current model for AR placement
    const modelClone = this.modelViewer.currentModel.clone();
    
    // Position model at hit location
    modelClone.position.setFromMatrixPosition(hitPose.transform.matrix);
    modelClone.quaternion.setFromRotationMatrix(hitPose.transform.matrix);
    
    // Remove previous placed model
    if (this.placedModel) {
      this.modelViewer.scene.remove(this.placedModel);
    }
    
    // Add new placed model
    this.modelViewer.scene.add(modelClone);
    this.placedModel = modelClone;
    
    // Hide reticle
    this.reticle.visible = false;
  }

  onSessionEnd() {
    // Clean up AR session
    this.xrSession = null;
    this.xrRefSpace = null;
    this.xrHitTestSource = null;
    
    // Remove AR elements
    if (this.reticle) {
      this.modelViewer.scene.remove(this.reticle);
      this.reticle = null;
    }
    
    if (this.placedModel) {
      this.modelViewer.scene.remove(this.placedModel);
      this.placedModel = null;
    }
    
    // Reset renderer
    this.modelViewer.renderer.xr.enabled = false;
    
    // Reset lighting
    this.resetLighting();
  }

  resetLighting() {
    const ambientLight = this.modelViewer.lights.find(light => light.type === 'AmbientLight');
    if (ambientLight) {
      ambientLight.intensity = 0.6;
    }
    
    const directionalLight = this.modelViewer.lights.find(light => light.type === 'DirectionalLight');
    if (directionalLight) {
      directionalLight.intensity = 0.8;
    }
  }

  endARSession() {
    if (this.xrSession) {
      this.xrSession.end();
    }
  }

  // Handle XR frame updates
  onXRFrame(frame) {
    if (this.xrHitTestSource) {
      const hitTestResults = frame.getHitTestResults(this.xrHitTestSource);
      
      if (hitTestResults.length > 0) {
        const hit = hitTestResults[0];
        const pose = hit.getPose(this.xrRefSpace);
        
        if (pose) {
          // Update reticle position
          this.reticle.visible = true;
          this.reticle.matrix.fromArray(pose.transform.matrix);
          
          // Check for tap to place
          const inputSources = this.xrSession.inputSources;
          for (const inputSource of inputSources) {
            if (inputSource.gamepad && inputSource.gamepad.buttons[0].pressed) {
              this.placeModel(pose);
              break;
            }
          }
        }
      } else {
        this.reticle.visible = false;
      }
    }
  }
}
