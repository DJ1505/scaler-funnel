/**
 * Skill framework for Job Readiness Mapper.
 * Deterministic keyword-based mapping. No AI for scoring.
 */

const ROLES = {
  BACKEND: 'Backend Engineer',
  FULL_STACK: 'Full Stack Engineer',
  DATA_ENGINEER: 'Data Engineer'
};

const BUCKETS = [
  'DSA',
  'System Design',
  'Core Programming',
  'Role Stack',
  'Projects / Experience'
];

// Keywords per bucket. Role Stack is filled per role below.
const BUCKET_KEYWORDS = {
  DSA: [
    'data structures', 'algorithms', 'dsa', 'arrays', 'linked list', 'tree', 'graph',
    'dynamic programming', 'dp', 'recursion', 'sorting', 'searching', 'hash', 'heap',
    'stack', 'queue', 'binary search', 'bfs', 'dfs', 'leetcode', 'hackerrank', 'competitive programming'
  ],
  'System Design': [
    'system design', 'scalability', 'distributed', 'microservices', 'api design',
    'load balancing', 'caching', 'database design', 'rest', 'messaging', 'queue',
    'cap theorem', 'consistency', 'availability', 'latency', 'throughput', 'cdns',
    'sharding', 'replication', 'design patterns', 'high level design', 'hld', 'lld'
  ],
  'Core Programming': [
    'python', 'java', 'javascript', 'typescript', 'go', 'golang', 'c++', 'c#', 'rust',
    'oop', 'object oriented', 'multithreading', 'concurrency', 'async', 'memory management',
    'git', 'debugging', 'testing', 'unit test', 'code review', 'clean code', 'refactoring'
  ],
  'Role Stack': [], // filled per role
  'Projects / Experience': [
    'project', 'experience', 'built', 'developed', 'implemented', 'deployed',
    'years', 'internship', 'work experience', 'portfolio', 'github', 'contributed',
    'led', 'designed', 'architected', 'launched', 'production', 'real-world'
  ]
};

const ROLE_STACK_KEYWORDS = {
  [ROLES.BACKEND]: [
    'backend', 'server', 'node', 'express', 'django', 'flask', 'spring', 'fastapi',
    'sql', 'database', 'postgres', 'mysql', 'mongodb', 'redis', 'elasticsearch',
    'aws', 'docker', 'kubernetes', 'ci/cd', 'rest api', 'graphql', 'grpc',
    'authentication', 'authorization', 'jwt', 'oauth', 'message queue', 'kafka', 'rabbitmq'
  ],
  [ROLES.FULL_STACK]: [
    'frontend', 'backend', 'react', 'vue', 'angular', 'next.js', 'html', 'css', 'javascript',
    'node', 'express', 'full stack', 'fullstack', 'rest api', 'database', 'sql',
    'redux', 'state management', 'responsive', 'ui', 'ux', 'typescript', 'spa',
    'aws', 'deployment', 'docker', 'vercel', 'netlify'
  ],
  [ROLES.DATA_ENGINEER]: [
    'etl', 'data pipeline', 'spark', 'airflow', 'sql', 'python', 'data warehouse',
    'snowflake', 'bigquery', 'redshift', 'kafka', 'hadoop', 'hive', 'presto',
    'data modeling', 'dimensional', 'batch', 'streaming', 'dbt', 'databricks',
    'data quality', 'metadata', 'data lake', 'elt'
  ]
};

function getFrameworkForRole(role) {
  const roleStack = ROLE_STACK_KEYWORDS[role] || ROLE_STACK_KEYWORDS[ROLES.BACKEND];
  return {
    buckets: BUCKETS,
    keywords: {
      ...BUCKET_KEYWORDS,
      'Role Stack': roleStack
    }
  };
}

/**
 * Normalize text for matching: lowercase, collapse whitespace.
 */
function normalizeText(text) {
  return (text || '').toLowerCase().replace(/\s+/g, ' ').trim();
}

/**
 * Count how many keywords from list appear in text (substring match).
 */
function countKeywordHits(text, keywords) {
  const normalized = normalizeText(text);
  let hits = 0;
  for (const kw of keywords) {
    if (normalized.includes(kw.toLowerCase())) hits++;
  }
  return hits;
}

/**
 * Map hit count to level. Thresholds are tuned so typical resumes get mixed High/Medium/Low.
 */
function hitsToLevel(hits, totalKeywords) {
  if (totalKeywords === 0) return 'Low';
  const ratio = hits / totalKeywords;
  if (ratio >= 0.35) return 'High';
  if (ratio >= 0.15) return 'Medium';
  return 'Low';
}

/**
 * Expected level per bucket for scoring. All buckets same weight for simplicity.
 */
const EXPECTED_LEVEL = 'High';

function levelToScore(level) {
  switch (level) {
    case 'High': return 100;
    case 'Medium': return 60;
    case 'Low': return 25;
    default: return 25;
  }
}

function statusFromLevels(yourLevel, expectedLevel) {
  if (yourLevel === 'High') return 'Good';
  if (yourLevel === 'Medium' && expectedLevel === 'High') return 'Needs Work';
  if (yourLevel === 'Medium') return 'Good';
  return 'Needs Work';
}

/**
 * Run deterministic analysis: extract presence, bucket levels, overall score.
 */
function analyzeJobReadiness(text, role) {
  const framework = getFrameworkForRole(role);
  const buckets = framework.buckets;
  const keywordMap = framework.keywords;

  const skillAreas = [];
  let totalScore = 0;
  const maxScore = buckets.length * 100;

  for (const bucket of buckets) {
    const keywords = keywordMap[bucket] || [];
    const hits = countKeywordHits(text, keywords);
    const yourLevel = hitsToLevel(hits, Math.max(keywords.length, 1));
    const expectedLevel = EXPECTED_LEVEL;
    const status = statusFromLevels(yourLevel, expectedLevel);
    const bucketScore = levelToScore(yourLevel);

    skillAreas.push({
      skillArea: bucket,
      expectedLevel,
      yourLevel,
      status,
      score: bucketScore,
      hits,
      totalKeywords: keywords.length
    });
    totalScore += bucketScore;
  }

  const overallScore = Math.round((totalScore / maxScore) * 100);
  const clampedScore = Math.min(100, Math.max(0, overallScore));

  return {
    role,
    overallScore: clampedScore,
    skillAreas,
    weakAreas: skillAreas.filter(a => a.status === 'Needs Work').map(a => a.skillArea)
  };
}

module.exports = {
  ROLES,
  BUCKETS,
  getFrameworkForRole,
  analyzeJobReadiness,
  normalizeText
};
