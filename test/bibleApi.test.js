const test = require('node:test');
const assert = require('node:assert/strict');
const { fetchVerse } = require('../src/bibleApi');

function createJsonResponse(status, body) {
  return {
    ok: status >= 200 && status < 300,
    status,
    async json() {
      return body;
    }
  };
}

test('fetches a verse and maps the API response', async () => {
  const originalFetch = global.fetch;
  const calls = [];

  global.fetch = async (url) => {
    calls.push(url);
    return createJsonResponse(200, {
      reference: 'Genesis 1:1',
      text: 'In the beginning God created the heaven and the earth.',
      translation_id: 'kjv'
    });
  };

  try {
    const result = await fetchVerse({ book: 'Genesis', chapter: 1, verse: 1 });

    assert.deepEqual(result, {
      reference: 'Genesis 1:1',
      text: 'In the beginning God created the heaven and the earth.',
      translation: 'kjv'
    });
    assert.equal(calls[0], 'https://bible-api.com/Genesis+1:1?translation=kjv');
  } finally {
    global.fetch = originalFetch;
  }
});

test('URL-encodes book names in the request', async () => {
  const originalFetch = global.fetch;
  let requestedUrl;

  global.fetch = async (url) => {
    requestedUrl = url;
    return createJsonResponse(200, {
      reference: 'Song of Solomon 2:1',
      text: '...',
      translation_id: 'kjv'
    });
  };

  try {
    await fetchVerse({ book: 'Song of Solomon', chapter: 2, verse: 1, translation: 'kjv' });
    assert.equal(requestedUrl, 'https://bible-api.com/Song%20of%20Solomon+2:1?translation=kjv');
  } finally {
    global.fetch = originalFetch;
  }
});

test('throws a clear error for 404 responses', async () => {
  const originalFetch = global.fetch;

  global.fetch = async () => createJsonResponse(404, { error: 'Not found' });

  try {
    await assert.rejects(
      () => fetchVerse({ book: 'Genesis', chapter: 99, verse: 1 }),
      /Verse not found/
    );
  } finally {
    global.fetch = originalFetch;
  }
});

test('throws a clear error for network failures', async () => {
  const originalFetch = global.fetch;

  global.fetch = async () => {
    throw new TypeError('fetch failed');
  };

  try {
    await assert.rejects(
      () => fetchVerse({ book: 'Genesis', chapter: 1, verse: 1 }),
      /Bible API network request failed/
    );
  } finally {
    global.fetch = originalFetch;
  }
});

test('times out after 5 seconds', async () => {
  const originalFetch = global.fetch;

  global.fetch = async (_url, options) =>
    new Promise((resolve, reject) => {
      options.signal.addEventListener('abort', () => {
        const abortError = new Error('The operation was aborted.');
        abortError.name = 'AbortError';
        reject(abortError);
      });
      void resolve;
    });

  try {
    await assert.rejects(
      () => fetchVerse({ book: 'Genesis', chapter: 1, verse: 1 }),
      /timed out after 5 seconds/
    );
  } finally {
    global.fetch = originalFetch;
  }
});
