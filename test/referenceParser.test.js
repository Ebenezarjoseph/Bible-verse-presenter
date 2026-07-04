const test = require('node:test');
const assert = require('node:assert/strict');
const { parseReference } = require('../src/referenceParser');

test('parses a simple spoken Genesis reference', () => {
  assert.deepEqual(parseReference('genesis one one'), {
    book: 'Genesis',
    chapter: 1,
    verse: 1
  });
});

test('parses chapter and verse filler words', () => {
  assert.deepEqual(parseReference('genesis chapter 1 verse 1'), {
    book: 'Genesis',
    chapter: 1,
    verse: 1
  });
});

test('parses colon separated references', () => {
  assert.deepEqual(parseReference('genesis 1:1'), {
    book: 'Genesis',
    chapter: 1,
    verse: 1
  });
});

test('parses multi-word numeric books', () => {
  assert.deepEqual(parseReference('first corinthians thirteen four'), {
    book: '1 Corinthians',
    chapter: 13,
    verse: 4
  });
});

test('parses abbreviations', () => {
  assert.deepEqual(parseReference('matt 5 9'), {
    book: 'Matthew',
    chapter: 5,
    verse: 9
  });
});

test('parses Psalms with a long chapter number', () => {
  assert.deepEqual(parseReference('psalm one hundred nineteen one'), {
    book: 'Psalms',
    chapter: 119,
    verse: 1
  });
});

test('parses Song of Solomon aliases', () => {
  assert.deepEqual(parseReference('song of songs 2 1'), {
    book: 'Song of Solomon',
    chapter: 2,
    verse: 1
  });
});

test('parses second Timothy', () => {
  assert.deepEqual(parseReference('second timothy 3 16'), {
    book: '2 Timothy',
    chapter: 3,
    verse: 16
  });
});

test('parses compact abbreviation forms', () => {
  assert.deepEqual(parseReference('2 tim 3 16'), {
    book: '2 Timothy',
    chapter: 3,
    verse: 16
  });
});

test('parses first John', () => {
  assert.deepEqual(parseReference('first john one nine'), {
    book: '1 John',
    chapter: 1,
    verse: 9
  });
});

test('parses Revelation', () => {
  assert.deepEqual(parseReference('revelation 21 4'), {
    book: 'Revelation',
    chapter: 21,
    verse: 4
  });
});

test('parses 3 John', () => {
  assert.deepEqual(parseReference('3 john one two'), {
    book: '3 John',
    chapter: 1,
    verse: 2
  });
});

test('parses Genesis with a spoken two-digit chapter', () => {
  assert.deepEqual(parseReference('genesis chapter twenty one verse three'), {
    book: 'Genesis',
    chapter: 21,
    verse: 3
  });
});

test('parses a common speech-to-text mishear for Genesis', () => {
  assert.deepEqual(parseReference('gennesis 1 1'), {
    book: 'Genesis',
    chapter: 1,
    verse: 1
  });
});

test('returns null for ambiguous input', () => {
  assert.equal(parseReference('chapter verse 1'), null);
});

test('returns null for garbage input', () => {
  assert.equal(parseReference('blue bananas and thunder'), null);
});

test('returns null for incomplete references', () => {
  assert.equal(parseReference('genesis 1'), null);
});
