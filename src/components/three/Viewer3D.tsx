"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { Spinner } from "@/components/ui";
import type { DesignSide } from "@/lib/design";

const GarmentScene = dynamic(() => import("./GarmentScene"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center">
      <Spinner />
    </div>
  ),
});

export interface Viewer3DProps {
  silhouette: string;
  color: string;
  designTexture?: HTMLCanvasElement | null;
  activeSide?: DesignSide;
  autoRotate?: boolean;
  className?: string;
  interactive?: boolean;
  fallbackImage?: string;
}

function webglAvailable() {
  try {
    const canvas = document.createElement("canvas");
    return !!(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

/** 3D viewer with graceful static fallback when WebGL is unavailable. */
export function Viewer3D({ fallbackImage, ...props }: Viewer3DProps) {
  const [mode, setMode] = useState<"checking" | "3d" | "static">("checking");

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const has3d = webglAvailable();
    setMode(has3d ? "3d" : "static");
    if (!has3d || reduce) setMode(has3d ? "3d" : "static");
  }, []);

  if (mode === "checking") {
    return (
      <div className={props.className}>
        <div className="flex h-full w-full items-center justify-center">
          <Spinner />
        </div>
      </div>
    );
  }
  if (mode === "static" && fallbackImage) {
    return (
      <div className={props.className}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={fallbackImage} alt="Product preview" className="h-full w-full object-contain" />
      </div>
    );
  }
  return <GarmentScene {...props} />;
}
