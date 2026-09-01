import * as React from "react";
import { Input as InputPrimitive } from "@base-ui/react/input";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-12 w-full min-w-0 rounded-2xl border-0 bg-slate-50 px-4 py-3 text-base text-slate-900 transition-all outline-none ring-1 ring-inset ring-slate-200 file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-slate-900 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-slate-100 disabled:opacity-50 aria-invalid:ring-red-500 aria-invalid:ring-2 md:text-sm font-medium",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
