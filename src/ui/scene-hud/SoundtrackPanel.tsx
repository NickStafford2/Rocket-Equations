import { memo, useEffect, useRef, useState } from "react";

type YoutubePlayerState = "idle" | "playing" | "paused" | "buffering";

type YoutubeNamespace = {
  Player: new (
    element: HTMLElement,
    config: {
      height?: string;
      width?: string;
      videoId?: string;
      playerVars?: Record<string, number | string>;
      events?: {
        onReady?: () => void;
        onStateChange?: (event: { data: number }) => void;
      };
    },
  ) => YoutubePlayer;
  PlayerState: {
    PLAYING: number;
    PAUSED: number;
    BUFFERING: number;
  };
};

type YoutubePlayer = {
  destroy: () => void;
};

declare global {
  interface Window {
    YT?: YoutubeNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let youtubeApiPromise: Promise<YoutubeNamespace> | null = null;

function loadYoutubeApi(): Promise<YoutubeNamespace> {
  if (window.YT?.Player) {
    return Promise.resolve(window.YT);
  }

  if (youtubeApiPromise) {
    return youtubeApiPromise;
  }

  youtubeApiPromise = new Promise((resolve) => {
    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[src="https://www.youtube.com/iframe_api"]',
    );

    const previousReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previousReady?.();
      if (window.YT) {
        resolve(window.YT);
      }
    };

    if (!existingScript) {
      const script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(script);
    } else if (window.YT?.Player) {
      resolve(window.YT);
    }
  });

  return youtubeApiPromise;
}

export const SoundtrackPanel = memo(function SoundtrackPanel() {
  const [soundtrackOpen, setSoundtrackOpen] = useState(false);
  const [playerState, setPlayerState] = useState<YoutubePlayerState>("idle");
  const playerHostRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<YoutubePlayer | null>(null);
  const soundtrackPlaylistId = "PLAikqLA5ubJ5lr05z7kcKE5za7T8n1sG3";

  useEffect(() => {
    let disposed = false;

    async function setupPlayer() {
      const host = playerHostRef.current;
      if (!host || playerRef.current) {
        return;
      }

      const YT = await loadYoutubeApi();
      if (disposed || !playerHostRef.current || playerRef.current) {
        return;
      }

      playerRef.current = new YT.Player(playerHostRef.current, {
        height: "100%",
        width: "100%",
        playerVars: {
          autoplay: 0,
          controls: 1,
          listType: "playlist",
          list: soundtrackPlaylistId,
          loop: 1,
          playlist: soundtrackPlaylistId,
          playsinline: 1,
          rel: 0,
          origin: window.location.origin,
        },
        events: {
          onReady: () => setPlayerState("paused"),
          onStateChange: (event) => {
            if (event.data === YT.PlayerState.PLAYING) {
              setPlayerState("playing");
              return;
            }

            if (event.data === YT.PlayerState.PAUSED) {
              setPlayerState("paused");
              return;
            }

            if (event.data === YT.PlayerState.BUFFERING) {
              setPlayerState("buffering");
            }
          },
        },
      });
    }

    setupPlayer();

    return () => {
      disposed = true;
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, [soundtrackPlaylistId]);

  const soundtrackStatus =
    playerState === "playing"
      ? "Ambiance playing"
      : playerState === "buffering"
        ? "Ambiance buffering"
        : playerState === "paused"
          ? "Ambiance paused"
          : "Ambiance not started";

  return (
    <div className="pointer-events-auto flex flex-col items-end overflow-hidden rounded-lg border-white/50">
      <div className="flex flex-row items-start">
        <div
          className={
            soundtrackOpen
              ? "aspect-video w-[320px] overflow-hidden rounded-l-xl"
              : "pointer-events-none h-px w-px overflow-hidden opacity-0"
          }
        >
          <div ref={playerHostRef} className="h-full w-full" />
        </div>

        <button
          type="button"
          className={
            soundtrackOpen
              ? "flex h-full flex-row items-center justify-between rounded-r-xl border border-white/15 bg-white/6 p-2 align-middle text-sm font-medium transition-colors hover:bg-white/10"
              : "h-full rounded-xl border border-white/15 bg-white/6 p-2 align-middle text-sm font-medium transition-colors hover:bg-white/10"
          }
          onClick={() => setSoundtrackOpen((current) => !current)}
        >
          {!soundtrackOpen ? (
            <span className="tracking-[0.18em] text-slate-300 uppercase">
              {soundtrackStatus}
            </span>
          ) : null}
          <span className="min-h-12 min-w-12">
            {soundtrackOpen ? "-" : "+"}
          </span>
        </button>
      </div>
    </div>
  );
});
