// Shared by the /dream/[id] server route and the Gallery's client-side
// fetch (see api/dream/[id]/route.ts) so both produce identical symbol
// labels — otherwise the overlay's fetched preview and the real route's
// server-rendered version could show slightly different text.
export function shortSymbol(symbol: string): string {
  return symbol.split(" - ")[0].trim();
}
