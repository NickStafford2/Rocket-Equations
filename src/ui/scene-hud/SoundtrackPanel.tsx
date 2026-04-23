import { memo, useState } from "react";

export const SoundtrackPanel = memo(function SoundtrackPanel() {
  const [soundtrackOpen, setSoundtrackOpen] = useState(false);
  const [soundtrackEnabled, setSoundtrackEnabled] = useState(false);
  const [soundtrackNonce, setSoundtrackNonce] = useState(0);
  const soundtrackPlaylistId = "PLAikqLA5ubJ5lr05z7kcKE5za7T8n1sG3";
  const soundtrackEmbedSrc = `https://www.youtube.com/embed?listType=playlist&list=${soundtrackPlaylistId}&autoplay=${soundtrackEnabled ? 1 : 0}&loop=1&controls=1&rel=0&playsinline=1&origin=${encodeURIComponent(window.location.origin)}&nonce=${soundtrackNonce}`;
  const showEmbeddedPlayer = soundtrackOpen || soundtrackEnabled;

  return (
    <div className="pointer-events-auto flex flex-col items-end overflow-hidden rounded-lg border-white/50">
      <div className="flex flex-row">
        {showEmbeddedPlayer ? (
          <div
            className={
              soundtrackOpen
                ? "aspect-video w-[320px] overflow-hidden rounded-l-xl"
                : "pointer-events-none h-px w-px overflow-hidden opacity-0"
            }
          >
            <iframe
              className="h-full w-full"
              src={soundtrackEmbedSrc}
              title="Mission soundtrack"
              allow="autoplay; encrypted-media; picture-in-picture"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          </div>
        ) : (
            <!-- PROBLEM I NEVER SEE THIS EVER -->
          <div>
            {!soundtrackOpen ? (
              <span>Ambiance Playing...</span>
            ) : (
              <span>Ambiance Paused...</span>
            )}
          </div>
        )}
        <div className="flex flex-col justify-between">
          <button
            type="button"
            className="flex h-12 w-12 items-center justify-between rounded-xl border border-white/15 bg-white/6 p-2 align-middle text-sm font-medium transition-colors hover:bg-white/10"
            onClick={() => setSoundtrackOpen((current) => !current)}
          >
            <span className="w-full">{soundtrackOpen ? "-" : "+"}</span>
          </button>
        </div>
      </div>
    </div>
  );
});
