import * as React from "react";
import clsx from "clsx";

export function Button(
  props: React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "primary" | "secondary" | "ghost";
    isLoading?: boolean;
  }
) {
  const { className, variant = "primary", isLoading, disabled, ...rest } = props;
  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium transition",
        "focus:outline-none focus:ring-2 focus:ring-black/30",
        variant === "primary" && "bg-black text-white hover:bg-black/90",
        variant === "secondary" &&
          "bg-neutral-100 text-neutral-900 hover:bg-neutral-200",
        variant === "ghost" && "bg-transparent hover:bg-neutral-100",
        (disabled || isLoading) && "opacity-60 cursor-not-allowed",
        className
      )}
      disabled={disabled || isLoading}
      {...rest}
    >
      {isLoading ? (
        <span className="inline-flex items-center gap-2">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          Loading
        </span>
      ) : (
        props.children
      )}
    </button>
  );
}

export function Card(props: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      className={clsx(
        "rounded-2xl border border-neutral-200 bg-white shadow-sm",
        props.className
      )}
    />
  );
}

export function CardHeader(props: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      className={clsx("border-b border-neutral-200 p-5", props.className)}
    />
  );
}

export function CardContent(props: React.HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={clsx("p-5", props.className)} />;
}

export function Input(
  props: React.InputHTMLAttributes<HTMLInputElement> & { label?: string }
) {
  const { label, className, ...rest } = props;
  return (
    <label className="block">
      {label ? <div className="mb-1 text-sm text-neutral-700">{label}</div> : null}
      <input
        {...rest}
        className={clsx(
          "w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm",
          "focus:outline-none focus:ring-2 focus:ring-black/20",
          className
        )}
      />
    </label>
  );
}

export function Textarea(
  props: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }
) {
  const { label, className, ...rest } = props;
  return (
    <label className="block">
      {label ? <div className="mb-1 text-sm text-neutral-700">{label}</div> : null}
      <textarea
        {...rest}
        className={clsx(
          "w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm",
          "focus:outline-none focus:ring-2 focus:ring-black/20",
          className
        )}
      />
    </label>
  );
}
