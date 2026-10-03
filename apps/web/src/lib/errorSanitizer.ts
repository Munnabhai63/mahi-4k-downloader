/**
 * My 4K Downloader — User-Friendly Error Sanitizer
 *
 * Ensures users NEVER see raw technical errors:
 * - No Python tracebacks
 * - No yt-dlp command-line dumps or GitHub wiki links
 * - No server file paths or database codes
 * - Clean, reassuring, human-first copy
 */

export function sanitizeUserError(rawMsg: string | undefined | null): string {
  if (!rawMsg || typeof rawMsg !== 'string') {
    return 'Unable to process this video. Please verify the link and try again.';
  }

  const lower = rawMsg.toLowerCase();

  // Platform bot/verification checks
  if (
    lower.includes('not a bot') ||
    lower.includes('sign in') ||
    lower.includes('login_required') ||
    lower.includes('cookies') ||
    lower.includes('confirm you') ||
    lower.includes('bot verification')
  ) {
    return 'This video temporarily requires additional verification from the source platform. Please try another video or quality.';
  }

  // Private or restricted content
  if (
    lower.includes('private') ||
    lower.includes('members only') ||
    lower.includes('permission') ||
    lower.includes('this video is private')
  ) {
    return 'This video is private or restricted by its author on the source platform.';
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
    return 'This video is unavailable or has been removed from the platform.';
  }

  // Geo-blocking
  if (
    lower.includes('geo') ||
    lower.includes('country') ||
    lower.includes('location') ||
    lower.includes('region') ||
    lower.includes('not available in your')
  ) {
    return 'This video is geographically restricted by the content creator.';
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
    return 'Network connection interrupted. Click retry to resume from the last byte.';
  }

  // Format unavailable
  if (lower.includes('format unavailable') || lower.includes('requested format not available')) {
    return 'The requested resolution or audio format is not available for this stream. Please choose another quality.';
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
    cleaned.length > 120
  ) {
    return 'Unable to process this video. Please verify the URL and try again.';
  }

  return cleaned || 'Download failed. Please try a different quality or verify the URL.';
}
