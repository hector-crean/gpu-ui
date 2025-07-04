# GPU Video Player with Outline Shader

A React Three Fiber implementation of a video player with custom shader effects, featuring mask-based outline rendering and GPU-accelerated video processing.



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
