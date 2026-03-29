const originalEmitWarning = process.emitWarning;

type EmitWarningArgs = Parameters<typeof process.emitWarning>;

function isBufferDeprecation(args: EmitWarningArgs) {
  const [warning, optionsOrName] = args;

  if (typeof warning === "object" && warning !== null) {
    const code = "code" in warning ? (warning as NodeJS.EmitWarningOptions).code : undefined;
    if (code === "DEP0005") {
      return true;
    }
  }

  if (typeof optionsOrName === "object" && optionsOrName !== null) {
    const code = (optionsOrName as NodeJS.EmitWarningOptions).code;
    if (code === "DEP0005") {
      return true;
    }
  }

  if (typeof warning === "string" && warning.includes("Buffer() is deprecated")) {
    return true;
  }

  return false;
}

process.emitWarning = function emitWarning(...args: EmitWarningArgs) {
  if (isBufferDeprecation(args)) {
    return true;
  }

  return originalEmitWarning.apply(process, args as readonly Parameters<typeof process.emitWarning>);
};
