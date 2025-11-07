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

  // Common sentence-ending words/phrases
  const sentenceEnders = [
    'period', 'question mark', 'exclamation point', 'exclamation',
    'question', 'end of sentence', 'new sentence'
  ]

  // Common comma-indicating words
  const commaIndicators = [
    'comma', 'pause', 'and', 'but', 'or', 'so', 'then', 'also',
    'however', 'therefore', 'furthermore', 'moreover', 'additionally',
    'first', 'second', 'third', 'next', 'finally', 'lastly'
  ]

  // Split into words
  const words = processed.split(/\s+/)
  if (words.length === 0) return text

  const result: string[] = []
  let i = 0

  while (i < words.length) {
    const word = words[i].toLowerCase()
    const originalWord = words[i]
    const nextWord = i + 1 < words.length ? words[i + 1] : null
    const nextWordLower = nextWord ? nextWord.toLowerCase() : null

    // Check if this word indicates a sentence end
    if (sentenceEnders.some(ender => word.includes(ender))) {
      // Skip the word itself, just add punctuation
      if (result.length > 0 && !/[.,!?;:]$/.test(result[result.length - 1])) {
        // Determine punctuation type
        if (word.includes('question')) {
          result[result.length - 1] = result[result.length - 1] + '?'
        } else if (word.includes('exclamation')) {
          result[result.length - 1] = result[result.length - 1] + '!'
        } else {
          result[result.length - 1] = result[result.length - 1] + '.'
        }
      }
      i++
      continue
    }

    // Check if this word indicates a comma
    if (commaIndicators.some(indicator => word === indicator || word.startsWith(indicator))) {
      result.push(originalWord)
      // Add comma if not already present and not at end
      if (nextWord && !/[.,!?;:]$/.test(originalWord)) {
        result[result.length - 1] = originalWord + ','
      }
      i++
      continue
    }

    // Regular word - check for sentence boundaries
    result.push(originalWord)

    if (nextWord) {
      // If next word starts with capital (likely new sentence), add period
      const nextFirstChar = nextWord[0]
      if (nextFirstChar === nextFirstChar.toUpperCase() && 
          nextFirstChar !== nextFirstChar.toLowerCase() &&
          !/[.,!?;:]$/.test(originalWord)) {
        // But only if current word doesn't look like it's mid-sentence
        // (e.g., not a conjunction or common mid-sentence word)
        const isMidSentence = commaIndicators.some(indicator => 
          word === indicator || word.startsWith(indicator)
        )
        if (!isMidSentence) {
          result[result.length - 1] = originalWord + '.'
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
  const trimmed = finalText.trim()
  if (trimmed && !/[.,!?;:]$/.test(trimmed)) {
    return trimmed + '.'
  }

  return trimmed
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

