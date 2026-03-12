import { NextResponse } from 'next/server';

import { lookupPublicYouTubeChannel } from '@/lib/youtube';

/**
 * Handles GET requests to look up a public YouTube channel using the `q` query parameter.
 *
 * Parses `q` from the request URL, validates it, performs a lookup, and returns JSON containing
 * the channel data on success or an error message with an appropriate HTTP status on failure.
 *
 * @param request - The incoming request; its URL must include the `q` query parameter (YouTube handle, channel ID, or channel URL).
 * @returns A NextResponse with the channel data when the lookup succeeds. On failure, a JSON object `{ error: string }` is returned with an HTTP status indicating the error: 400 for missing/invalid input, 404 when the channel is not found, 429 for quota-related errors, 500 for API key issues, and 502 for other failures.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q')?.trim() ?? '';

  if (!query) {
    return NextResponse.json({ error: 'Missing q query parameter.' }, { status: 400 });
  }

  try {
    const result = await lookupPublicYouTubeChannel(query);

    if ('error' in result) {
      const status =
        result.error === 'Enter a YouTube handle, channel ID, or channel URL.' ? 400 : 404;
      return NextResponse.json({ error: result.error }, { status });
    }

    return NextResponse.json(result.data);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown YouTube lookup failure';
    const status =
      message.includes('quota') || message.includes('Quota')
        ? 429
        : message.includes('YOUTUBE_API_KEY')
          ? 500
          : 502;

    return NextResponse.json({ error: message }, { status });
  }
}
