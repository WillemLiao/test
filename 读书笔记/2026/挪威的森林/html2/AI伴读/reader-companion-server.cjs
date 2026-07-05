const http = require('http');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const PORT = Number(process.env.PORT || 8765);
const MODEL = process.env.OPENCODE_MODEL || 'opencode/deepseek-v4-flash-free';
const API_KEY = process.env.OPENCODE_API_KEY || '123';
const CHAT_URL = process.env.OPENCODE_BASE_URL || 'http://127.0.0.1:10000/v1/chat/completions';

function send(res, status, data) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(JSON.stringify(data));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 100000) reject(new Error('Body too large'));
    });
    req.on('end', () => {
      try { resolve(body ? JSON.parse(body) : {}); }
      catch (error) { reject(error); }
    });
    req.on('error', reject);
  });
}

function stripReasoning(text) {
  return String(text || '')
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/^[\s\r\n]*<\/think>/i, '')
    .trim();
}

function extractFirstJson(text) {
  const cleaned = stripReasoning(text)
    .replace(/^```(?:json)?/i, '')
    .replace(/```$/i, '')
    .trim();
  const start = cleaned.indexOf('{');
  if (start < 0) throw new Error('No JSON object in LLM output: ' + cleaned.slice(0, 400));
  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = start; i < cleaned.length; i++) {
    const ch = cleaned[i];
    if (inString) {
      if (escape) escape = false;
      else if (ch === '\\') escape = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) return JSON.parse(cleaned.slice(start, i + 1));
    }
  }
  throw new Error('Unclosed JSON object in LLM output');
}

function runCurl(args, stdin) {
  return new Promise((resolve, reject) => {
    const child = spawn('curl.exe', args, { stdio: ['pipe', 'pipe', 'pipe'], windowsHide: true });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', data => stdout += data.toString());
    child.stderr.on('data', data => stderr += data.toString());
    child.on('error', reject);
    child.on('close', code => {
      if (code !== 0) return reject(new Error(stderr || stdout || `curl exited ${code}`));
      resolve(stdout);
    });
    child.stdin.end(stdin);
  });
}

async function runLLM(prompt) {
  const body = JSON.stringify({
    model: MODEL,
    messages: [
      { role: 'system', content: 'Return strict JSON only. Do not include Markdown, explanations, reasoning, or <think> tags. Hide all internal reasoning.' },
      { role: 'user', content: prompt }
    ],
    temperature: 0.2,
    stream: false
  });
  const proxy = process.env.HTTPS_PROXY || process.env.HTTP_PROXY || process.env.ALL_PROXY || '';
  const curlArgs = [
    '-sS',
    '--max-time', '60',
    ...(proxy ? ['--proxy', proxy] : []),
    '-X', 'POST',
    '-H', 'Content-Type: application/json',
    '-H', `Authorization: Bearer ${API_KEY}`,
    '--data-binary', '@-',
    CHAT_URL
  ];
  const raw = await runCurl(curlArgs, body);

  let payload;
  try { payload = raw ? JSON.parse(raw) : {}; }
  catch { payload = { raw }; }

  if (payload?.error) throw new Error(payload.error.message || JSON.stringify(payload.error));

  const text = stripReasoning(payload?.choices?.[0]?.message?.content || '');
  if (!text) throw new Error('LLM returned empty content');
  return extractFirstJson(text);
}function wordPrompt(word, context) {
  return [
    'You are an English novel reading companion for a Chinese learner reading Norwegian Wood.',
    'Return ONLY one strict JSON object. No Markdown. No extra text.',
    'Selected word: ' + word,
    'Local context: ' + (context || ''),
    'JSON shape:',
    '{"base":"...","partOfSpeech":"...","meaningZh":"...","memoryHintZh":"...","exampleEn":"...","exampleZh":"...","forms":["..."]}',
    'Rules:',
    '- meaningZh, memoryHintZh, exampleZh must be Simplified Chinese.',
    '- base must be the lemma/base form in lowercase.',
    '- meaningZh must match the local context first, then mention other common meanings only if useful.',
    '- forms must include only real common forms for this word and this part of speech in the local context.',
    '- For nouns, include plural forms when common. Do not invent verb forms like -ed or -ing unless the word is actually used as a verb.',
    '- For adjectives, include comparative/superlative only when common. Do not invent -ed or -ing forms.',
    '- exampleEn should reuse or adapt the local context when possible.'
  ].join('\n');
}

function sentencePrompt(sentence) {
  return [
    'You are an English long-sentence parsing teacher for a Chinese learner reading a novel.',
    'Return ONLY one strict JSON object. No Markdown. No extra text.',
    'Selected sentence: ' + sentence,
    'JSON shape:',
    '{"original":"...","mainClause":"...","subject":"...","predicate":"...","objectsOrComplements":["..."],"modifiers":["..."],"clauses":["..."],"phrases":["..."],"simpleEnglish":"...","translationZh":"...","learningPointZh":"..."}',
    'Rules:',
    '- translationZh and learningPointZh must be Simplified Chinese.',
    '- mainClause, subject, predicate, objectsOrComplements, modifiers, clauses, phrases, simpleEnglish should focus on grammar and reading comprehension.',
    '- Explain clauses and phrases in a way that helps a Chinese learner read the original sentence, not just label grammar.',
    '- If a category is absent, return an empty array for arrays.'
  ].join('\n');
}

function wordPosText(word) {
  return String(word?.partOfSpeech || word?.meaning || '').toLowerCase();
}

function isNounWord(word) {
  return /(^|\b)(noun|n\.|名词)(\b|$)/.test(wordPosText(word));
}

function isVerbWord(word) {
  return /(^|\b)(verb|v\.|动词)(\b|$)/.test(wordPosText(word));
}

function pluralFor(base) {
  if (!base || base.length < 2 || /[^a-z]/i.test(base)) return '';
  if (/[^aeiou]y$/i.test(base)) return base.slice(0, -1) + 'ies';
  if (/(?:s|x|z|ch|sh)$/i.test(base)) return base + 'es';
  return base + 's';
}

function cleanForms(forms, word) {
  const base = String(word.base || '').toLowerCase().trim();
  const noun = isNounWord(word);
  const verb = isVerbWord(word);
  const seen = new Set();
  for (const value of forms || []) {
    const form = String(value || '').toLowerCase().trim();
    if (!form || form === base || seen.has(form)) continue;
    const looksVerbish = form === base + 'ed'
      || form === base + 'ing'
      || form === base.slice(0, -1) + 'ing'
      || form === base.slice(0, -1) + 'ed'
      || form === base.slice(0, -1) + 'ied';
    const looksPlural = form === base + 's'
      || form === base + 'es'
      || form === base.slice(0, -1) + 'ies';
    if (!verb && looksVerbish) continue;
    if (!noun && !verb && looksPlural) continue;
    seen.add(form);
  }
  if (noun) {
    const plural = pluralFor(base);
    if (plural && plural !== base) seen.add(plural);
  }
  return [...seen];
}

function normalizeWordResult(data, fallback) {
  const base = String(data.base || fallback || '').toLowerCase().trim();
  const word = {
    base,
    partOfSpeech: data.partOfSpeech || '',
    meaningZh: data.meaningZh || '',
    memoryHintZh: data.memoryHintZh || '',
    exampleEn: data.exampleEn || '',
    exampleZh: data.exampleZh || ''
  };
  return {
    ...word,
    forms: cleanForms(Array.isArray(data.forms) ? data.forms : [], word)
  };
}

function cleanStoredWord(raw, key) {
  const item = raw && typeof raw === 'object' ? raw : {};
  const base = String(item.base || key || '').toLowerCase().trim();
  const wordForForms = {
    base,
    partOfSpeech: item.partOfSpeech || item.ai?.partOfSpeech || '',
    meaning: item.meaning || item.ai?.meaningZh || ''
  };
  const cleaned = { ...item, base };
  cleaned.forms = cleanForms(Array.isArray(item.forms) ? item.forms : [], wordForForms);
  if (item.ai && typeof item.ai === 'object') {
    const aiWord = { ...wordForForms, partOfSpeech: item.ai.partOfSpeech || wordForForms.partOfSpeech };
    cleaned.ai = { ...item.ai, base, forms: cleanForms(Array.isArray(item.ai.forms) ? item.ai.forms : [], aiWord) };
  }
  return cleaned;
}

function sanitizeStoredWords(words) {
  const result = {};
  if (!words || typeof words !== 'object') return result;
  for (const [key, value] of Object.entries(words)) {
    const cleaned = cleanStoredWord(value, key);
    if (cleaned.base) result[cleaned.base] = cleaned;
  }
  return result;
}
const WORDBOOK_STORE = path.join(__dirname, 'reader-companion-wordbooks.json');

function safeWordbookKey(file) {
  return path.basename(String(file || 'reader-companion-inline.html')).replace(/[^a-zA-Z0-9._-]/g, '_');
}

function readWordbookStore() {
  if (!fs.existsSync(WORDBOOK_STORE)) return { version: 1, updatedAt: null, files: {} };
  const data = JSON.parse(fs.readFileSync(WORDBOOK_STORE, 'utf8'));
  return { version: data.version || 1, updatedAt: data.updatedAt || null, files: data.files && typeof data.files === 'object' ? data.files : {} };
}

function writeWordbookStore(store) {
  store.updatedAt = new Date().toISOString();
  fs.writeFileSync(WORDBOOK_STORE, JSON.stringify(store, null, 2), 'utf8');
}

function readWordbook(file) {
  const key = safeWordbookKey(file);
  const store = readWordbookStore();
  const entry = store.files[key] || { words: {}, deletedWords: [] };
  return {
    file: key,
    words: entry.words || {},
    deletedWords: Array.isArray(entry.deletedWords) ? entry.deletedWords : [],
    updatedAt: entry.updatedAt || null
  };
}

function writeWordbook(file, state) {
  const key = safeWordbookKey(file);
  const store = readWordbookStore();
  const entry = {
    file: key,
    updatedAt: new Date().toISOString(),
    words: sanitizeStoredWords(state && state.words),
    deletedWords: state && Array.isArray(state.deletedWords) ? state.deletedWords : []
  };
  store.files[key] = entry;
  writeWordbookStore(store);
  return { ok: true, path: WORDBOOK_STORE, file: key, updatedAt: entry.updatedAt, wordCount: Object.keys(entry.words).length };
}

function normalizeSentenceResult(data, sentence) {
  const asArray = value => Array.isArray(value) ? value.map(String).filter(Boolean) : [];
  return {
    original: data.original || sentence,
    mainClause: data.mainClause || '',
    subject: data.subject || '',
    predicate: data.predicate || '',
    objectsOrComplements: asArray(data.objectsOrComplements),
    modifiers: asArray(data.modifiers),
    clauses: asArray(data.clauses),
    phrases: asArray(data.phrases),
    simpleEnglish: data.simpleEnglish || '',
    translationZh: data.translationZh || '',
    learningPointZh: data.learningPointZh || ''
  };
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') return send(res, 200, { ok: true });
  if (req.method === 'GET' && req.url === '/health') {
    return send(res, 200, { ok: true, provider: 'opencode', model: MODEL, hasKey: Boolean(API_KEY), baseUrl: CHAT_URL });
  }

  try {
    if (req.method === 'GET' && req.url === '/api/wordbooks') {
      return send(res, 200, readWordbookStore());
    }

    if (req.method === 'GET' && req.url.startsWith('/api/wordbook')) {
      const url = new URL(req.url, 'http://127.0.0.1');
      const file = url.searchParams.get('file') || 'reader-companion-inline.html';
      return send(res, 200, readWordbook(file));
    }

    if (req.method === 'POST' && req.url.startsWith('/api/wordbook')) {
      const url = new URL(req.url, 'http://127.0.0.1');
      const file = url.searchParams.get('file') || 'reader-companion-inline.html';
      const body = await readBody(req);
      return send(res, 200, writeWordbook(file, body));
    }

    if (req.method === 'POST' && req.url === '/api/word') {
      const { word, context } = await readBody(req);
      if (!word) return send(res, 400, { error: 'word required' });
      const data = await runLLM(wordPrompt(word, context));
      return send(res, 200, normalizeWordResult(data, word));
    }

    if (req.method === 'POST' && req.url === '/api/sentence') {
      const { sentence } = await readBody(req);
      if (!sentence) return send(res, 400, { error: 'sentence required' });
      const data = await runLLM(sentencePrompt(sentence));
      return send(res, 200, normalizeSentenceResult(data, sentence));
    }

    return send(res, 404, { error: 'not found' });
  } catch (error) {
    return send(res, 500, { error: error.message || String(error) });
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`reader companion LLM service listening on http://127.0.0.1:${PORT}`);
});



