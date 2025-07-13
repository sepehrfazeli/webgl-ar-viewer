export class WebXRUtils {
  static async checkWebXRSupport() {
    const userAgent = navigator.userAgent;
    const isHTTPS = location.protocol === 'https:' || location.hostname === 'localhost';
    
    // Enhanced detection with more detailed information
    if (!isHTTPS) {
      return {
        supported: false,
        ar: false,
        vr: false,
        reason: 'HTTPS required for WebXR (except localhost)'
      };
    }

    if (!('xr' in navigator)) {
      // Check for specific browsers and provide helpful messages
      if (/iPhone|iPad|iPod/i.test(userAgent)) {
        const iOSVersion = userAgent.match(/OS (\d+)_(\d+)/);
        const majorVersion = iOSVersion ? parseInt(iOSVersion[1]) : 0;
        
        if (majorVersion >= 14) {
          return {
            supported: false,
            ar: false,
            vr: false,
            reason: `iOS ${majorVersion}: WebXR support is experimental. Try: Settings > Safari > Advanced > Experimental Features > Enable WebXR Device API`
          };
        } else {
          return {
            supported: false,
            ar: false,
            vr: false,
            reason: `iOS ${majorVersion}: WebXR requires iOS 14.5+ and experimental features enabled`
          };
        }
      } else if (/Android/i.test(userAgent)) {
        if (/Chrome/i.test(userAgent)) {
          return {
            supported: false,
            ar: false,
            vr: false,
            reason: 'Android Chrome: WebXR not detected. Try updating Chrome or enabling WebXR flags'
          };
        } else {
          return {
            supported: false,
            ar: false,
            vr: false,
            reason: 'Android: WebXR requires Chrome 88+ or other WebXR-enabled browser'
          };
        }
      } else {
        return {
          supported: false,
          ar: false,
          vr: false,
          reason: 'WebXR not available in this browser'
        };
      }
    }

    try {
      // Try to check AR support
      const isARSupported = await navigator.xr.isSessionSupported('immersive-ar');
      const isVRSupported = await navigator.xr.isSessionSupported('immersive-vr');
      
      return {
        supported: isARSupported || isVRSupported,
        ar: isARSupported,
        vr: isVRSupported,
        reason: isARSupported || isVRSupported ? 'WebXR supported' : 'No XR sessions supported by this device'
      };
    } catch (error) {
      console.error('WebXR support check error:', error);
      
      // Provide more specific error messages
      if (error.name === 'NotSupportedError') {
        return {
          supported: false,
          ar: false,
          vr: false,
          reason: 'WebXR features not supported on this device'
        };
      }
      
      return {
        supported: false,
        ar: false,
        vr: false,
        reason: `WebXR check failed: ${error.message}`
      };
    }
  }

  static async requestARSession(options = {}) {
    const defaultOptions = {
      requiredFeatures: ['hit-test'],
      optionalFeatures: ['dom-overlay', 'light-estimation'],
      domOverlay: { root: document.body }
    };

    const sessionOptions = { ...defaultOptions, ...options };

    try {
      const session = await navigator.xr.requestSession('immersive-ar', sessionOptions);
      return session;
    } catch (error) {
      throw new Error(`Failed to request AR session: ${error.message}`);
    }
  }

  static async requestVRSession(options = {}) {
    const defaultOptions = {
      optionalFeatures: ['local-floor', 'bounded-floor', 'hand-tracking']
    };

    const sessionOptions = { ...defaultOptions, ...options };

    try {
      const session = await navigator.xr.requestSession('immersive-vr', sessionOptions);
      return session;
    } catch (error) {
      throw new Error(`Failed to request VR session: ${error.message}`);
    }
  }

  static getXRSupportedFeatures() {
    return {
      required: ['hit-test'],
      optional: [
        'dom-overlay',
        'light-estimation',
        'local-floor',
        'bounded-floor',
        'hand-tracking',
        'anchors',
        'depth-sensing'
      ]
    };
  }

  static displayWebXRInfo() {
    const info = {
      userAgent: navigator.userAgent,
      xrSupported: 'xr' in navigator,
      httpsRequired: location.protocol === 'https:',
      localHostAllowed: location.hostname === 'localhost' || location.hostname === '127.0.0.1'
    };

    return info;
  }

  static createWebXRButton(container, options = {}) {
    const button = document.createElement('button');
    button.textContent = options.text || 'Enter AR';
    button.disabled = true;
    button.style.cssText = `
      padding: 10px 20px;
      background-color: #007bff;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      margin: 5px;
    `;

    // Check support and update button
    this.checkWebXRSupport().then(support => {
      if (support.ar) {
        button.disabled = false;
        button.onclick = options.onClick;
      } else {
        button.disabled = true;
        button.textContent = 'AR Not Supported';
        button.title = support.reason;
      }
    });

    if (container) {
      container.appendChild(button);
    }

    return button;
  }

  static showWebXRError(message, container) {
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
      padding: 10px;
      background-color: #ffebee;
      color: #c62828;
      border-radius: 4px;
      margin: 10px 0;
    `;
    errorDiv.textContent = message;

    if (container) {
      container.appendChild(errorDiv);
    }

    return errorDiv;
  }

  static showWebXRInfo(container) {
    const info = this.displayWebXRInfo();
    const infoDiv = document.createElement('div');
    infoDiv.style.cssText = `
      padding: 10px;
      background-color: #e3f2fd;
      color: #1976d2;
      border-radius: 4px;
      margin: 10px 0;
      font-size: 12px;
    `;
    
    infoDiv.innerHTML = `
      <strong>WebXR Debug Info:</strong><br>
      XR Supported: ${info.xrSupported ? 'Yes' : 'No'}<br>
      HTTPS: ${info.httpsRequired ? 'Yes' : 'No'}<br>
      Local Host: ${info.localHostAllowed ? 'Yes' : 'No'}<br>
      User Agent: ${info.userAgent.substring(0, 50)}...
    `;

    if (container) {
      container.appendChild(infoDiv);
    }

    return infoDiv;
  }
}
