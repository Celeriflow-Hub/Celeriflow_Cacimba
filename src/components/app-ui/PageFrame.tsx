import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function PageFrame({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn("mx-auto w-full max-w-[1600px] animate-in fade-in slide-in-from-bottom-4 duration-500", className)}
      {...props}
    />
  );
}
