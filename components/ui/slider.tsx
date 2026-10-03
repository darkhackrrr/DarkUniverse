"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface SliderProps {
  value: number[];
  onValueChange: (value: number[]) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  id?: string;
  className?: string;
  "aria-label"?: string;
}

/** Minimal shadcn-style slider built on a native range input. */
export function Slider({
  value,
  onValueChange,
  min = 0,
  max = 100,
  step = 1,
  disabled,
  id,
  className,
  "aria-label": ariaLabel,
}: SliderProps) {
  const current = value?.[0] ?? min;
  const pct = ((current - min) / (max - min)) * 100;

  return (
    <div className={cn("relative flex h-5 w-full items-center", className)}>
      <div className="absolute h-1.5 w-full rounded-full bg-secondary">
        <div
          className="h-full rounded-full bg-primary"
          style={{ width: `${pct}%` }}
        />
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={current}
        disabled={disabled}
        aria-label={ariaLabel}
        onChange={(e) => onValueChange([Number(e.target.value)])}
        className={cn(
          "pointer-events-none relative z-10 h-5 w-full cursor-pointer appearance-none bg-transparent [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:size-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border [&::-moz-range-thumb]:border-primary [&::-moz-range-thumb]:bg-primary [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-primary [&::-webkit-slider-thumb]:bg-primary",
          disabled && "cursor-not-allowed opacity-50",
        )}
      />
    </div>
  );
}
