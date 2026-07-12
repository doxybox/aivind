import React from "react";
import { Play } from "lucide-react";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";

const defaultReels = [
  { id: 1, title: "DJI Osmo Pocket 3 - verdt oppgraderingen?", views: "1,2k", duration: "0:32", image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=700&q=85" },
  { id: 2, title: "Zeekr X testet i Norge - liten, rask og premium", views: "987", duration: "0:29", image: "https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=700&q=85" },
  { id: 3, title: "AirPods Pro 2 - tips du kanskje ikke visste", views: "2,1k", duration: "0:25", image: "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=700&q=85" },
  { id: 4, title: "ASUS ROG Zephyrus G14 - kraftpakke i 14 tommer", views: "1,5k", duration: "0:31", image: "https://images.unsplash.com/photo-1593640408182-31c70c8268f5?w=700&q=85" },
  { id: 5, title: "ChatGPT-appen far stemme og bilder", views: "1,7k", duration: "0:28", image: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=700&q=85" },
  { id: 6, title: "Tesla Model 3 Highland - alt du ma vite", views: "3,4k", duration: "0:45", image: "https://images.unsplash.com/photo-1611016186353-9af58c69a533?w=700&q=85" },
];

export default function ReelsSection({ items = defaultReels }) {
  return (
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
                <a href="/video" className="group relative block h-[372px] rounded-[14px] overflow-hidden bg-zinc-900 border border-white/10 shadow-[0_18px_60px_rgba(0,0,0,0.35)]">
                  <img src={reel.image} alt={reel.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-white/10" />
                  <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-white/20 to-transparent opacity-60" />

                  <div className="absolute top-3 left-3 w-6 h-6 bg-white/55 backdrop-blur-md rounded-full flex items-center justify-center">
                    <Play className="w-3 h-3 text-white fill-white ml-0.5" />
                  </div>

                  <div className="absolute top-3 right-3 px-1.5 py-1 bg-black/45 backdrop-blur-md rounded-[4px] text-[10px] font-black text-white">
                    {reel.duration}
                  </div>

                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="text-white text-[13px] md:text-[14px] font-black leading-tight line-clamp-2 mb-2">
                      {reel.title}
                    </h3>
                    <p className="text-white/80 text-[11px] font-bold">
                      {reel.views} visninger
                    </p>
                  </div>
                </a>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="hidden lg:flex -left-5 top-[55%] w-10 h-10 bg-black/50 hover:bg-black/80 text-white border-white/15 shadow-[0_10px_30px_rgba(0,0,0,0.45)]" />
          <CarouselNext className="hidden lg:flex -right-5 top-[55%] w-10 h-10 bg-black/50 hover:bg-black/80 text-white border-white/15 shadow-[0_10px_30px_rgba(0,0,0,0.45)]" />
        </Carousel>
      </div>
    </section>
  );
}
