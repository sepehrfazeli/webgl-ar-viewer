export class WebXRUtils {
  static async checkWebXRSupport() {
    if (!('xr' in navigator)) {
      return {
        supported: false,
        reason: 'WebXR not available in this browser'
      };
    }

    try {
      const isARSupported = await navigator.xr.isSessionSupported('immersive-ar');
      const isVRSupported = await navigator.xr.isSessionSupported('immersive-vr');
      
      return {
        supported: isARSupported || isVRSupported,
        ar: isARSupported,
        vr: isVRSupported,
        reason: isARSupported || isVRSupported ? 'WebXR supported' : 'No XR sessions supported'
      };
    } catch (error) {
      return {
        supported: false,
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
