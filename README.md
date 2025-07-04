# GPU Video Player with Outline Shader

A React Three Fiber implementation of a video player with custom shader effects, featuring mask-based outline rendering and GPU-accelerated video processing.

## Features

- 🎮 **Custom Shader Pipeline**: Fragment shader with real-time video processing
- 📐 **Aspect Ratio Preservation**: Automatic aspect ratio correction for any video size
- 🎭 **Mask-based Outline**: Edge detection and outline effects using mask video
- 🎯 **Synchronized Playback**: Perfect synchronization between video and mask
- ⚛️ **React Integration**: Seamless integration with React Three Fiber
- 🚀 **GPU Accelerated**: Hardware-accelerated rendering for smooth performance

## Tech Stack

- **React Three Fiber**: React renderer for Three.js
- **Three.js**: 3D graphics library with WebGL support
- **Custom GLSL Shaders**: Fragment and vertex shaders for video effects
- **Next.js**: React framework with TypeScript support
- **Tailwind CSS**: Utility-first CSS framework

## Getting Started

### Installation

```bash
npm install
# or
yarn install
```

### Development

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Usage

### Basic Video Player

```tsx
import VideoPlayer from '@/components/VideoPlayer';

export default function MyPage() {
  return (
    <div className="w-full h-screen">
      <VideoPlayer
        videoSrc="/your-video.mp4"
        maskSrc="/your-mask.mp4"
        className="w-full h-full"
      />
    </div>
  );
}
```

### Adding Video Files

1. Place your video files in the `/public` directory
2. Ensure your mask video has the same duration as your main video
3. The mask video should use white areas for visible regions and black for transparent areas

### Customizing Shader Effects

The shader supports several customizable parameters:

```tsx
// In VideoShaderMaterial uniforms
uniforms: {
  uOutlineColor: { value: new THREE.Color(0x00ff00) }, // Green outline
  uOutlineWidth: { value: 0.01 }, // Outline width
  uOpacity: { value: 1.0 } // Overall opacity
}
```

## Architecture

### Components

- **VideoPlayer**: Main component with video controls and canvas
- **VideoMesh**: Three.js mesh with custom shader material
- **VideoShaderMaterial**: Custom shader material class
- **VideoShaderDemo**: Interactive demo without video files

### Shader Pipeline

1. **Vertex Shader**: Standard fullscreen quad vertex shader
2. **Fragment Shader**: 
   - Aspect ratio correction
   - Video texture sampling
   - Mask texture sampling
   - Edge detection for outlines
   - Color mixing and transparency

### Key Features

#### Aspect Ratio Preservation
The shader automatically handles aspect ratio correction:

```glsl
vec2 aspectCorrectUV(vec2 uv, vec2 resolution, vec2 videoRes) {
  vec2 ratio = vec2(
    min((resolution.x / resolution.y) / (videoRes.x / videoRes.y), 1.0),
    min((resolution.y / resolution.x) / (videoRes.y / videoRes.x), 1.0)
  );
  return vec2(
    uv.x * ratio.x + (1.0 - ratio.x) * 0.5,
    uv.y * ratio.y + (1.0 - ratio.y) * 0.5
  );
}
```

#### Edge Detection
The outline effect uses convolution-based edge detection:

```glsl
for(int x = -2; x <= 2; x++) {
  for(int y = -2; y <= 2; y++) {
    vec2 offset = vec2(float(x), float(y)) * texelSize * uOutlineWidth;
    vec4 sampleMask = texture2D(uMaskTexture, correctedUV + offset);
    outline += sampleMask.r;
  }
}
```

## Performance Considerations

- **GPU Acceleration**: All processing happens on the GPU
- **Efficient Texturing**: Uses VideoTexture for direct GPU upload
- **Minimized CPU Work**: React Three Fiber handles render loop optimization
- **Memory Management**: Proper cleanup of video elements and textures

## Browser Support

- **Chrome**: Full support
- **Firefox**: Full support
- **Safari**: Full support (with some limitations on autoplay)
- **Edge**: Full support

## Alternative Approaches

### Raw WebGL
- **Pros**: Maximum performance, full control
- **Cons**: Complex implementation, more code

### WebGPU
- **Pros**: Most modern API, better performance
- **Cons**: Limited browser support (Chrome 113+)

### React Three Fiber (Current Choice)
- **Pros**: React integration, good performance, maintainable
- **Cons**: Slight abstraction overhead

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Acknowledgments

- Three.js community for excellent documentation
- React Three Fiber team for the amazing React integration
- WebGL community for shader knowledge and examples
