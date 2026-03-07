import * as React from "react";
import { cn } from "@/lib/utils";

const NON_TEXT_TYPES = new Set([
  "email",
  "password",
  "number",
  "tel",
  "url",
  "search",
  "date",
  "time",
  "datetime-local",
  "month",
  "week",
  "color",
  "file",
]);

const Input = React.forwardRef(
  (
    {
      className,
      type = "text",
      spellCheck,
      autoCorrect,
      autoCapitalize,
      ...props
    },
    ref
  ) => {
    const isTextLike = !NON_TEXT_TYPES.has(String(type || "text").toLowerCase());

    // ✅ Defaults seguros (solo sugerencias, NO cambia datos)
    const finalSpellCheck = spellCheck ?? isTextLike;
    const finalAutoCorrect = autoCorrect ?? (isTextLike ? "on" : "off");
    const finalAutoCapitalize = autoCapitalize ?? (isTextLike ? "sentences" : "none");

    return (
      <input
        ref={ref}
        type={type}
        spellCheck={finalSpellCheck}
        autoCorrect={finalAutoCorrect}
        autoCapitalize={finalAutoCapitalize}
        className={cn(
          // ✅ Estilo suave como tu diseño (similar a Textarea)
          "flex h-10 w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm " +
            "ring-offset-white placeholder:text-gray-400 " +
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500 " +
            "disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 shadow-sm hover:border-gray-300",
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";

export { Input };
