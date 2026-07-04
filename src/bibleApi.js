const DEFAULT_TIMEOUT_MS = 5000;

function buildVerseUrl({ book, chapter, verse, translation }) {
  const encodedBook = encodeURIComponent(book);
  const normalizedTranslation = translation || 'kjv';
  return `https://bible-api.com/${encodedBook}+${chapter}:${verse}?translation=${encodeURIComponent(normalizedTranslation)}`;
}

async function fetchVerse({ book, chapter, verse, translation = 'kjv' }) {
  if (!book || !Number.isInteger(chapter) || !Number.isInteger(verse)) {
    throw new Error('Invalid verse request: book, chapter, and verse are required.');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);
  const url = buildVerseUrl({ book, chapter, verse, translation });

  try {
    const response = await fetch(url, {
      signal: controller.signal
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Verse not found');
      }

      throw new Error(`Bible API request failed with status ${response.status}`);
    }

    const data = await response.json();

    return {
      reference: data.reference || `${book} ${chapter}:${verse}`,
      text: data.text || '',
      translation: data.translation_id || data.translation || translation
    };
  } catch (error) {
    if (error && error.name === 'AbortError') {
      throw new Error('Bible API request timed out after 5 seconds');
    }

    if (error instanceof Error && error.message === 'Verse not found') {
      throw error;
    }

    if (error instanceof TypeError) {
      throw new Error('Bible API network request failed');
    }

    throw error instanceof Error ? error : new Error('Bible API request failed');
  } finally {
    clearTimeout(timeoutId);
  }
}

module.exports = {
  fetchVerse
};