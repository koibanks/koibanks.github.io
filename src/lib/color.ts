/** Mix two hex colors. t = 0 → a, t = 1 → b. */
export function mix(a: string, b: string, t: number): string {
  const pa = parse(a);
  const pb = parse(b);
  const c = pa.map((v, i) => Math.round(v + (pb[i] - v) * t));
  return `rgb(${c[0]} ${c[1]} ${c[2]})`;
}

function parse(hex: string): [number, number, number] {
  let h = hex.replace('#', '');
  if (h.length === 3) h = [...h].map((ch) => ch + ch).join('');
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
