const { BOOK_ALIASES } = require('./bookAliases');

const FILLER_WORDS = new Set(['chapter', 'verse', 'colon']);

const NUMBER_WORDS = new Map([
  ['zero', 0],
  ['oh', 0],
  ['one', 1],
  ['first', 1],
  ['two', 2],
  ['second', 2],
  ['three', 3],
  ['third', 3],
  ['four', 4],
  ['fourth', 4],
  ['five', 5],
  ['fifth', 5],
  ['six', 6],
  ['sixth', 6],
  ['seven', 7],
  ['seventh', 7],
  ['eight', 8],
  ['eighth', 8],
  ['nine', 9],
  ['ninth', 9],
  ['ten', 10],
  ['tenth', 10],
  ['eleven', 11],
  ['eleventh', 11],
  ['twelve', 12],
  ['twelfth', 12],
  ['thirteen', 13],
  ['thirteenth', 13],
  ['fourteen', 14],
  ['fourteenth', 14],
  ['fifteen', 15],
  ['fifteenth', 15],
  ['sixteen', 16],
  ['sixteenth', 16],
  ['seventeen', 17],
  ['seventeenth', 17],
  ['eighteen', 18],
  ['eighteenth', 18],
  ['nineteen', 19],
  ['nineteenth', 19],
  ['twenty', 20],
  ['twentieth', 20],
  ['thirty', 30],
  ['thirtieth', 30],
  ['forty', 40],
  ['fortieth', 40],
  ['fifty', 50],
  ['fiftieth', 50],
  ['sixty', 60],
  ['sixtieth', 60],
  ['seventy', 70],
  ['seventieth', 70],
  ['eighty', 80],
  ['eightieth', 80],
  ['ninety', 90],
  ['ninetieth', 90],
  ['hundred', 100]
]);

const MAX_ALIAS_TOKEN_LENGTH = Math.max(
  ...Object.values(BOOK_ALIASES).flatMap((aliases) => aliases.map((alias) => alias.split(' ').length))
);

const BOOK_LOOKUP = new Map();

for (const [book, aliases] of Object.entries(BOOK_ALIASES)) {
  for (const alias of aliases) {
    BOOK_LOOKUP.set(normalizeText(alias), book);
  }
}

function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenize(value) {
  const normalized = normalizeText(value);
  if (!normalized) {
    return [];
  }

  return normalized
    .split(' ')
    .filter((token) => token && !FILLER_WORDS.has(token));
}

function isNumberWord(token) {
  return NUMBER_WORDS.has(token) || /^\d+$/.test(token);
}

function tokenValue(token) {
  if (/^\d+$/.test(token)) {
    return Number(token);
  }

  return NUMBER_WORDS.get(token);
}

function parseSingleNumber(tokens) {
  if (tokens.length === 0) {
    return null;
  }

  if (tokens.length === 1) {
    const value = tokenValue(tokens[0]);
    if (Number.isInteger(value) && value >= 0) {
      return value;
    }

    return null;
  }

  const [firstToken, secondToken, ...restTokens] = tokens;
  const firstValue = tokenValue(firstToken);
  const secondValue = tokenValue(secondToken);

  if (!Number.isInteger(firstValue) || !Number.isInteger(secondValue)) {
    return null;
  }

  if (firstValue >= 20 && firstValue < 100 && secondValue >= 1 && secondValue <= 9 && restTokens.length === 0) {
    return firstValue + secondValue;
  }

  if (firstValue >= 1 && firstValue <= 9 && secondValue === 100) {
    const tailValue = parseSingleNumber(restTokens);
    if (tailValue === null) {
      return firstValue * 100;
    }

    return firstValue * 100 + tailValue;
  }

  return null;
}

// Known chapter counts for canonical books (used to disambiguate digit splits)
const CHAPTER_COUNTS = {
  'Genesis': 50,
  'Exodus': 40,
  'Leviticus': 27,
  'Numbers': 36,
  'Deuteronomy': 34,
  'Joshua': 24,
  'Judges': 21,
  'Ruth': 4,
  '1 Samuel': 31,
  '2 Samuel': 24,
  '1 Kings': 22,
  '2 Kings': 25,
  '1 Chronicles': 29,
  '2 Chronicles': 36,
  'Ezra': 10,
  'Nehemiah': 13,
  'Esther': 10,
  'Job': 42,
  'Psalms': 150,
  'Proverbs': 31,
  'Ecclesiastes': 12,
  'Song of Solomon': 8,
  'Isaiah': 66,
  'Jeremiah': 52,
  'Lamentations': 5,
  'Ezekiel': 48,
  'Daniel': 12,
  'Hosea': 14,
  'Joel': 3,
  'Amos': 9,
  'Obadiah': 1,
  'Jonah': 4,
  'Micah': 7,
  'Nahum': 3,
  'Habakkuk': 3,
  'Zephaniah': 3,
  'Haggai': 2,
  'Zechariah': 14,
  'Malachi': 4,
  'Matthew': 28,
  'Mark': 16,
  'Luke': 24,
  'John': 21,
  'Acts': 28,
  'Romans': 16,
  '1 Corinthians': 16,
  '2 Corinthians': 13,
  'Galatians': 6,
  'Ephesians': 6,
  'Philippians': 4,
  'Colossians': 4,
  '1 Thessalonians': 5,
  '2 Thessalonians': 3,
  '1 Timothy': 6,
  '2 Timothy': 4,
  'Titus': 3,
  'Philemon': 1,
  'Hebrews': 13,
  'James': 5,
  '1 Peter': 5,
  '2 Peter': 3,
  '1 John': 5,
  '2 John': 1,
  '3 John': 1,
  'Jude': 1,
  'Revelation': 22
};

function parseNumberSequence(tokens, bookName) {
  const candidates = [];

  // If there are two or more tokens, try splitting them into chapter/verse
  if (tokens.length >= 2) {
    for (let splitIndex = 1; splitIndex < tokens.length; splitIndex += 1) {
      const chapterTokens = tokens.slice(0, splitIndex);
      const verseTokens = tokens.slice(splitIndex);
      const chapter = parseSingleNumber(chapterTokens);
      const verse = parseSingleNumber(verseTokens);

      if (chapter !== null && verse !== null) {
        candidates.push({ chapter, verse });
      }
    }
  }

  // If there is only a single token, it may be a concatenated numeric like "11"
  // representing chapter+verse. Try every possible split of digits.
  if (tokens.length === 1) {
    const token = tokens[0];
    if (/^\d+$/.test(token)) {
      for (let i = 1; i < token.length; i += 1) {
        const chapStr = token.slice(0, i);
        const verseStr = token.slice(i);
        const chapter = parseSingleNumber([chapStr]);
        const verse = parseSingleNumber([verseStr]);
        if (chapter !== null && verse !== null) {
          candidates.push({ chapter, verse });
        }
      }
    }
  }

  if (candidates.length === 0) {
    return null;
  }

  // If exactly one candidate, return it
  if (candidates.length === 1) {
    return candidates[0];
  }

  // Try to disambiguate using book chapter counts when available
  if (bookName && CHAPTER_COUNTS[bookName]) {
    const maxCh = CHAPTER_COUNTS[bookName];
    const filtered = candidates.filter(c => c.chapter >= 1 && c.chapter <= maxCh);
    if (filtered.length === 1) return filtered[0];
    if (filtered.length > 1) candidates.splice(0, candidates.length, ...filtered);
  }

  // As a tie-breaker, prefer the candidate with the smaller chapter number
  candidates.sort((a, b) => (a.chapter - b.chapter) || (a.verse - b.verse));
  return candidates[0];
}

function findBook(tokens) {
  const maxLength = Math.min(MAX_ALIAS_TOKEN_LENGTH, tokens.length);

  for (let length = maxLength; length >= 1; length -= 1) {
    const alias = tokens.slice(0, length).join(' ');
    const book = BOOK_LOOKUP.get(alias);

    if (book) {
      return {
        book,
        consumedTokens: length
      };
    }
  }

  return null;
}

function parseReference(transcript) {
  if (typeof transcript !== 'string' || !transcript.trim()) {
    return null;
  }

  const tokens = tokenize(transcript);

  // require at least book + one numeric token (e.g. "Genesis 1" or "Genesis 1 1")
  if (tokens.length < 2) {
    return null;
  }

  const bookMatch = findBook(tokens);

  if (!bookMatch) {
    return null;
  }

  const remainder = tokens.slice(bookMatch.consumedTokens);

  const parsedTail = parseNumberSequence(remainder, bookMatch.book);

  if (!parsedTail) {
    return null;
  }

  return {
    book: bookMatch.book,
    chapter: parsedTail.chapter,
    verse: parsedTail.verse
  };
}

module.exports = {
  parseReference
};