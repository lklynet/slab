export async function onRequest({ request, env, next }) {
  const response = await next();

  // Only process HTML files
  if (!response.headers.get("content-type")?.includes("text/html")) {
    return response;
  }

  let text = await response.text();

  // Replace the environment variable placeholder
  text = text.replace("__API_KEY__", env.API_KEY || "");

  return new Response(text, {
    headers: response.headers,
  });
}
