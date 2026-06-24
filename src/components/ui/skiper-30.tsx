"use client";

import { motion, MotionValue, useScroll, useTransform } from "framer-motion";
import Lenis from "lenis";
import { useEffect, useRef, useState } from "react";

const images = [
  "images/top100/heic1501a.webp", // Pillars of Creation
  "images/top100/heic0602a.webp", // Orion Nebula
  "images/top100/heic1520a.webp", // Veil Nebula
  "images/top100/heic0206a.webp", // Cone Nebula
  "images/top100/heic0506a.webp", // Whirlpool Galaxy M51
  "images/top100/heic0707a.webp", // Carina Nebula
  "images/top100/heic1302a.webp", // Horsehead Nebula
  "images/top100/heic0406a.webp", // Hubble Ultra Deep Field
  "images/top100/heic2007a.webp", // Cosmic Reef (Hubble 30th)
  "images/top100/heic0601a.webp", // Sombrero Galaxy M104
  "images/top100/heic0604a.webp", // Crab Nebula
  "images/top100/heic0702a.webp", // Antennae Galaxies
  "images/top100/heic1105a.webp", // Rose Galaxies (Arp 273)
];

const Skiper30 = () => {
  const gallery = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLElement | null>(null);
  const [dimension, setDimension] = useState(() => ({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  }));
  const [containerReady, setContainerReady] = useState(false);

  useEffect(() => {
    scrollContainerRef.current = document.querySelector('main');
    setContainerReady(true);
  }, []);

  const { scrollYProgress } = useScroll({
    container: containerReady ? scrollContainerRef : undefined,
    target: gallery,
    offset: ["start end", "end start"],
  });

  const { height } = dimension;
  const y = useTransform(scrollYProgress, [0, 1], [0, height * 2]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, height * 3.3]);
  const y3 = useTransform(scrollYProgress, [0, 1], [0, height * 1.25]);
  const y4 = useTransform(scrollYProgress, [0, 1], [0, height * 3]);

  useEffect(() => {
    const mainEl = scrollContainerRef.current || document.querySelector('main');
    if (!mainEl) return;

    const lenis = new Lenis({
      wrapper: mainEl,
      content: mainEl.firstElementChild as HTMLElement || mainEl,
      smoothWheel: true,
      lerp: 0.1,
      syncTouch: false,
      prevent: (node) => node.closest('[data-lenis-prevent]') !== null,
    });

    let rafId: number;
    const raf = (time: number) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    };

    const resize = () => {
      setDimension({ width: window.innerWidth, height: window.innerHeight });
    };

    window.addEventListener("resize", resize);
    rafId = requestAnimationFrame(raf);
    resize();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, [scrollContainerRef.current]);

  return (
    <section className="relative w-full bg-[#0a0d15] text-white">
      <div
        ref={gallery}
        className="relative box-border flex h-[175vh] gap-[2vw] overflow-hidden bg-[#0a0d15] p-[2vw] border-y border-white/5"
      >
        <Column images={[images[0], images[1], images[2]]} y={y} />
        <Column images={[images[3], images[4], images[5]]} y={y2} />
        <Column images={[images[6], images[7], images[8]]} y={y3} />
        <Column images={[images[9], images[10], images[11]]} y={y4} />
      </div>
    </section>
  );
};

type ColumnProps = {
  images: string[];
  y: MotionValue<number>;
};

const Column = ({ images, y }: ColumnProps) => {
  return (
    <motion.div
      className="relative -top-[45%] flex h-full w-1/4 min-w-[120px] sm:min-w-[200px] flex-col gap-[2vw] first:top-[-45%] [&:nth-child(2)]:top-[-95%] [&:nth-child(3)]:top-[-45%] [&:nth-child(4)]:top-[-75%]"
      style={{ y }}
    >
      {images.map((src, i) => (
        <div key={i} className="relative flex-1 w-full overflow-hidden rounded-xl border border-white/5 bg-slate-950">
          <img
            src={`${import.meta.env.BASE_URL}${src}`}
            alt="space-archive"
            className="pointer-events-none object-cover w-full h-full"
          />
        </div>
      ))}
    </motion.div>
  );
};

export { Skiper30 };
