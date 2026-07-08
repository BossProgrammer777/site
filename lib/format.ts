export function formatUAH(n: number): string {
  return `${Math.round(n).toLocaleString('uk-UA')} грн`;
}
