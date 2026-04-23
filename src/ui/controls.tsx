import { useState } from "react";

export function Controls() {
  const soundtrackPlaylistId = "PLAikqLA5ubJ5lr05z7kcKE5za7T8n1sG3";
  const [soundtrackEnabled, setSoundtrackEnabled] = useState(false);
  const [soundtrackNonce, setSoundtrackNonce] = useState(0);

  const soundtrackEmbedSrc = `https://www.youtube.com/embed?listType=playlist&list=${soundtrackPlaylistId}&autoplay=1&loop=1&controls=1&rel=0&playsinline=1&origin=${encodeURIComponent(window.location.origin)}&nonce=${soundtrackNonce}`;

  return (
    <div className="space-y-4 rounded-[2rem] border border-white/10 bg-[#07111f]/85 p-4 shadow-[0_24px_72px_rgba(0,0,0,0.32)] backdrop-blur">
      <button
        type="button"
        className="w-full rounded-2xl border border-amber-200/25 bg-amber-300/14 px-4 py-3 text-sm font-medium text-amber-50 transition-colors hover:bg-amber-300/22"
        onClick={() => {
          setSoundtrackEnabled(true);
          setSoundtrackNonce((current) => current + 1);
        }}
      >
        {soundtrackEnabled ? "Restart soundtrack loop" : "Play soundtrack loop"}
      </button>

      {soundtrackEnabled ? (
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/35">
          <div className="aspect-video">
            <iframe
              className="h-full w-full"
              src={soundtrackEmbedSrc}
              title="Mission soundtrack"
              allow="autoplay; encrypted-media; picture-in-picture"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 px-4 py-5 text-sm leading-6 text-slate-400">
          The player loads after you click the button so the browser will allow
          playback to start immediately.
        </div>
      )}
    </div>
  );
}
