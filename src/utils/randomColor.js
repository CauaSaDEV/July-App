export function colorFromString(str = "") {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  // 280 a 360: roxos e rosas, combinando com as cores do seu app
  const hue = 280 + (Math.abs(hash) % 80);
  return `hsl(${hue}, 65%, 50%)`;
}