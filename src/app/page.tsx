import VideoPlayer from '@/components/VideoPlayer';

export default function Home() {
  return (
    <div className="min-h-screen bg-black">
      <div className="aspect-video bg-black rounded-lg overflow-hidden">
        <VideoPlayer
          videoSrc="/Scene_8.1.mp4"
          maskSrc="/Scene_8.1-masked.mp4"
          className="w-full h-full"
        />
      </div>
    </div>
  );
}
