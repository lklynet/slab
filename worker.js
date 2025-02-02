export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // API routes
    if (path.startsWith("/api/")) {
      return handleApi(request, env);
    }

    // Root path creates a new board
    if (path === "/" || path === "") {
      const boardId = generateBoardId();
      const timestamp = Math.floor(Date.now() / 1000);

      // Create board in original format
      const defaultConfig = `My Kanban Board
/To Do
/Doing
/Done`;

      try {
        // Store using original DB format
        await env.KANBAN_DB.prepare(
          "INSERT INTO boards (id, config, created_at) VALUES (?, ?, ?)"
        )
          .bind(boardId, defaultConfig, timestamp)
          .run();

        return Response.redirect(`${url.origin}/${boardId}`, 302);
      } catch (error) {
        return new Response("Failed to create board", { status: 500 });
      }
    }

    // Serve static files for all other routes
    try {
      const response = await fetch(`https://static.tasks.lkly.net${path}`);
      if (!response.ok) {
        throw new Error("Static file not found");
      }
      return response;
    } catch (error) {
      // Fallback to index.html for client-side routing
      return fetch("https://static.tasks.lkly.net/index.html");
    }
  },
};

async function handleApi(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;

  // Extract board ID from path
  const boardMatch = path.match(/^\/api\/board\/([^\/]+)/);
  const boardId = boardMatch ? boardMatch[1] : null;

  // Board operations
  if (path === "/api/board" && method === "POST") {
    return handleCreateBoard(env, url);
  } else if (boardId && method === "GET") {
    return handleGetBoard(boardId, env);
  } else if (boardId && method === "PUT") {
    return handleUpdateBoard(boardId, request, env);
  } else if (boardId && method === "DELETE") {
    return handleDeleteBoard(boardId, env, url);
  }

  return new Response("Not found", { status: 404 });
}

async function handleCreateBoard(env, url) {
  const boardId = generateBoardId();
  const timestamp = Math.floor(Date.now() / 1000);
  const defaultConfig = `My Kanban Board
/To Do
/Doing
/Done`;

  try {
    await env.KANBAN_DB.prepare(
      "INSERT INTO boards (id, config, created_at) VALUES (?, ?, ?)"
    )
      .bind(boardId, defaultConfig, timestamp)
      .run();

    return new Response(JSON.stringify({ boardId }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response("Failed to create board", { status: 500 });
  }
}

async function handleGetBoard(boardId, env) {
  try {
    // Try to get board from original DB
    const { results } = await env.KANBAN_DB.prepare(
      "SELECT config, created_at FROM boards WHERE id = ?"
    )
      .bind(boardId)
      .all();

    if (results.length === 0) {
      return new Response("Board not found", { status: 404 });
    }

    const boardConfig = results[0].config;
    const created_at = results[0].created_at;

    // Convert text config to JSON format for frontend
    const lines = boardConfig.split("\n");
    const title = lines[0];
    const columns = lines
      .slice(1)
      .filter((line) => line.startsWith("/"))
      .map((line, index) => ({
        id: `${created_at}-${index + 1}`,
        title: line.substring(1), // Remove leading '/'
        tasks: [],
      }));

    const board = {
      title,
      created_at,
      updated_at: Math.floor(Date.now() / 1000),
      columns,
    };

    return new Response(JSON.stringify(board), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response("Failed to get board", { status: 500 });
  }
}

async function handleUpdateBoard(boardId, request, env) {
  try {
    // Check if board exists
    const { results } = await env.KANBAN_DB.prepare(
      "SELECT config FROM boards WHERE id = ?"
    )
      .bind(boardId)
      .all();

    if (results.length === 0) {
      return new Response("Board not found", { status: 404 });
    }

    const updates = await request.json();

    // Convert JSON format back to text config
    const config = [
      updates.title,
      ...updates.columns.map((col) => `/${col.title}`),
    ].join("\n");

    // Update using original DB format
    await env.KANBAN_DB.prepare("UPDATE boards SET config = ? WHERE id = ?")
      .bind(config, boardId)
      .run();

    return new Response(JSON.stringify(updates), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response("Failed to update board", { status: 500 });
  }
}

async function handleDeleteBoard(boardId, env, url) {
  try {
    await env.KANBAN_DB.prepare("DELETE FROM boards WHERE id = ?")
      .bind(boardId)
      .run();

    return Response.redirect(`${url.origin}/`, 302);
  } catch (error) {
    return new Response("Failed to delete board", { status: 500 });
  }
}

function generateBoardId() {
  return [...Array(8)].map(() => Math.random().toString(36)[2]).join("");
}
