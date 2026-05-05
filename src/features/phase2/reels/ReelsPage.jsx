import { getReels } from "./reels.mock.js";

export function ReelsPage() {
  const reels = getReels();
  return (
    <div className="h-screen overflow-y-auto bg-black">
      {reels.map((reel) => (
        <section key={reel.reelId} className="flex h-screen items-center justify-center text-white">
          <video src={reel.videoUrl} className="h-[90vh] max-w-[400px] rounded-lg object-cover" muted loop controls />
        </section>
      ))}
    </div>
  );
}

