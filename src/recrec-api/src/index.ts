/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.toml`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

export interface Env {
  SEMANTIC_API: string;
}

export default {
  async fetch(request, env, ctx): Promise<Response> {
    const url = new URL(request.url);
    const proxyUrl = url.searchParams.get('proxyUrl'); // get a query param value (?proxyUrl=...)

    if (!proxyUrl) {
      return new Response('Bad request: Missing `proxyUrl` query param', { status: 400 });
    }

    const newRequest = new Request(request, {
      headers: {
        'x-api-key': `${env.SEMANTIC_API}`,
      },
      body: request.body,
    });

    // make subrequests with the global `fetch()` function
    const res = await fetch(proxyUrl, newRequest);

    return res;
  },
} satisfies ExportedHandler<Env>;
