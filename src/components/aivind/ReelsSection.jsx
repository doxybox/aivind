import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Play } from "lucide-react";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import ReelModal from "@/components/aivind/ReelModal";
import { getCloudflareReelEmbedUrl, getDirectReelVideoUrl } from "@/lib/reel-playback";

const defaultReels = [
  { id: 1, title: "DJI Osmo Pocket 3 - verdt oppgraderingen?", image: "/images/placeholders/article-placeholder.svg" },
  { id: 2, title: "Zeekr X testet i Norge - liten, rask og premium", image: "/images/placeholders/article-placeholder.svg" },
  { id: 3, title: "AirPods Pro 2 - tips du kanskje ikke visste", image: "/images/placeholders/article-placeholder.svg" },
  { id: 4, title: "ASUS ROG Zephyrus G14 - kraftpakke i 14 tommer", image: "/images/placeholders/article-placeholder.svg" },
  { id: 5, title: "ChatGPT-appen far stemme og bilder", image: "/images/placeholders/article-placeholder.svg" },
  { id: 6, title: "Tesla Model 3 Highland - alt du ma vite", image: "/images/placeholders/article-placeholder.svg" },
];

export default function ReelsSection({ items = defaultReels }) {
  const [activeReel, setActiveReel] = useState(null);
  const [viewCounts, setViewCounts] = useState({});
  const closeReel = useCallback(() => setActiveReel(null), []);
  const realReelSlugs = useMemo(
    () => [...new Set(items.filter((reel) => reel.slug && (getCloudflareReelEmbedUrl(reel) || getDirectReelVideoUrl(reel))).map((reel) => reel.slug))],
    [items],
  );

  useEffect(() => {
    if (realReelSlugs.length === 0) return undefined;

    const controller = new AbortController();
    fetch(`/api/reels/views?slugs=${encodeURIComponent(realReelSlugs.join(","))}`, { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (data?.counts) setViewCounts(data.counts);
      })
      .catch(() => {});

    return () => controller.abort();
  }, [realReelSlugs]);

  const openReel = useCallback((reel) => {
    const isPlayable = Boolean(getCloudflareReelEmbedUrl(reel) || getDirectReelVideoUrl(reel));
    const knownViews = reel.slug ? viewCounts[reel.slug] : undefined;
    setActiveReel({ ...reel, views: Number.isInteger(knownViews) ? knownViews : null });

    if (!reel.slug || !isPlayable) return;

    fetch("/api/reels/views", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: reel.slug }),
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!Number.isInteger(data?.views)) return;
        setViewCounts((current) => ({ ...current, [reel.slug]: data.views }));
        setActiveReel((current) => current?.slug === reel.slug ? { ...current, views: data.views } : current);
      })
      .catch(() => {});
  }, [viewCounts]);

  return (
    <>
      <section className="relative left-1/2 right-1/2 -mx-[50vw] w-screen bg-zinc-50 dark:bg-[#161a22] py-8 my-6 overflow-hidden">
        <div className="max-w-[1440px] mx-auto px-4 md:px-8">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-5 h-5 border-[2px] border-zinc-900 dark:border-white rounded-[6px] flex items-center justify-center">
                <div className="w-1.5 h-2.5 bg-zinc-900 dark:bg-white rounded-[2px]" />
              </div>
              <h2 className="text-[18px] md:text-[19px] font-black text-zinc-900 dark:text-white tracking-[-0.03em]">Reels</h2>
            </div>
            <a href="/video" className="text-[13px] font-bold text-zinc-900 dark:text-white hover:text-[#ff6a00] transition-colors">
              Se flere &rarr;
            </a>
          </div>

          <Carousel opts={{ align: "start", dragFree: true }} className="w-full">
            <CarouselContent className="-ml-3">
            {items.map((reel) => (
              <CarouselItem key={reel.id} className="pl-3 basis-[78%] sm:basis-[45%] md:basis-[31%] lg:basis-[20%]">
                <button
                  type="button"
                  onClick={() => openReel(reel)}
                  className="group relative block h-[372px] w-full overflow-hidden rounded-[14px] border border-white/10 bg-zinc-900 p-0 text-left shadow-[0_18px_60px_rgba(0,0,0,0.35)] outline-none ring-0 [-webkit-tap-highlight-color:transparent] focus:outline-none focus:ring-0 focus:ring-offset-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
                  aria-label={`Spill av ${reel.title}`}
                >
                  <img src={reel.image} alt={reel.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-white/10" />
                  <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-white/20 to-transparent opacity-60" />

                  <div className="absolute top-3 left-3 w-6 h-6 bg-white/55 backdrop-blur-md rounded-full flex items-center justify-center">
                    <Play className="w-3 h-3 text-white fill-white ml-0.5" />
                  </div>

                  {(getCloudflareReelEmbedUrl(reel) || getDirectReelVideoUrl(reel)) && reel.duration && (
                    <div className="absolute top-3 right-3 px-1.5 py-1 bg-black/45 backdrop-blur-md rounded-[4px] text-[10px] font-black text-white">
                      {reel.duration}
                    </div>
                  )}

                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="text-white text-[13px] md:text-[14px] font-black leading-tight line-clamp-2 mb-2">
                      {reel.title}
                    </h3>
                    {Number.isInteger(viewCounts[reel.slug]) && (
                      <p className="text-white/80 text-[11px] font-bold">
                        {new Intl.NumberFormat("nb-NO").format(viewCounts[reel.slug])} visninger
                      </p>
                    )}
                  </div>
                </button>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="hidden lg:flex -left-5 top-[55%] w-10 h-10 bg-black/50 hover:bg-black/80 text-white border-white/15 shadow-[0_10px_30px_rgba(0,0,0,0.45)]" />
            <CarouselNext className="hidden lg:flex -right-5 top-[55%] w-10 h-10 bg-black/50 hover:bg-black/80 text-white border-white/15 shadow-[0_10px_30px_rgba(0,0,0,0.45)]" />
          </Carousel>
        </div>
      </section>
      <ReelModal reel={activeReel} onClose={closeReel} />
    </>
  );
}
