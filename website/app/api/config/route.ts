// Tells the scanner page whether this server has a TinyFish key of its own, so the page knows
// whether a visitor must add theirs. Never returns the key, only yes or no.
export async function GET(request: Request) {
  // Reading the request keeps this answered per request, not frozen at build time.
  request.headers.get("host");
  return Response.json({ serverKey: !!process.env.TINYFISH_API_KEY }, { headers: { "Cache-Control": "no-store" } });
}
