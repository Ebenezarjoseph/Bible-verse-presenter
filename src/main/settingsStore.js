const { app } = require('electron');
const path = require('path');
const fs = require('fs');

const FILE = path.join(app.getPath('userData'), 'settings.json');

const DEFAULTS = {
  translation: 'kjv',
  displayId: null
};

function readSettings() {
  try {
    if (!fs.existsSync(FILE)) return Object.assign({}, DEFAULTS);
    const raw = fs.readFileSync(FILE, 'utf8');
    const parsed = JSON.parse(raw || '{}');
    return Object.assign({}, DEFAULTS, parsed);
  } catch (e) {
    return Object.assign({}, DEFAULTS);
  }
}

function writeSettings(settings) {
  try {
    const toWrite = Object.assign({}, DEFAULTS, settings || {});
    fs.mkdirSync(path.dirname(FILE), { recursive: true });
    fs.writeFileSync(FILE, JSON.stringify(toWrite, null, 2), 'utf8');
    return toWrite;
  } catch (e) {
    return Object.assign({}, DEFAULTS, settings || {});
  }
}

module.exports = { readSettings, writeSettings };
