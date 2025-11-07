/**
 * Utility functions for processing speech recognition transcripts
 */

/**
 * Adds basic punctuation to a transcript based on pauses and sentence patterns
 * This is a simple heuristic-based approach since Web Speech API doesn't provide pause timing
 */
export function addPunctuation(text: string): string {
  if (!text || text.trim().length === 0) return text

  let processed = text.trim()

  // Remove any existing punctuation at the end (we'll add our own)
  processed = processed.replace(/[.,!?;:]+$/, '')

  // Split into words
  const words = processed.split(/\s+/)
  if (words.length === 0) return text

  const result: string[] = []
  let i = 0

  while (i < words.length) {
    const word = words[i]
    result.push(word)

    // Check if this might be the end of a sentence
    // Look for sentence-ending patterns
    const nextWord = words[i + 1]
    
    if (nextWord) {
      // If next word starts with capital (likely new sentence), add period
      if (nextWord[0] === nextWord[0].toUpperCase() && nextWord[0] !== nextWord[0].toLowerCase()) {
        // But check if current word already ends with punctuation
        if (!/[.,!?;:]$/.test(word)) {
          result[result.length - 1] = word + '.'
        }
      }
    }

    i++
  }

  // Capitalize first letter
  if (result.length > 0 && result[0]) {
    result[0] = result[0].charAt(0).toUpperCase() + result[0].slice(1)
  }

  // Ensure the text ends with punctuation
  const finalText = result.join(' ')
  if (!/[.,!?;:]$/.test(finalText)) {
    return finalText + '.'
  }

  return finalText
}

/**
 * Merges overlapping or duplicate text segments intelligently
 */
export function mergeTranscriptSegments(segments: string[]): string {
  if (segments.length === 0) return ''
  if (segments.length === 1) return segments[0].trim()

  // Remove empty segments
  const nonEmpty = segments.filter(s => s && s.trim().length > 0)
  if (nonEmpty.length === 0) return ''

  // Start with the first segment
  let result = nonEmpty[0].trim()

  for (let i = 1; i < nonEmpty.length; i++) {
    const segment = nonEmpty[i].trim()
    
    // If segment is already in result, skip it
    if (result.includes(segment)) {
      continue
    }

    // If result is contained in segment, replace it (newer is more complete)
    if (segment.includes(result)) {
      result = segment
      continue
    }

    // Check for overlap at the end of result and start of segment
    const overlap = findOverlap(result, segment)
    if (overlap > 0) {
      // Merge with overlap
      result = result + segment.substring(overlap)
    } else {
      // No overlap, just append with space
      result = result + ' ' + segment
    }
  }

  return result
}

/**
 * Finds the overlap between two strings (how many characters at the end of first
 * match the beginning of second)
 */
function findOverlap(str1: string, str2: string): number {
  const minLen = Math.min(str1.length, str2.length)
  for (let i = minLen; i > 0; i--) {
    if (str1.slice(-i) === str2.slice(0, i)) {
      return i
    }
  }
  return 0
}

/**
 * Processes a transcript chunk and accumulates it with previous chunks
 * Handles deduplication and merging intelligently
 */
export function accumulateTranscript(
  previous: string,
  newChunk: string
): string {
  if (!newChunk || newChunk.trim().length === 0) return previous

  const trimmedNew = newChunk.trim()
  const trimmedPrev = previous.trim()

  if (!trimmedPrev) return trimmedNew

  // If new chunk is already in previous, skip it
  if (trimmedPrev.includes(trimmedNew)) {
    return trimmedPrev
  }

  // If previous is contained in new chunk, replace it (newer is more complete)
  if (trimmedNew.includes(trimmedPrev)) {
    return trimmedNew
  }

  // Check for overlap
  const overlap = findOverlap(trimmedPrev, trimmedNew)
  if (overlap > 0) {
    return trimmedPrev + trimmedNew.substring(overlap)
  }

  // No overlap, append with space
  return trimmedPrev + ' ' + trimmedNew
}

