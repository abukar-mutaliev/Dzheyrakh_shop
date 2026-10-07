"use client";

import { useState } from "react";
import { ProductArt } from "@/components/product-art";

export function ProductPhoto({
  title,
  category,
  images,
  className = "h-52 w-full",
}: {
  title: string;
  category: string;
  images: string[];
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const image = images.find((item) => item.trim().length > 0);
  if (!image || failed) return <ProductArt category={category} className={className} />;
  return (
    // Merchant photos are arbitrary files or URLs, so the browser loads them directly.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={image}
      alt={title}
      className={`photo-live ${className} object-cover`}
      onError={() => setFailed(true)}
    />
  );
}
