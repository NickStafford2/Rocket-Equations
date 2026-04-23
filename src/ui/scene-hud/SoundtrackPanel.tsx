import { memo, useState } from "react";

export const SoundtrackPanel = memo(function SoundtrackPanel() {
  const [soundtrackOpen, setSoundtrackOpen] = useState(false);
  const [soundtrackEnabled, setSoundtrackEnabled] = useState(false);
  const [soundtrackNonce, setSoundtrackNonce] = useState(0);
  const soundtrackPlaylistId = "PLAikqLA5ubJ5lr05z7kcKE5za7T8n1sG3";
  const soundtrackEmbedSrc = `https://www.youtube.com/embed?listType=playlist&list=${soundtrackPlaylistId}&autoplay=1&loop=1&controls=1&rel=0&playsinline=1&origin=${encodeURIComponent(window.location.origin)}&nonce=${soundtrackNonce}`;

  return (
    <div className="pointer-events-auto w-[min(320px,calc(100vw-2.5rem))] rounded-[1.4rem] border border-white/12 bg-[#07111f]/35 p-3 shadow-[0_24px_60px_rgba(0,0,0,0.24)] backdrop-blur-md">
      <button
        type="button"
        className="flex w-full items-center justify-between rounded-xl border border-white/15 bg-white/6 px-3 py-2 text-left text-sm font-medium text-slate-100 transition-colors hover:bg-white/10"
        onClick={() => setSoundtrackOpen((current) => !current)}
      >
        <span className="tracking-[0.18em] uppercase text-slate-300">
          Soundtrack
        </span>
        <span className="text-xs text-amber-100">
          {soundtrackOpen ? "Hide" : "Show"}
        </span>
      </button>

      {soundtrackOpen ? (
        <div className="mt-3 space-y-3">
          <button
            type="button"
            className="w-full rounded-xl border border-amber-200/25 bg-amber-300/14 px-4 py-2.5 text-sm font-medium text-amber-50 transition-colors hover:bg-amber-300/22"
            onClick={() => {
              setSoundtrackEnabled(true);
              setSoundtrackNonce((current) => current + 1);
            }}
          >
            {soundtrackEnabled
              ? "Restart soundtrack loop"
              : "Play soundtrack loop"}
          </button>

          {soundtrackEnabled ? (
            <div className="overflow-hidden rounded-xl border border-white/10 bg-black/35">
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
            <div className="rounded-xl border border-dashed border-white/10 bg-black/20 px-3 py-4 text-sm leading-6 text-slate-400">
              The player loads after you click the button so playback can start
              immediately.
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
});
