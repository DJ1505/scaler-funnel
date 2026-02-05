const { ROLES, analyzeJobReadiness } = require('../../skill-framework');

const MIN_INPUT_LENGTH = 80;

function perturbScore(baseScore) {
  const delta = (Math.random() * 26) - 18;
  const raw = baseScore + delta;
  return Math.min(100, Math.max(0, Math.round(raw)));
}

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

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ ok: false, error: 'Method not allowed' }) };
  }

  try {
    const payload = JSON.parse(event.body || '{}');
    const text = (payload.text || '').trim();
    const role = payload.role || ROLES.BACKEND;
    const validRoles = Object.values(ROLES);

    if (!validRoles.includes(role)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ ok: false, error: 'Invalid role. Choose Backend Engineer, Full Stack Engineer, or Data Engineer.' })
      };
    }
    if (!text || text.length < MIN_INPUT_LENGTH) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          ok: false,
          error: `Please provide at least ${MIN_INPUT_LENGTH} characters of resume or job description text to analyze.`
        })
      };
    }

    const truncated = text.slice(0, 15000);
    const analysis = analyzeJobReadiness(truncated, role);
    const insight = getInsight(role, analysis.weakAreas);
    const overallScore = perturbScore(analysis.overallScore);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ok: true,
        overallScore,
        skillAreas: analysis.skillAreas,
        weakAreas: analysis.weakAreas,
        insight,
        role: analysis.role
      })
    };
  } catch (e) {
    return {
      statusCode: 400,
      body: JSON.stringify({ ok: false, error: 'Invalid request body.' })
    };
  }
};
