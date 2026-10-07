"use client";

import Link from "next/link";
import { useRef, useState, ViewTransition } from "react";
import { ProductArt } from "@/components/product-art";

export function ImageSlider({
  title,
  category,
  images,
  className = "h-52 w-full",
  href,
  transitionName,
}: {
  title: string;
  category: string;
  images: string[];
  className?: string;
  href?: string;
  transitionName?: string;
}) {
  const photos = images.filter((item) => item.trim().length > 0);
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [failed, setFailed] = useState<string[]>([]);
  const startX = useRef<number | null>(null);
  const swiped = useRef(false);
  const visible = photos.filter((src) => !failed.includes(src));
  const current = visible.length === 0 ? 0 : index % visible.length;

  function step(delta: number) {
    setDirection(delta);
    setIndex((value) => {
      const base = visible.length === 0 ? 0 : value % visible.length;
      return (base + delta + visible.length) % visible.length;
    });
  }

  if (visible.length === 0) return <ProductArt category={category} className={className} />;

  const photo = (
    <div
      key={visible[current]}
      className={direction === 0 ? undefined : "photo-swap"}
      style={{ ["--swap-x" as string]: direction > 0 ? "22px" : "-22px" }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={visible[current]}
        alt={title}
        className={`photo-live ${className} object-cover`}
        draggable={false}
        onError={() =>
          setFailed((items) => (items.includes(visible[current]) ? items : [...items, visible[current]]))
        }
      />
    </div>
  );

  return (
    <div
      className="relative"
      onPointerDown={(event) => {
        if ((event.target as HTMLElement).closest("button")) return;
        startX.current = event.clientX;
      }}
      onPointerUp={(event) => {
        if (startX.current == null) return;
        const distance = event.clientX - startX.current;
        startX.current = null;
        if (Math.abs(distance) < 48 || visible.length < 2) return;
        swiped.current = true;
        step(distance > 0 ? -1 : 1);
      }}
    >
      {href ? (
        <Link
          href={href}
          transitionTypes={["nav-forward"]}
          className="block"
          onClick={(event) => {
            if (!swiped.current) return;
            event.preventDefault();
            swiped.current = false;
          }}
        >
          {transitionName ? (
            <ViewTransition name={transitionName} share="morph" enter="frame" exit="frame" default="none">
              {photo}
            </ViewTransition>
          ) : (
            photo
          )}
        </Link>
      ) : transitionName ? (
        <ViewTransition name={transitionName} share="morph" enter="frame" exit="frame" default="none">
          {photo}
        </ViewTransition>
      ) : (
        photo
      )}
      {visible.length > 1 ? (
        <div className="absolute bottom-3 left-0 right-0 z-10 flex justify-center gap-1.5">
          {visible.map((src, dot) => (
            <button
              key={src}
              type="button"
              aria-label={`Фото ${dot + 1}`}
              className={`h-1.5 rounded-full transition-all duration-300 ${dot === current ? "w-4 bg-white" : "w-1.5 bg-white/70"}`}
              onClick={() => {
                setDirection(dot > current ? 1 : -1);
                setIndex(dot);
              }}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
