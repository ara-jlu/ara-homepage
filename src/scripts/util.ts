export const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
export const fine = matchMedia("(hover:hover) and (pointer:fine)").matches;
export const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
