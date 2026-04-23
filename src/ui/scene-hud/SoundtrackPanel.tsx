import { memo, useState } from "react";

export const SoundtrackPanel = memo(function SoundtrackPanel() {
  const [soundtrackOpen, setSoundtrackOpen] = useState(false);
  const [soundtrackEnabled, setSoundtrackEnabled] = useState(false);
  const [soundtrackNonce, setSoundtrackNonce] = useState(0);
  const soundtrackPlaylistId = "PLAikqLA5ubJ5lr05z7kcKE5za7T8n1sG3";
  const soundtrackEmbedSrc = `https://www.youtube.com/embed?listType=playlist&list=${soundtrackPlaylistId}&autoplay=1&loop=1&controls=1&rel=0&playsinline=1&origin=${encodeURIComponent(window.location.origin)}&nonce=${soundtrackNonce}`;

  return (
    <div className="pointer-events-auto flex flex-col items-end rounded-[1.4rem] border">
      <div className="flex flex-row">
        {soundtrackOpen ? (
          <div className="flex flex-row">
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
        ) : null}

        <div className="flex flex-col">
          <button
            type="button"
            className="flex h-12 w-12 items-center justify-between rounded-xl border border-white/15 bg-white/6 p-2 align-middle text-sm font-medium transition-colors hover:bg-white/10"
            onClick={() => setSoundtrackOpen((current) => !current)}
          >
            <span className="w-full">{soundtrackOpen ? "-" : "+"}</span>
          </button>
          <button
            type="button"
            className="rounded-xl border px-4 py-2.5 text-sm font-medium text-amber-50 transition-colors hover:bg-amber-300/22"
            onClick={() => {
              setSoundtrackEnabled(true);
              setSoundtrackNonce((current) => current + 1);
            }}
          >
            {soundtrackEnabled ? "Restart" : "Play"}
          </button>
        </div>
      </div>
    </div>
  );
});
