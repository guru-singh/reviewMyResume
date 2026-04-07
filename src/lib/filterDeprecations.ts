type WarningArg = string | Error;

function isEmitWarningOptions(value: unknown): value is { type?: string; code?: string } {
  return typeof value === "object" && value !== null;
}

function isBufferDeprecation(
  warning: WarningArg,
  typeOrOptions?: string | { type?: string; code?: string },
  code?: string
) {
  const warningText =
    typeof warning === "string"
      ? warning
      : warning instanceof Error
        ? warning.message
        : "";

  const warningType =
    typeof typeOrOptions === "string"
      ? typeOrOptions
      : isEmitWarningOptions(typeOrOptions)
        ? typeOrOptions.type ?? ""
        : "";

  const warningCode =
    typeof code === "string"
      ? code
      : isEmitWarningOptions(typeOrOptions)
        ? typeOrOptions.code ?? ""
        : "";

  return (
    warningCode === "DEP0005" ||
    warningType === "DeprecationWarning" ||
    warningText.includes("Buffer() is deprecated")
  );
}

const originalEmitWarning = process.emitWarning.bind(process);

process.emitWarning = ((warning: WarningArg, a?: unknown, b?: unknown, c?: unknown) => {
  const typeOrOptions = typeof a === "string" || isEmitWarningOptions(a) ? a : undefined;
  const code = typeof b === "string" ? b : undefined;

  if (isBufferDeprecation(warning, typeOrOptions, code)) {
    return;
  }

  if (typeof a === "function") {
    originalEmitWarning(warning, a);
    return;
  }

  if (typeof a === "string" && typeof b === "string" && typeof c === "function") {
    originalEmitWarning(warning, a, b, c);
    return;
  }

  if (typeof a === "string" && typeof b === "function") {
    originalEmitWarning(warning, a, b);
    return;
  }

  if (isEmitWarningOptions(a)) {
    originalEmitWarning(warning, a);
    return;
  }

  if (typeof a === "string" && typeof b === "string") {
    originalEmitWarning(warning, a, b);
    return;
  }

  if (typeof a === "string") {
    originalEmitWarning(warning, a);
    return;
  }

  originalEmitWarning(warning);
}) as typeof process.emitWarning;