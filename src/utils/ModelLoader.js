import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

export class ModelLoader {
  constructor() {
    this.gltfLoader = new GLTFLoader();
    this.stlLoader = new STLLoader();
    
    // Set up Draco loader for compressed glTF files
    this.dracoLoader = new DRACOLoader();
    this.dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
    this.gltfLoader.setDRACOLoader(this.dracoLoader);
    
    console.log('ModelLoader initialized with Draco compression support');
  }

  async loadModel(file) {
    const fileName = file.name.toLowerCase();
    
    if (fileName.endsWith('.glb') || fileName.endsWith('.gltf')) {
      return this.loadGLTF(file);
    } else if (fileName.endsWith('.stl')) {
      return this.loadSTL(file);
    } else {
      throw new Error(`Unsupported file format: ${fileName}`);
    }
  }

  loadGLTF(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        const arrayBuffer = event.target.result;
        
        this.gltfLoader.parse(arrayBuffer, '', (gltf) => {
          const model = gltf.scene;
          this.processModel(model);
          resolve({
            model,
            animations: gltf.animations,
            type: 'gltf'
          });
        }, (error) => {
          console.error('GLTFLoader error:', error);
          reject(new Error(`Failed to parse glTF file: ${error.message || 'Unknown error'}`));
        });
      };

      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      reader.readAsArrayBuffer(file);
    });
  }

  loadSTL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        const arrayBuffer = event.target.result;
        
        try {
          const geometry = this.stlLoader.parse(arrayBuffer);
          
          // Create material for STL
          const material = new THREE.MeshLambertMaterial({ 
            color: 0x888888,
            transparent: true,
            opacity: 0.9
          });
          
          const mesh = new THREE.Mesh(geometry, material);
          this.processModel(mesh);
          
          resolve({
            model: mesh,
            animations: [],
            type: 'stl'
          });
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  }

  processModel(model) {
    // Compute bounding box
    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    
    // Scale model to fit in a reasonable size
    const maxDim = Math.max(size.x, size.y, size.z);
    const scale = 2 / maxDim;
    model.scale.multiplyScalar(scale);
    
    // Center the model
    model.position.sub(center.multiplyScalar(scale));
    
    // Set up shadows and materials
    model.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        
        // Ensure materials are properly set up
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(mat => this.setupMaterial(mat));
          } else {
            this.setupMaterial(child.material);
          }
        }
      }
    });
    
    return model;
  }

  setupMaterial(material) {
    // Enable shadows for materials
    if (material.isMeshStandardMaterial || material.isMeshPhongMaterial) {
      material.needsUpdate = true;
    }
    
    // Add some basic properties for better rendering
    if (material.isMeshBasicMaterial) {
      // Convert basic materials to Lambert for better lighting
      const newMaterial = new THREE.MeshLambertMaterial({
        color: material.color,
        map: material.map,
        transparent: material.transparent,
        opacity: material.opacity
      });
      
      return newMaterial;
    }
    
    return material;
  }

  static getSupportedFormats() {
    return [
      { extension: '.glb', description: 'Binary glTF' },
      { extension: '.gltf', description: 'glTF JSON' },
      { extension: '.stl', description: 'STL (3D Printing)' }
    ];
  }

  static validateFile(file) {
    const supportedExtensions = ['.glb', '.gltf', '.stl'];
    const fileName = file.name.toLowerCase();
    
    const isSupported = supportedExtensions.some(ext => fileName.endsWith(ext));
    
    if (!isSupported) {
      throw new Error(`Unsupported file format. Supported formats: ${supportedExtensions.join(', ')}`);
    }
    
    // Check file size (limit to 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB in bytes
    if (file.size > maxSize) {
      throw new Error(`File too large. Maximum size: 50MB`);
    }
    
    return true;
  }

  dispose() {
    // Clean up Draco loader
    if (this.dracoLoader) {
      this.dracoLoader.dispose();
    }
  }
}
