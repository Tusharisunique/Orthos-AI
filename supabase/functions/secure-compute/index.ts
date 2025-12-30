import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

// Example Supabase Edge Function for sensitive compute.
// This function is not called directly in the Flask app but can be
// used for offloading security-critical or multi-tenant operations.

serve(async (req: Request) => {
  const authHeader = req.headers.get("authorization") ?? "";

  if (!authHeader.startsWith("Bearer ")) {
    return new Response(
      JSON.stringify({
        status: "error",
        data: { error: "Unauthorized" },
        meta: { compute_location: "cloud" },
      }),
      { status: 401, headers: { "Content-Type": "application/json" } },
    );
  }

  // In a real deployment, verify JWT and perform secure logic here.
  return new Response(
    JSON.stringify({
      status: "success",
      data: { message: "Secure edge compute ok" },
      meta: { compute_location: "cloud" },
    }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
});
