'use client';

import { useRef, useState } from 'react';

export default function VideoTest() {
    const [mainVideoError, setMainVideoError] = useState<string | null>(null);
    const [maskVideoError, setMaskVideoError] = useState<string | null>(null);
    const mainVideoRef = useRef<HTMLVideoElement>(null);
    const maskVideoRef = useRef<HTMLVideoElement>(null);

    const handleMainVideoError = (e: React.SyntheticEvent<HTMLVideoElement>) => {
        const video = e.currentTarget;
        setMainVideoError(`Error: ${video.error?.message || 'Unknown error'}`);
        console.error('Main video error:', video.error);
    };

    const handleMaskVideoError = (e: React.SyntheticEvent<HTMLVideoElement>) => {
        const video = e.currentTarget;
        setMaskVideoError(`Error: ${video.error?.message || 'Unknown error'}`);
        console.error('Mask video error:', video.error);
    };

    const handleMainVideoLoad = (e: React.SyntheticEvent<HTMLVideoElement>) => {
        const video = e.currentTarget;
        console.log('Main video loaded:', {
            width: video.videoWidth,
            height: video.videoHeight,
            duration: video.duration
        });
        setMainVideoError(null);
    };

    const handleMaskVideoLoad = (e: React.SyntheticEvent<HTMLVideoElement>) => {
        const video = e.currentTarget;
        console.log('Mask video loaded:', {
            width: video.videoWidth,
            height: video.videoHeight,
            duration: video.duration
        });
        setMaskVideoError(null);
    };

    const syncPlay = () => {
        if (mainVideoRef.current && maskVideoRef.current) {
            mainVideoRef.current.play();
            maskVideoRef.current.play();
        }
    };

    const syncPause = () => {
        if (mainVideoRef.current && maskVideoRef.current) {
            mainVideoRef.current.pause();
            maskVideoRef.current.pause();
        }
    };

    return (
        <div className="p-6 bg-gray-900 rounded-lg">
            <h2 className="text-white text-2xl mb-4">Video Test</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                    <h3 className="text-white text-lg mb-2">Main Video</h3>
                    <video
                        ref={mainVideoRef}
                        src="/Scene_8.1.mp4"
                        controls
                        loop
                        muted
                        className="w-full h-auto bg-black"
                        onError={handleMainVideoError}
                        onLoadedMetadata={handleMainVideoLoad}
                    />
                    {mainVideoError && (
                        <div className="text-red-400 text-sm mt-2">{mainVideoError}</div>
                    )}
                </div>

                <div>
                    <h3 className="text-white text-lg mb-2">Mask Video</h3>
                    <video
                        ref={maskVideoRef}
                        src="/Scene_8.1-masked.mp4"
                        controls
                        loop
                        muted
                        className="w-full h-auto bg-black"
                        onError={handleMaskVideoError}
                        onLoadedMetadata={handleMaskVideoLoad}
                    />
                    {maskVideoError && (
                        <div className="text-red-400 text-sm mt-2">{maskVideoError}</div>
                    )}
                </div>
            </div>

            <div className="flex gap-4 justify-center">
                <button
                    onClick={syncPlay}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                    Play Both
                </button>
                <button
                    onClick={syncPause}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                    Pause Both
                </button>
            </div>

            <div className="mt-4 text-sm text-gray-400">
                <p>This test uses standard HTML video elements to verify your video files work properly.</p>
                <p>Check the browser console for detailed information about video loading.</p>
            </div>
        </div>
    );
} 