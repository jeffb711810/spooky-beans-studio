const ctx = new Proxy({}, { get: (t, k) => (k === "measureText" ? () => ({ width: 10 }) : k === "getImageData" || k === "createImageData" ? (w, h) => ({ data: new Uint8ClampedArray(4 * (w || 1) * (h || 1)) }) : k === "createLinearGradient" || k === "createRadialGradient" || k === "createPattern" ? () => ({ addColorStop() {} }) : typeof k === "string" ? () => {} : undefined), set: () => true });
globalThis.document = { createElement: () => ({ width: 1, height: 1, getContext: () => ctx, style: {} }) };
globalThis.window = globalThis;
