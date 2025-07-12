# WebGL/AR 3D Model Viewer

A web-based 3D model viewer with AR integration that allows users to load and display CAD models in both desktop and augmented reality modes.

## Features

- **3D Model Loading**: Support for glTF (.glb, .gltf) and STL formats
- **Desktop Viewing**: Orbit controls for mouse/touch interaction
- **AR Mode**: WebXR-based augmented reality for real-world model placement
- **Responsive Design**: Works on both desktop and mobile devices
- **Drag & Drop**: Easy model loading via drag and drop
- **Real-time Rendering**: Smooth 3D graphics powered by Three.js

## Tech Stack

- **Frontend**: Vite + Vanilla JavaScript
- **3D Graphics**: Three.js
- **AR**: WebXR Device API
- **Build Tool**: Vite
- **Package Manager**: npm

## Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- Modern web browser with WebGL support
- For AR features: WebXR-compatible device (Android Chrome, iOS Safari)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd WebGL_parctice
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`


## Usage

### Loading 3D Models

1. **File Upload**: Click the file input button and select a 3D model file
2. **Drag & Drop**: Drag a model file directly onto the viewer area
3. **Supported Formats**: 
   - glTF Binary (.glb)
   - glTF JSON (.gltf)
   - STL (.stl)

### Desktop Viewing

- **Rotate**: Click and drag to rotate the view
- **Zoom**: Scroll or pinch to zoom in/out
- **Pan**: Right-click and drag to pan the view

### AR Mode

1. Load a 3D model first
2. Click the "Enter AR Mode" button
3. Point your device at a flat surface
4. Tap when the green reticle appears to place the model
5. Click "Exit AR" to return to desktop mode

## Project Structure

```
src/
├── components/
│   ├── ModelViewer.js    # Main 3D viewer class
│   └── ARMode.js         # AR functionality
├── utils/
│   ├── ModelLoader.js    # Model loading utilities
│   └── WebXRUtils.js     # WebXR helper functions
├── assets/               # 3D models and textures
├── main.js              # Application entry point
└── style.css            # Styles
```

## Browser Support

### Desktop Viewing
- Chrome 90+
- Firefox 85+
- Safari 14+
- Edge 90+

### AR Mode
- Android Chrome 88+ (with WebXR support)
- iOS Safari 14.5+ (with WebXR support)
- *Note: AR functionality requires WebXR-compatible devices*

## Development

### Adding New Model Formats

1. Install the appropriate Three.js loader
2. Extend the `ModelLoader` class
3. Update the file validation logic

### Customizing AR Experience

Modify the `ARMode` class to add:
- Custom placement logic
- Model scaling controls
- Additional AR features

### Performance Optimization

- Use compressed texture formats
- Implement model LOD (Level of Detail)
- Add instancing for multiple models
- Optimize lighting and shadows

## Troubleshooting

### Common Issues

1. **AR Mode Not Available**
   - Ensure HTTPS connection (required for WebXR)
   - Check device compatibility
   - Verify browser WebXR support

2. **Model Loading Errors**
   - Check file format compatibility
   - Verify file size (max 50MB)
   - Ensure proper file structure

3. **Performance Issues**
   - Reduce model complexity
   - Optimize texture sizes
   - Close other browser tabs

### Debug Information

Enable debug mode by opening browser console. The app will display WebXR compatibility information.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Resources

- [Three.js Documentation](https://threejs.org/docs/)
- [WebXR Device API](https://developer.mozilla.org/en-US/docs/Web/API/WebXR_Device_API)
- [glTF Format](https://www.khronos.org/gltf/)
- [Vite Documentation](https://vite.dev/)

## Sample Models

You can find free 3D models for testing at:
- [Sketchfab](https://sketchfab.com/3d-models?features=downloadable)
- [glTF Sample Models](https://github.com/KhronosGroup/glTF-Sample-Models)
- [Thingiverse](https://www.thingiverse.com/) (for STL files)
