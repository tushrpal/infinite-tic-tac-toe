"use client";

/**
 * AnchoredBackdropImage
 * A full-bleed backdrop image that is positioned so one point of the art (its
 * "focal point", e.g. the centre of painted rings) lands exactly under a DOM
 * element marked with `data-backdrop-anchor`.
 *
 * `object-fit: cover` can't do this: where the focal point ends up on screen
 * changes with the viewport's aspect ratio. Here we measure the anchor and pick
 * the smallest scale/offset that still covers the whole box while putting the
 * focal point on the anchor's centre.
 */

import Image from "next/image";
import { useLayoutEffect, useRef, useState } from "react";

const ANCHOR_SELECTOR = "[data-backdrop-anchor]";

export interface AnchoredBackdropImageProps {
  src: string;
  /** Intrinsic image size in px. */
  width: number;
  height: number;
  /** Focal point of the art as a 0–1 fraction of the image width / height. */
  focalX: number;
  focalY: number;
}

interface Placement {
  width: number;
  height: number;
  left: number;
  top: number;
}

export function AnchoredBackdropImage({
  src,
  width,
  height,
  focalX,
  focalY,
}: AnchoredBackdropImageProps) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [placement, setPlacement] = useState<Placement | null>(null);

  useLayoutEffect(() => {
    const box = boxRef.current;
    if (!box) return;

    let frame = 0;

    const measure = () => {
      const anchor = document.querySelector(ANCHOR_SELECTOR);
      const boxRect = box.getBoundingClientRect();
      const W = boxRect.width;
      const H = boxRect.height;
      if (!anchor || !W || !H) {
        setPlacement(null); // fall back to plain cover
        return;
      }

      const a = anchor.getBoundingClientRect();
      const tx = a.left + a.width / 2 - boxRect.left;
      const ty = a.top + a.height / 2 - boxRect.top;

      // Smallest scale that (1) covers the box and (2) leaves enough image on
      // each side of the focal point to reach the anchor without exposing an edge.
      const scale = Math.max(
        W / width,
        H / height,
        tx / (focalX * width),
        (W - tx) / ((1 - focalX) * width),
        ty / (focalY * height),
        (H - ty) / ((1 - focalY) * height),
      );

      setPlacement({
        width: width * scale,
        height: height * scale,
        left: tx - focalX * width * scale,
        top: ty - focalY * height * scale,
      });
    };

    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };

    measure();

    const observer = new ResizeObserver(schedule);
    observer.observe(box);
    const anchor = document.querySelector(ANCHOR_SELECTOR);
    if (anchor) observer.observe(anchor);
    window.addEventListener("resize", schedule);
    // Web fonts change text height above the anchor once they load.
    document.fonts?.ready.then(schedule);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("resize", schedule);
    };
  }, [width, height, focalX, focalY]);

  return (
    <div ref={boxRef} className="absolute inset-0">
      {placement ? (
        <Image
          src={src}
          alt=""
          width={width}
          height={height}
          priority
          sizes="100vw"
          className="absolute max-w-none"
          style={{
            width: placement.width,
            height: placement.height,
            left: placement.left,
            top: placement.top,
          }}
        />
      ) : (
        <Image src={src} alt="" fill priority sizes="100vw" className="object-cover" />
      )}
    </div>
  );
}
