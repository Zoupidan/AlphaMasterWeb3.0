export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    // Serve the data.json file from KV
    if (url.pathname === "/api/data") {
      if (request.method === "GET") {
        // Get data from KV
        const data = await env.ALPHA_DATA.get("data");
        if (data) {
          return new Response(data, {
            headers: { "Content-Type": "application/json" },
          });
        } else {
          return new Response(JSON.stringify({}), {
            headers: { "Content-Type": "application/json" },
          });
        }
      } else if (request.method === "POST") {
        // Save data to KV
        const data = await request.json();
        await env.ALPHA_DATA.put("data", JSON.stringify(data));
        return new Response(JSON.stringify({ success: true }), {
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // Serve static files
    return new Response("Not found", { status: 404 });
  },
};