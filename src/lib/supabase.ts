/**
 * Server-side Supabase fetch helpers for the landing site.
 *
 * We deliberately don't pull in `@supabase/supabase-js` — these pages
 * only need to call one RPC, and adding the full client to every page
 * bundle would hurt cold-start latency on Vercel. Plain `fetch` against
 * the PostgREST endpoint is enough and ships zero extra KB.
 */

const SUPABASE_URL = import.meta.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.SUPABASE_ANON_KEY;

export interface PublicProfile {
  name: string;
  connection_rituals: Record<string, string> | null;
  share_slug: string;
}

/**
 * Looks up a profile by its public share slug via the SECURITY DEFINER
 * RPC (`public_profile_by_slug`) granted to `anon`. Returns null when
 * the slug doesn't resolve — render the 404 from there.
 */
export async function fetchProfileBySlug(
  slug: string,
): Promise<PublicProfile | null> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error(
      'SUPABASE_URL / SUPABASE_ANON_KEY env vars missing — set them in ' +
        'Vercel project settings for farfox-landing.',
    );
  }

  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/public_profile_by_slug`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ slug }),
  });

  if (!res.ok) return null;

  const rows = (await res.json()) as PublicProfile[];
  if (!Array.isArray(rows) || rows.length === 0) return null;

  const row = rows[0];
  // Coerce — connection_rituals might come back as a string in some
  // PostgREST configs, but for jsonb it should be an object already.
  return {
    name: row.name,
    connection_rituals:
      typeof row.connection_rituals === 'string'
        ? JSON.parse(row.connection_rituals as unknown as string)
        : row.connection_rituals,
    share_slug: row.share_slug,
  };
}
