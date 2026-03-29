const PATCH_SYMBOL = Symbol.for("reviewMyResume.safeBufferPatched");

type NativeBuffer = typeof Buffer & { [PATCH_SYMBOL]?: boolean };

const nativeBuffer = Buffer as NativeBuffer;

if (typeof nativeBuffer === "function" && !nativeBuffer[PATCH_SYMBOL]) {
  const createSafeBuffer = (args: unknown[]): Buffer => {
    if (args.length === 0) {
      return nativeBuffer.alloc(0);
    }
    const firstArg = args[0];
    if (typeof firstArg === "number") {
      return nativeBuffer.alloc(firstArg);
    }
    return nativeBuffer.from(...(args as [Parameters<typeof Buffer.from>[0]]));
  };

  const safeBuffer = function SafeBuffer(...args: unknown[]) {
    return createSafeBuffer(args);
  } as unknown as NativeBuffer;

  safeBuffer.prototype = nativeBuffer.prototype;
  Object.setPrototypeOf(safeBuffer, nativeBuffer);

  for (const key of Object.getOwnPropertyNames(nativeBuffer)) {
    if (key === "prototype" || key === "name" || key === "length") {
      continue;
    }
    const descriptor = Object.getOwnPropertyDescriptor(nativeBuffer, key);
    if (descriptor) {
      Object.defineProperty(safeBuffer, key, descriptor);
    }
  }

  Object.defineProperty(safeBuffer, "name", {
    value: "Buffer",
    configurable: true,
  });
  Object.defineProperty(safeBuffer, PATCH_SYMBOL, {
    value: true,
    configurable: false,
    writable: false,
  });

  globalThis.Buffer = safeBuffer as typeof Buffer;
}
