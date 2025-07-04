'use client';

import { useVideoTexture } from '@react-three/drei';
import { Canvas, extend, useFrame } from '@react-three/fiber';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

// Custom shader material
class VideoShaderMaterial extends THREE.ShaderMaterial {
    constructor() {
        super({
            uniforms: {
                uVideoTexture: { value: null },
                uMaskTexture: { value: null },
                uTime: { value: 0 },
                uResolution: { value: new THREE.Vector2(1, 1) },
                uVideoResolution: { value: new THREE.Vector2(1, 1) },
                uOutlineColor: { value: new THREE.Color(0x00ff00) },
                uOutlineWidth: { value: 0.01 },
                uOpacity: { value: 1.0 }
            },
            vertexShader: /*glsl*/`
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
            fragmentShader: /*glsl*/`
        uniform sampler2D uVideoTexture;
        uniform sampler2D uMaskTexture;
        uniform float uTime;
        uniform vec2 uResolution;
        uniform vec2 uVideoResolution;
        uniform vec3 uOutlineColor;
        uniform float uOutlineWidth;
        uniform float uOpacity;
        
        varying vec2 vUv;
        
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
        
        void main() {
          vec2 correctedUV = aspectCorrectUV(vUv, uResolution, uVideoResolution);
          
          // Sample the main video texture
          vec4 videoColor = texture2D(uVideoTexture, correctedUV);
          
          // Sample the mask texture
          vec4 maskColor = texture2D(uMaskTexture, correctedUV);

          float mask = maskColor.r; // Use red channel as mask
                    
          // Create outline effect
          vec2 texelSize = 1.0 / uVideoResolution;
          
          vec3 red = vec3(1.0, 0.0, 0.0);
         vec3 color = mix(videoColor.rgb, red, mask);
          
          gl_FragColor = vec4(color, 1.0);
        }
      `,
            transparent: true,
            side: THREE.DoubleSide
        });
    }
}

// Extend R3F to include our custom material
extend({ VideoShaderMaterial });

// Declare the custom material for TypeScript
declare module '@react-three/fiber' {
    interface ThreeElements {
        videoShaderMaterial: any;
    }
}

interface VideoMeshProps {
    videoSrc: string;
    maskSrc: string;
    onVideoLoad?: (video: HTMLVideoElement) => void;
    onVideoError?: (error: string) => void;
}

const VideoMesh = React.memo(React.forwardRef<THREE.Mesh, VideoMeshProps>(function VideoMesh({ videoSrc, maskSrc, onVideoLoad, onVideoError }, ref) {
    const materialRef = useRef<VideoShaderMaterial>(null);
    const syncIntervalRef = useRef<number | null>(null);
    const [bothVideosReady, setBothVideosReady] = useState(false);

    const videoTexture = useVideoTexture(videoSrc, {
        crossOrigin: 'anonymous',
        muted: true,
        loop: true,
        start: false, // Don't auto-start
        playsInline: true,
    });

    const maskTexture = useVideoTexture(maskSrc, {
        crossOrigin: 'anonymous',
        muted: true,
        loop: true,
        start: false, // Don't auto-start
        playsInline: true,
    });

    // Get video elements from textures
    const videoElement = videoTexture.image as HTMLVideoElement;
    const maskElement = maskTexture.image as HTMLVideoElement;

    // Check if both videos are ready
    useEffect(() => {
        if (videoElement && maskElement) {
            const checkReady = () => {
                const videoReady = videoElement.readyState >= 3; // HAVE_FUTURE_DATA
                const maskReady = maskElement.readyState >= 3;

                if (videoReady && maskReady && !bothVideosReady) {
                    setBothVideosReady(true);
                    console.log('Both videos are ready for synchronized playback');
                }
            };

            videoElement.addEventListener('canplay', checkReady);
            maskElement.addEventListener('canplay', checkReady);

            // Check immediately in case they're already ready
            checkReady();

            return () => {
                videoElement.removeEventListener('canplay', checkReady);
                maskElement.removeEventListener('canplay', checkReady);
            };
        }
    }, [videoElement, maskElement, bothVideosReady]);

    // Sync function to keep videos aligned
    const syncVideos = useCallback(() => {
        if (!videoElement || !maskElement) return;

        const mainTime = videoElement.currentTime;
        const maskTime = maskElement.currentTime;
        const timeDiff = Math.abs(mainTime - maskTime);

        // If videos are more than 100ms apart, sync them
        const SYNC_THRESHOLD = 0.1; // 100ms

        if (timeDiff > SYNC_THRESHOLD) {
            console.log(`Videos out of sync by ${timeDiff.toFixed(3)}s, correcting...`);

            // Use the main video as the master, sync mask to it
            maskElement.currentTime = mainTime;
        }
    }, [videoElement, maskElement]);

    // Start sync monitoring when playing
    const startSyncMonitoring = useCallback(() => {
        if (syncIntervalRef.current) {
            clearInterval(syncIntervalRef.current);
        }

        // Check sync every 500ms while playing
        syncIntervalRef.current = window.setInterval(syncVideos, 500);
    }, [syncVideos]);

    // Stop sync monitoring
    const stopSyncMonitoring = useCallback(() => {
        if (syncIntervalRef.current) {
            clearInterval(syncIntervalRef.current);
            syncIntervalRef.current = null;
        }
    }, []);

    useEffect(() => {
        // Set up event listeners when video elements are available
        if (videoElement && maskElement) {
            const handleVideoLoad = () => {
                console.log('Main video loaded:', {
                    width: videoElement.videoWidth,
                    height: videoElement.videoHeight,
                    duration: videoElement.duration
                });
                onVideoLoad?.(videoElement);
            };

            const handleVideoError = (e: Event) => {
                console.error('Main video error:', e, videoElement.error);
                onVideoError?.(`Main video error: ${videoElement.error?.message || 'Unknown error'}`);
            };

            const handleMaskError = (e: Event) => {
                console.error('Mask video error:', e, maskElement.error);
                onVideoError?.(`Mask video error: ${maskElement.error?.message || 'Unknown error'}`);
            };

            // Add event listeners
            videoElement.addEventListener('loadedmetadata', handleVideoLoad);
            videoElement.addEventListener('error', handleVideoError);
            maskElement.addEventListener('error', handleMaskError);

            // If videos are already loaded, trigger the callback
            if (videoElement.readyState >= 1) {
                handleVideoLoad();
            }

            return () => {
                videoElement.removeEventListener('loadedmetadata', handleVideoLoad);
                videoElement.removeEventListener('error', handleVideoError);
                maskElement.removeEventListener('error', handleMaskError);
                stopSyncMonitoring();
            };
        }
    }, [videoElement, maskElement, onVideoLoad, onVideoError, stopSyncMonitoring]);

    useFrame((state) => {
        if (materialRef.current) {
            materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
        }
    });

    useEffect(() => {
        if (materialRef.current && videoTexture && maskTexture) {
            materialRef.current.uniforms.uVideoTexture.value = videoTexture;
            materialRef.current.uniforms.uMaskTexture.value = maskTexture;

            materialRef.current.uniforms.uVideoResolution.value.set(
                videoTexture.image.videoWidth || 1920,
                videoTexture.image.videoHeight || 1080
            );
        }
    }, [videoTexture, maskTexture]);

    useEffect(() => {
        const handleResize = () => {
            if (materialRef.current) {
                materialRef.current.uniforms.uResolution.value.set(
                    window.innerWidth,
                    window.innerHeight
                );
            }
        };

        window.addEventListener('resize', handleResize);
        handleResize();

        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const playVideo = useCallback(async () => {
        if (!videoElement || !maskElement || !bothVideosReady) {
            console.warn('Videos not ready for synchronized playback');
            return;
        }

        try {
            // Ensure both videos start from the same time
            const startTime = 0; // or videoElement.currentTime if you want to resume
            videoElement.currentTime = startTime;
            maskElement.currentTime = startTime;

            // Start both videos as close together as possible
            const playPromises = [
                videoElement.play(),
                maskElement.play()
            ];

            await Promise.all(playPromises);

            // Start monitoring sync after both are playing
            startSyncMonitoring();

            console.log('Synchronized playback started');
        } catch (err) {
            console.error('Error starting synchronized playback:', err);
            onVideoError?.(`Playback error: ${err}`);
        }
    }, [videoElement, maskElement, bothVideosReady, startSyncMonitoring, onVideoError]);

    const pauseVideo = useCallback(() => {
        if (videoElement && maskElement) {
            // Stop sync monitoring first
            stopSyncMonitoring();

            // Pause both videos
            videoElement.pause();
            maskElement.pause();

            console.log('Synchronized playback paused');
        }
    }, [videoElement, maskElement, stopSyncMonitoring]);

    const seekTo = useCallback((time: number) => {
        if (videoElement && maskElement) {
            videoElement.currentTime = time;
            maskElement.currentTime = time;
            console.log(`Seeked to ${time.toFixed(2)}s`);
        }
    }, [videoElement, maskElement]);

    // Expose play/pause/seek functions to parent via imperative handle
    useEffect(() => {
        if (ref && typeof ref === 'object' && ref.current) {
            (ref.current as any).playVideo = playVideo;
            (ref.current as any).pauseVideo = pauseVideo;
            (ref.current as any).seekTo = seekTo;
            (ref.current as any).getVideoElement = () => videoElement;
            (ref.current as any).getMaskElement = () => maskElement;
            (ref.current as any).bothVideosReady = bothVideosReady;
        }
    }, [playVideo, pauseVideo, seekTo, ref, videoElement, maskElement, bothVideosReady]);

    return (
        <group>
            <mesh ref={ref} onClick={playVideo}>
                <planeGeometry args={[4, 2.25]} />
                <videoShaderMaterial
                    ref={materialRef}
                    transparent
                    side={THREE.DoubleSide}
                />
            </mesh>
        </group>
    );
}));

interface VideoPlayerProps {
    videoSrc: string;
    maskSrc: string;
    className?: string;
}

export default function VideoPlayer({ videoSrc, maskSrc, className = '' }: VideoPlayerProps) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentVideo, setCurrentVideo] = useState<HTMLVideoElement | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loadingStatus, setLoadingStatus] = useState<string>('Loading...');
    const [videosReady, setVideosReady] = useState(false);
    const videoMeshRef = useRef<THREE.Mesh>(null);

    const handleVideoLoad = useCallback((video: HTMLVideoElement) => {
        setCurrentVideo(video);
        setLoadingStatus('Videos loaded successfully');
        setError(null);
    }, []);

    const handleVideoError = useCallback((error: string) => {
        setError(error);
        setLoadingStatus('Error loading videos');
    }, []);

    // Check video readiness periodically
    useEffect(() => {
        const checkReadiness = () => {
            if (videoMeshRef.current) {
                const mesh = videoMeshRef.current as any;
                const ready = mesh.bothVideosReady;
                if (ready !== videosReady) {
                    setVideosReady(ready);
                    if (ready) {
                        setLoadingStatus('Videos synchronized and ready');
                    }
                }
            }
        };

        const interval = setInterval(checkReadiness, 100);
        return () => clearInterval(interval);
    }, [videosReady]);

    const togglePlayPause = useCallback(() => {
        if (videoMeshRef.current && videosReady) {
            const mesh = videoMeshRef.current as any;
            if (isPlaying) {
                mesh.pauseVideo?.();
            } else {
                mesh.playVideo?.();
            }
            setIsPlaying(!isPlaying);
        }
    }, [isPlaying, videosReady]);

    const seekToTime = useCallback((time: number) => {
        if (videoMeshRef.current && videosReady) {
            const mesh = videoMeshRef.current as any;
            mesh.seekTo?.(time);
        }
    }, [videosReady]);

    return (
        <div className={`relative w-full h-full ${className}`}>
            <Canvas
                camera={{ position: [0, 0, 3], fov: 75 }}
                style={{ width: '100%', height: '100%' }}
            >
                <ambientLight intensity={0.5} />
                <VideoMesh
                    ref={videoMeshRef}
                    videoSrc={videoSrc}
                    maskSrc={maskSrc}
                    onVideoLoad={handleVideoLoad}
                    onVideoError={handleVideoError}
                />
            </Canvas>

            {/* Status Display */}
            <div className="absolute top-4 right-4 bg-black/70 text-white px-3 py-2 rounded text-sm">
                {error ? (
                    <div className="text-red-400">❌ {error}</div>
                ) : videosReady ? (
                    <div className="text-green-400">✅ {loadingStatus}</div>
                ) : (
                    <div className="text-yellow-400">⏳ {loadingStatus}</div>
                )}
            </div>

            {/* Debug Info */}
            <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-2 rounded text-xs">
                <div>Main: {videoSrc.split('/').pop()}</div>
                <div>Mask: {maskSrc.split('/').pop()}</div>
                <div>Status: {isPlaying ? 'Playing' : 'Paused'}</div>
                <div>Ready: {videosReady ? 'Yes' : 'No'}</div>
                <div>Sync: {videosReady && isPlaying ? 'Active' : 'Inactive'}</div>
            </div>

            {/* Controls */}
            <div className="absolute bottom-4 left-4 right-4 flex justify-center gap-4">
                <button
                    onClick={togglePlayPause}
                    className={`px-6 py-3 text-white rounded-lg transition-colors ${videosReady
                        ? 'bg-black/50 hover:bg-black/70'
                        : 'bg-gray-500/50 cursor-not-allowed'
                        }`}
                    disabled={!videosReady}
                >
                    {isPlaying ? 'Pause' : 'Play'}
                </button>

                {/* Quick seek buttons */}
                {videosReady && (
                    <div className="flex gap-1">
                        <button
                            onClick={() => seekToTime(0)}
                            className="px-3 py-2 bg-gray-600/50 text-white rounded text-sm hover:bg-gray-600/70 transition-colors"
                        >
                            Start
                        </button>
                        <button
                            onClick={() => seekToTime(5)}
                            className="px-3 py-2 bg-gray-600/50 text-white rounded text-sm hover:bg-gray-600/70 transition-colors"
                        >
                            5s
                        </button>
                        <button
                            onClick={() => seekToTime(10)}
                            className="px-3 py-2 bg-gray-600/50 text-white rounded text-sm hover:bg-gray-600/70 transition-colors"
                        >
                            10s
                        </button>
                    </div>
                )}

                {/* Test Video Links */}
                <div className="flex gap-2">
                    <a
                        href={videoSrc}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-2 bg-blue-500/50 text-white rounded text-sm hover:bg-blue-500/70 transition-colors"
                    >
                        Test Main Video
                    </a>
                    <a
                        href={maskSrc}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-2 bg-purple-500/50 text-white rounded text-sm hover:bg-purple-500/70 transition-colors"
                    >
                        Test Mask Video
                    </a>
                </div>
            </div>
        </div>
    );
} 