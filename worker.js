export default {
  async fetch(request, env, ctx) {
    return handleRequest(request, env);
  },
};

async function handleRequest(request, env) {
  // Add CORS headers
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-API-Key",
  };

  // Handle CORS preflight
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Verify API key
  const apiKey = request.headers.get("X-API-Key");
  if (apiKey !== env.API_KEY) {
    return new Response("Unauthorized", {
      status: 401,
      headers: corsHeaders,
    });
  }

  // Add CORS headers to all responses
  const baseHeaders = {
    ...corsHeaders,
    "Content-Type": "application/json",
  };

  const url = new URL(request.url);
  const path = url.pathname;

  if (path === "/" || path === "") {
    // Create a new board and redirect
    const boardId = generateBoardId();
    const defaultConfig = `My Kanban Board
/To Do
/Doing
/Done`;

    const timestamp = Math.floor(Date.now() / 1000);

    await env.KANBAN_DB.prepare(
      "INSERT INTO boards (id, config, created_at) VALUES (?, ?, ?)"
    )
      .bind(boardId, defaultConfig, timestamp)
      .run();

    return new Response(JSON.stringify({ boardId }), {
      headers: baseHeaders,
      status: 200,
    });
  } else {
    const boardId = path.substring(1);

    if (request.method === "GET") {
      const { results } = await env.KANBAN_DB.prepare(
        "SELECT config FROM boards WHERE id = ?"
      )
        .bind(boardId)
        .all();

      if (results.length > 0) {
        return new Response(JSON.stringify({ config: results[0].config }), {
          headers: baseHeaders,
          status: 200,
        });
      } else {
        return new Response("Board not found", { status: 404 });
      }
    } else if (request.method === "POST") {
      const formData = await request.formData();
      const config = formData.get("config");

      await env.KANBAN_DB.prepare("UPDATE boards SET config = ? WHERE id = ?")
        .bind(config, boardId)
        .run();

      return new Response("Board updated", {
        headers: baseHeaders,
        status: 200,
      });
    } else if (request.method === "DELETE") {
      await env.KANBAN_DB.prepare("DELETE FROM boards WHERE id = ?")
        .bind(boardId)
        .run();

      return new Response("Board deleted", {
        headers: baseHeaders,
        status: 200,
      });
    } else {
      return new Response("Method not allowed", {
        headers: baseHeaders,
        status: 405,
      });
    }
  }
}

function generateBoardId() {
  return [...Array(8)].map(() => Math.random().toString(36)[2]).join("");
}
