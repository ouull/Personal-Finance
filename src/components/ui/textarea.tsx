import * as React from "react";

import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-[120px] w-full rounded-2xl border-0 bg-slate-50 px-4 py-3 text-base text-slate-900 transition-all outline-none ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-slate-900 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:opacity-50 aria-invalid:ring-red-500 aria-invalid:ring-2 md:text-sm font-medium",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
