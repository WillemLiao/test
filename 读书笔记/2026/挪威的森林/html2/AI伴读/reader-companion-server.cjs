const http = require('http');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const PORT = Number(process.env.PORT || 8765);
const MODEL = process.env.OAIPRO_MODEL || 'gpt-3.5-turbo';
const API_KEY = process.env.OAIPRO_API_KEY || '';
const CHAT_URL = process.env.OAIPRO_BASE_URL || 'https://api.oaipro.com/v1/chat/completions';

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

function extractFirstJson(text) {
  const cleaned = String(text || '')
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
  if (!API_KEY) throw new Error('OAIPRO_API_KEY is not set');
  const body = JSON.stringify({
    model: MODEL,
    messages: [
      { role: 'system', content: 'You return strict JSON only when asked. Do not use Markdown.' },
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

  const text = payload?.choices?.[0]?.message?.content?.trim();
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
    '- forms must include common inflections and irregular forms, such as plural, past tense, past participle, -ing, comparative/superlative when relevant.',
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

function normalizeWordResult(data, fallback) {
  const base = String(data.base || fallback || '').toLowerCase().trim();
  return {
    base,
    partOfSpeech: data.partOfSpeech || '',
    meaningZh: data.meaningZh || '',
    memoryHintZh: data.memoryHintZh || '',
    exampleEn: data.exampleEn || '',
    exampleZh: data.exampleZh || '',
    forms: Array.isArray(data.forms)
      ? [...new Set(data.forms.map(x => String(x).toLowerCase().trim()).filter(Boolean))]
      : []
  };
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
    words: state && state.words && typeof state.words === 'object' ? state.words : {},
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
    return send(res, 200, { ok: true, provider: 'oaipro', model: MODEL, hasKey: Boolean(API_KEY), baseUrl: CHAT_URL });
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






