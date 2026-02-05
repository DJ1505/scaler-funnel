const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

// Optional: load .env from project root (no extra deps)
try {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    fs.readFileSync(envPath, 'utf8').split(/\r?\n/).forEach(function (line) {
      const m = line.match(/^([^#=]+)=(.*)$/);
      if (m) process.env[m[1].trim()] = m[2].trim();
    });
  }
} catch (e) {}

const { ROLES, analyzeJobReadiness } = require('./skill-framework');

const LEADS_FILE = path.join(__dirname, 'leads.json');
const PORT = process.env.PORT || 3456;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const MIN_INPUT_LENGTH = 80;

function loadLeads() {
  try {
    return JSON.parse(fs.readFileSync(LEADS_FILE, 'utf8'));
  } catch (e) {
    return { leads: [], submitted: [] };
  }
}

function saveLead(email, source) {
  const data = loadLeads();
  data.leads.push({ email, source: source || 'resume-check', ts: new Date().toISOString() });
  data.submitted.push(email);
  fs.writeFileSync(LEADS_FILE, JSON.stringify(data, null, 2));
}

function callOpenAI(resumeText) {
  return new Promise((resolve, reject) => {
    if (!OPENAI_API_KEY) {
      resolve(null);
      return;
    }
    const truncated = resumeText.slice(0, 12000);
    const body = JSON.stringify({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `You are a strict resume reviewer. Score resumes from 0-100. Be realistic: most resumes are 40-60, good ones 60-75, strong 75-85, exceptional 85-95. Poor or very short resumes should be below 40. Do not inflate scores.
Return ONLY a valid JSON object with exactly these keys (no markdown, no code block):
- "score": integer 0-100
- "scoreSummary": one short sentence (e.g. "Solid. A few tweaks and you're in good shape.")
- "good": array of 2-5 specific things that are working (strings)
- "fix": array of 2-5 specific, actionable improvements (strings)`
        },
        {
          role: 'user',
          content: `Score this resume and return only the JSON object.\n\n---\n${truncated}`
        }
      ],
      temperature: 0.3,
      max_tokens: 800
    });
    const req = https.request(
      {
        hostname: 'api.openai.com',
        path: '/v1/chat/completions',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          'Content-Length': Buffer.byteLength(body)
        }
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          if (res.statusCode !== 200) {
            reject(new Error(data || 'OpenAI request failed'));
            return;
          }
          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.message?.content;
            if (!content) {
              reject(new Error('No content in response'));
              return;
            }
            const result = JSON.parse(content);
            const score = Math.min(100, Math.max(0, Number(result.score) || 50));
            resolve({
              score,
              scoreSummary: result.scoreSummary || 'Review complete.',
              good: Array.isArray(result.good) ? result.good : [],
              fix: Array.isArray(result.fix) ? result.fix : []
            });
          } catch (e) {
            reject(e);
          }
        });
      }
    );
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// Non-uniform random perturbation: varies the score per request, biased toward lower (less job possibility).
function perturbScore(baseScore) {
  const delta = (Math.random() * 26) - 18; // range -18 to +8, mean ~ -5
  const raw = baseScore + delta;
  return Math.min(100, Math.max(0, Math.round(raw)));
}

// Deterministic insight: no AI. Uses role + weak areas only.
function getInsight(role, weakAreas) {
  const roleTips = {
    [ROLES.BACKEND]: 'Most candidates fail Backend interviews due to weak DSA and System Design, not resume formatting.',
    [ROLES.FULL_STACK]: 'Full Stack roles often screen for both problem-solving and hands-on project depth — gaps in either can hold you back.',
    [ROLES.DATA_ENGINEER]: 'Data Engineering interviews focus on data modeling, pipelines, and SQL; missing fundamentals here is a common gap.'
  };
  const base = roleTips[role] || roleTips[ROLES.BACKEND];
  if (!weakAreas || weakAreas.length === 0) {
    return 'Your profile aligns well with common expectations for this role. Focus on the areas above to stay sharp.';
  }
  if (weakAreas.length <= 2) {
    return 'Focus on ' + weakAreas.join(' and ') + ' to improve your readiness for ' + role + ' roles. ' + base;
  }
  return base + ' In your case, the main gaps are: ' + weakAreas.slice(0, 3).join(', ') + '.';
}

function serveFile(filePath, res) {
  const ext = path.extname(filePath);
  const types = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.ico': 'image/x-icon'
  };
  const contentType = types[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/api/job-readiness') {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      const send = (status, data) => {
        res.writeHead(status, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(data));
      };
      try {
        const payload = JSON.parse(body || '{}');
        const text = (payload.text || '').trim();
        const role = payload.role || ROLES.BACKEND;
        const validRoles = Object.values(ROLES);
        if (!validRoles.includes(role)) {
          send(400, { ok: false, error: 'Invalid role. Choose Backend Engineer, Full Stack Engineer, or Data Engineer.' });
          return;
        }
        if (!text || text.length < MIN_INPUT_LENGTH) {
          send(400, {
            ok: false,
            error: `Please provide at least ${MIN_INPUT_LENGTH} characters of resume or job description text to analyze.`
          });
          return;
        }
        const truncated = text.slice(0, 15000);
        const analysis = analyzeJobReadiness(truncated, role);
        const insight = getInsight(role, analysis.weakAreas);
        const overallScore = perturbScore(analysis.overallScore);
        send(200, {
          ok: true,
          overallScore,
          skillAreas: analysis.skillAreas,
          weakAreas: analysis.weakAreas,
          insight,
          role: analysis.role
        });
      } catch (e) {
        send(400, { ok: false, error: 'Invalid request body.' });
      }
    });
    return;
  }

  if (req.method === 'POST' && req.url === '/api/analyze') {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      const send = (status, data) => {
        res.writeHead(status, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(data));
      };
      try {
        const { text } = JSON.parse(body || '{}');
        const trimmed = (text || '').trim();
        if (!trimmed || trimmed.length < 50) {
          send(400, { ok: false, error: 'Resume text too short' });
          return;
        }
        callOpenAI(trimmed)
          .then((result) => {
            if (!result) {
              send(503, { ok: false, error: 'LLM not configured', useFallback: true });
              return;
            }
            const scoreClass = result.score >= 70 ? 'score-good' : result.score >= 50 ? 'score-ok' : 'score-bad';
            send(200, { ok: true, ...result, scoreClass });
          })
          .catch((err) => {
            console.error('OpenAI analyze error:', err.message);
            send(503, { ok: false, error: 'Analysis failed', useFallback: true });
          });
      } catch (e) {
        send(400, { ok: false, error: 'Invalid request' });
      }
    });
    return;
  }

  if (req.method === 'POST' && req.url === '/api/lead') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const data = JSON.parse(body || '{}');
        const email = (data.email || '').trim();
        const source = data.source || 'resume-check';

        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: false, error: 'Invalid email' }));
          return;
        }

        saveLead(email, source);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: 'Server error' }));
      }
    });
    return;
  }

  let filePath = path.join(__dirname, req.url === '/' ? 'index.html' : req.url);
  if (!path.extname(filePath)) {
    filePath = path.join(filePath, 'index.html');
  }
  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  serveFile(filePath, res);
});

server.listen(PORT, () => {
  console.log('Resume Check running at http://localhost:' + PORT);
  console.log('Leads saved to leads.json');
  if (OPENAI_API_KEY) {
    console.log('LLM scoring: enabled (OpenAI)');
  } else {
    console.log('LLM scoring: disabled (set OPENAI_API_KEY in .env to enable)');
  }
});
