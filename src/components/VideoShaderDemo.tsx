'use client';

import { Canvas, extend, useFrame } from '@react-three/fiber';
import { useRef, useState } from 'react';
import * as THREE from 'three';

// Demo shader material that creates animated patterns
class DemoShaderMaterial extends THREE.ShaderMaterial {
    constructor() {
        super({
            uniforms: {
                uTime: { value: 0 },
                uResolution: { value: new THREE.Vector2(1, 1) },
                uOutlineColor: { value: new THREE.Color(0x00ff00) },
                uOutlineWidth: { value: 0.02 }
            },
            vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
            fragmentShader: `
        uniform float uTime;
        uniform vec2 uResolution;
        uniform vec3 uOutlineColor;
        uniform float uOutlineWidth;
        
        varying vec2 vUv;
        
        void main() {
          vec2 uv = vUv;
          
          // Create animated pattern for "video"
          vec3 color = vec3(0.0);
          float pattern = sin(uv.x * 10.0 + uTime) * sin(uv.y * 10.0 + uTime * 0.5);
          color = mix(vec3(0.2, 0.4, 0.8), vec3(0.8, 0.2, 0.4), pattern * 0.5 + 0.5);
          
          // Create mask pattern
          float mask = smoothstep(0.3, 0.7, sin(uv.x * 5.0 + uTime * 2.0) * cos(uv.y * 5.0 + uTime * 1.5));
          
          // Edge detection for outline
          vec2 texelSize = uOutlineWidth / uResolution;
          float outline = 0.0;
          
          // Sample surrounding pixels
          for(int x = -1; x <= 1; x++) {
            for(int y = -1; y <= 1; y++) {
              vec2 offset = vec2(float(x), float(y)) * texelSize;
              float sampleMask = smoothstep(0.3, 0.7, sin((uv.x + offset.x) * 5.0 + uTime * 2.0) * cos((uv.y + offset.y) * 5.0 + uTime * 1.5));
              outline += sampleMask;
            }
          }
          
          outline = outline / 9.0;
          float edge = abs(mask - outline);
          edge = smoothstep(0.1, 0.3, edge);
          
          // Apply outline effect
          vec3 finalColor = mix(color, uOutlineColor, edge * mask);
          
          // Apply mask to final alpha
          float finalAlpha = mask;
          
          gl_FragColor = vec4(finalColor, finalAlpha);
        }
      `,
            transparent: true
        });
    }
}

extend({ DemoShaderMaterial });

declare module '@react-three/fiber' {
    interface ThreeElements {
        demoShaderMaterial: any;
    }
}

function DemoMesh() {
    const materialRef = useRef<DemoShaderMaterial>(null);

    useFrame((state) => {
        if (materialRef.current) {
            materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
        }
    });

    return (
        <mesh>
            <planeGeometry args={[4, 2.25]} />
            <demoShaderMaterial ref={materialRef} transparent />
        </mesh>
    );
}

export default function VideoShaderDemo() {
    const [outlineColor, setOutlineColor] = useState('#00ff00');

    return (
        <div className="w-full h-full">
            <Canvas
                camera={{ position: [0, 0, 3], fov: 75 }}
                style={{ width: '100%', height: '100%' }}
            >
                <DemoMesh />
            </Canvas>

            <div className="absolute top-4 left-4 bg-black/50 p-4 rounded-lg">
                <label className="text-white text-sm mb-2 block">
                    Outline Color:
                </label>
                <input
                    type="color"
                    value={outlineColor}
                    onChange={(e) => setOutlineColor(e.target.value)}
                    className="w-16 h-8 rounded border-0"
                />
            </div>
        </div>
    );
} 