// Commits a book JSON file to GitHub repo tilastomuuttujat/book-haven
// Path: public/books/<slug>.json on branch book-haven
// Caller must be an authenticated admin (user_roles.role = 'admin').
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const REPO = "tilastomuuttujat/book-haven";
const BRANCH = "book-haven";
const DIR = "public/books";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);
    const token = authHeader.slice(7);

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const GITHUB_TOKEN = Deno.env.get("GITHUB_TOKEN");
    if (!GITHUB_TOKEN) return json({ error: "GITHUB_TOKEN puuttuu" }, 500);

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData.user) return json({ error: "Unauthorized" }, 401);

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!roles) return json({ error: "Vain admin voi tallentaa" }, 403);

    const body = await req.json();
    const slug = String(body?.slug ?? "").trim();
    const content = body?.content;
    if (!slug || !/^[a-z0-9-]+$/i.test(slug)) return json({ error: "Virheellinen slug" }, 400);
    if (!content || typeof content !== "object") return json({ error: "Sis\u00e4lt\u00f6 puuttuu" }, 400);

    const path = `${DIR}/${slug}.json`;
    const apiBase = `https://api.github.com/repos/${REPO}/contents/${path}`;
    const ghHeaders = {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "book-haven-edge",
    };

    // Look up existing file SHA (if any) on the target branch
    let sha: string | undefined;
    const headRes = await fetch(`${apiBase}?ref=${encodeURIComponent(BRANCH)}`, { headers: ghHeaders });
    if (headRes.ok) {
      const j = await headRes.json();
      sha = j.sha;
    } else if (headRes.status !== 404) {
      const t = await headRes.text();
      return json({ error: `GitHub GET ${headRes.status}: ${t}` }, 502);
    }

    const jsonText = JSON.stringify(content, null, 2);
    const b64 = btoa(unescape(encodeURIComponent(jsonText)));

    const putRes = await fetch(apiBase, {
      method: "PUT",
      headers: { ...ghHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({
        message: `chore(books): update ${slug}.json`,
        content: b64,
        branch: BRANCH,
        sha,
      }),
    });
    if (!putRes.ok) {
      const t = await putRes.text();
      return json({ error: `GitHub PUT ${putRes.status}: ${t}` }, 502);
    }
    const out = await putRes.json();
    return json({
      ok: true,
      path,
      branch: BRANCH,
      commit: out.commit?.sha,
      url: out.content?.html_url,
    });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
