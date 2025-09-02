"use client";

import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { cn } from "@/lib/utils";

const EnhancedSlider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex w-full touch-none select-none items-center group",
      className,
    )}
    {...props}
  >
    <SliderPrimitive.Track className="relative h-3 w-full grow overflow-hidden rounded-full bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 shadow-inner">
      <SliderPrimitive.Range className="absolute h-full bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 shadow-lg" />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb className="relative block h-6 w-6 rounded-full border-2 border-white bg-gradient-to-br from-blue-500 to-purple-600 shadow-2xl transition-all duration-200 hover:scale-110 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 group-hover:scale-105">
      {/* Line indicators through slider knob */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-3 h-0.5 bg-white/80 rounded-full shadow-sm"></div>
      </div>
      <div className="absolute inset-0 flex items-center justify-center rotate-90">
        <div className="w-3 h-0.5 bg-white/60 rounded-full shadow-sm"></div>
      </div>
    </SliderPrimitive.Thumb>
  </SliderPrimitive.Root>
));
EnhancedSlider.displayName = SliderPrimitive.Root.displayName;

export { EnhancedSlider };
