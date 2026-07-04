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

function parseNumberSequence(tokens) {
  if (tokens.length < 2) {
    return null;
  }

  const candidates = [];

  for (let splitIndex = 1; splitIndex < tokens.length; splitIndex += 1) {
    const chapterTokens = tokens.slice(0, splitIndex);
    const verseTokens = tokens.slice(splitIndex);
    const chapter = parseSingleNumber(chapterTokens);
    const verse = parseSingleNumber(verseTokens);

    if (chapter !== null && verse !== null) {
      candidates.push({ chapter, verse });
    }
  }

  if (candidates.length !== 1) {
    return null;
  }

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

  if (tokens.length < 3) {
    return null;
  }

  const bookMatch = findBook(tokens);

  if (!bookMatch) {
    return null;
  }

  const remainder = tokens.slice(bookMatch.consumedTokens);

  const parsedTail = parseNumberSequence(remainder);

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