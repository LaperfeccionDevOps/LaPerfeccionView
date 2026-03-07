import React from 'react';
import { cn } from '@/lib/utils';

const Textarea = React.forwardRef(
  ({ className, spellCheck, autoCorrect, autoCapitalize, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        spellCheck={spellCheck ?? true}
        autoCorrect={autoCorrect ?? "on"}
        autoCapitalize={autoCapitalize ?? "sentences"}
        className={cn(
          "flex min-h-[100px] w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm ring-offset-white placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 shadow-sm hover:border-gray-300 resize-y",
          className
        )}
        {...props}
      />
    );
  }
);

Textarea.displayName = "Textarea";

export { Textarea };
