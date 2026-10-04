/**
 * My 4K Downloader — Silent, User-Friendly Error Sanitizer
 *
 * Ensures users NEVER see raw technical errors or alarmist messages:
 * - No Python tracebacks
 * - No yt-dlp command-line dumps or GitHub wiki links
 * - No server file paths or database codes
 * - Concise, compact, neutral status copy
 */

export function sanitizeUserError(rawMsg: string | undefined | null): string {
  if (!rawMsg || typeof rawMsg !== 'string') {
    return 'Unable to download this link right now.';
  }

  const lower = rawMsg.toLowerCase();

  // Neutral direct web download restriction from API
  if (
    lower.includes('unavailable for direct web download') ||
    lower.includes('currently unavailable for direct')
  ) {
    return 'This media is currently unavailable for direct web download.';
  }

  // Platform bot/verification checks or provider restriction
  if (
    lower.includes('not a bot') ||
    lower.includes('sign in') ||
    lower.includes('login_required') ||
    lower.includes('cookies') ||
    lower.includes('confirm you') ||
    lower.includes('bot verification') ||
    lower.includes('direct download right now') ||
    lower.includes('temporarily unavailable') ||
    lower.includes('provider temporarily requires')
  ) {
    return 'This media is currently unavailable for direct web download.';
  }

  // Private or restricted content
  if (
    lower.includes('private') ||
    lower.includes('members only') ||
    lower.includes('permission') ||
    lower.includes('this video is private') ||
    lower.includes('restricted by its author')
  ) {
    return 'This video is private or restricted by its author.';
  }

  // Unavailable or deleted
  if (
    lower.includes('unavailable') ||
    lower.includes('removed') ||
    lower.includes('does not exist') ||
    lower.includes('not found') ||
    lower.includes('video is unavailable') ||
    lower.includes('404')
  ) {
    return 'This video is unavailable or has been removed.';
  }

  // Geo-blocking
  if (
    lower.includes('geo') ||
    lower.includes('country') ||
    lower.includes('location') ||
    lower.includes('region') ||
    lower.includes('not available in your')
  ) {
    return 'This video is geographically restricted in the server region.';
  }

  // Unsupported URL or extractor failure
  if (
    lower.includes('unsupported') ||
    lower.includes('no video formats') ||
    lower.includes('extractor') ||
    lower.includes('invalid url') ||
    lower.includes('failed to parse')
  ) {
    return 'Unsupported link.';
  }

  // Network or timeout
  if (
    lower.includes('timeout') ||
    lower.includes('econnreset') ||
    lower.includes('econnrefused') ||
    lower.includes('failed to fetch') ||
    lower.includes('network error')
  ) {
    return 'This source is temporarily unavailable.';
  }

  // Format unavailable
  if (lower.includes('format unavailable') || lower.includes('requested format not available')) {
    return 'The requested resolution is not available for this stream.';
  }

  // Strip file paths, URLs, and code traces
  let cleaned = rawMsg
    .replace(/https?:\/\/[^\s]+/g, '')
    .replace(/\/[\w./-]+/g, '')
    .replace(/[A-Za-z]:\\[\w.\\-]+/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  // If message looks like a trace or internal exception
  if (
    cleaned.includes('Traceback') ||
    cleaned.includes('Exception') ||
    cleaned.includes('at async') ||
    cleaned.includes('at Object') ||
    cleaned.includes('node:') ||
    cleaned.length > 80
  ) {
    return 'Unable to download this link right now.';
  }

  return cleaned || 'Unable to download this link right now.';
}
