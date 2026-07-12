import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Play, X } from "lucide-react";
import { getCloudflareReelEmbedUrl, getDirectReelVideoUrl } from "@/lib/reel-playback";

export default function ReelModal({ reel, onClose }) {
  const closeButtonRef = useRef(null);
  const embedUrl = getCloudflareReelEmbedUrl(reel);
  const videoUrl = getDirectReelVideoUrl(reel);

  useEffect(() => {
    if (!reel) return undefined;

    const previousOverflow = document.body.style.overflow;
    const previouslyFocused = document.activeElement;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
      previouslyFocused?.focus?.();
    };
  }, [reel, onClose]);

  if (!reel || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center overflow-hidden bg-black/75 p-3 backdrop-blur-xl sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      {reel.image && (
        <img
          src={reel.image}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute inset-[-8%] h-[116%] w-[116%] scale-110 object-cover opacity-20 blur-3xl"
        />
      )}
      <div className="pointer-events-none absolute inset-0 bg-black/55" />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Reel: ${reel.title}`}
        className="relative h-[min(84vh,760px)] max-w-[92vw] aspect-[9/16] overflow-hidden rounded-[8px] border border-white/15 bg-black shadow-[0_30px_100px_rgba(0,0,0,0.75)]"
      >
        <button
          ref={closeButtonRef}
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/55 text-white backdrop-blur-md transition-colors hover:bg-black/85 outline-none ring-0 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0"
          aria-label="Lukk reel"
          title="Lukk"
        >
          <X className="h-5 w-5" />
        </button>

        {embedUrl ? (
          <iframe
            src={embedUrl}
            title={reel.title}
            className="absolute inset-0 h-full w-full border-0"
            allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        ) : videoUrl ? (
          <video
            src={videoUrl}
            poster={reel.image || undefined}
            className="absolute inset-0 h-full w-full bg-black object-contain"
            controls
            autoPlay
            playsInline
          >
            Nettleseren din st&oslash;tter ikke videoavspilling.
          </video>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-950">
            {reel.image && <img src={reel.image} alt="" className="absolute inset-0 h-full w-full object-cover opacity-55" />}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-black/15" />
            <div className="relative mx-8 flex flex-col items-center text-center text-white">
              <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-white/25 bg-black/50 backdrop-blur-md">
                <Play className="ml-1 h-6 w-6 fill-white" />
              </span>
              <p className="text-sm font-black">Videoen er ikke tilgjengelig enn&aring;.</p>
            </div>
          </div>
        )}

        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black via-black/75 to-transparent px-5 pb-5 pt-20 text-white">
          <h3 className="text-[17px] font-black leading-tight sm:text-[19px]">{reel.title}</h3>
          {reel.views && reel.views !== "0" && (
            <p className="mt-2 text-xs font-bold text-white/75">{reel.views} visninger</p>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
