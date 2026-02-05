/**
 * Job Readiness analysis — runs entirely in the browser (no server needed).
 * Used for GitHub Pages and any static hosting.
 */
(function () {
  var ROLES = {
    BACKEND: 'Backend Engineer',
    FULL_STACK: 'Full Stack Engineer',
    DATA_ENGINEER: 'Data Engineer'
  };

  var BUCKETS = [
    'DSA',
    'System Design',
    'Core Programming',
    'Role Stack',
    'Projects / Experience'
  ];

  var BUCKET_KEYWORDS = {
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
    'Role Stack': [],
    'Projects / Experience': [
      'project', 'experience', 'built', 'developed', 'implemented', 'deployed',
      'years', 'internship', 'work experience', 'portfolio', 'github', 'contributed',
      'led', 'designed', 'architected', 'launched', 'production', 'real-world'
    ]
  };

  var ROLE_STACK_KEYWORDS = {};
  ROLE_STACK_KEYWORDS[ROLES.BACKEND] = [
    'backend', 'server', 'node', 'express', 'django', 'flask', 'spring', 'fastapi',
    'sql', 'database', 'postgres', 'mysql', 'mongodb', 'redis', 'elasticsearch',
    'aws', 'docker', 'kubernetes', 'ci/cd', 'rest api', 'graphql', 'grpc',
    'authentication', 'authorization', 'jwt', 'oauth', 'message queue', 'kafka', 'rabbitmq'
  ];
  ROLE_STACK_KEYWORDS[ROLES.FULL_STACK] = [
    'frontend', 'backend', 'react', 'vue', 'angular', 'next.js', 'html', 'css', 'javascript',
    'node', 'express', 'full stack', 'fullstack', 'rest api', 'database', 'sql',
    'redux', 'state management', 'responsive', 'ui', 'ux', 'typescript', 'spa',
    'aws', 'deployment', 'docker', 'vercel', 'netlify'
  ];
  ROLE_STACK_KEYWORDS[ROLES.DATA_ENGINEER] = [
    'etl', 'data pipeline', 'spark', 'airflow', 'sql', 'python', 'data warehouse',
    'snowflake', 'bigquery', 'redshift', 'kafka', 'hadoop', 'hive', 'presto',
    'data modeling', 'dimensional', 'batch', 'streaming', 'dbt', 'databricks',
    'data quality', 'metadata', 'data lake', 'elt'
  ];

  function getFrameworkForRole(role) {
    var roleStack = ROLE_STACK_KEYWORDS[role] || ROLE_STACK_KEYWORDS[ROLES.BACKEND];
    var keywords = {};
    for (var k in BUCKET_KEYWORDS) keywords[k] = BUCKET_KEYWORDS[k].slice ? BUCKET_KEYWORDS[k].slice() : [];
    keywords['Role Stack'] = roleStack;
    return { buckets: BUCKETS, keywords: keywords };
  }

  function normalizeText(text) {
    return (text || '').toLowerCase().replace(/\s+/g, ' ').trim();
  }

  function countKeywordHits(text, keywords) {
    var normalized = normalizeText(text);
    var hits = 0;
    for (var i = 0; i < keywords.length; i++) {
      if (normalized.indexOf(keywords[i].toLowerCase()) !== -1) hits++;
    }
    return hits;
  }

  function hitsToLevel(hits, totalKeywords) {
    if (totalKeywords === 0) return 'Low';
    var ratio = hits / totalKeywords;
    if (ratio >= 0.35) return 'High';
    if (ratio >= 0.15) return 'Medium';
    return 'Low';
  }

  var EXPECTED_LEVEL = 'High';

  function levelToScore(level) {
    if (level === 'High') return 100;
    if (level === 'Medium') return 60;
    return 25;
  }

  function statusFromLevels(yourLevel, expectedLevel) {
    if (yourLevel === 'High') return 'Good';
    if (yourLevel === 'Medium' && expectedLevel === 'High') return 'Needs Work';
    if (yourLevel === 'Medium') return 'Good';
    return 'Needs Work';
  }

  function analyzeJobReadiness(text, role) {
    var framework = getFrameworkForRole(role);
    var buckets = framework.buckets;
    var keywordMap = framework.keywords;
    var skillAreas = [];
    var totalScore = 0;
    var maxScore = buckets.length * 100;

    for (var b = 0; b < buckets.length; b++) {
      var bucket = buckets[b];
      var keywords = keywordMap[bucket] || [];
      var hits = countKeywordHits(text, keywords);
      var yourLevel = hitsToLevel(hits, Math.max(keywords.length, 1));
      var expectedLevel = EXPECTED_LEVEL;
      var status = statusFromLevels(yourLevel, expectedLevel);
      var bucketScore = levelToScore(yourLevel);
      skillAreas.push({
        skillArea: bucket,
        expectedLevel: expectedLevel,
        yourLevel: yourLevel,
        status: status,
        score: bucketScore,
        hits: hits,
        totalKeywords: keywords.length
      });
      totalScore += bucketScore;
    }

    var overallScore = Math.round((totalScore / maxScore) * 100);
    var clampedScore = Math.min(100, Math.max(0, overallScore));
    var weakAreas = [];
    for (var j = 0; j < skillAreas.length; j++) {
      if (skillAreas[j].status === 'Needs Work') weakAreas.push(skillAreas[j].skillArea);
    }

    return { role: role, overallScore: clampedScore, skillAreas: skillAreas, weakAreas: weakAreas };
  }

  function perturbScore(baseScore) {
    var delta = (Math.random() * 26) - 18;
    var raw = baseScore + delta;
    return Math.min(100, Math.max(0, Math.round(raw)));
  }

  function getInsight(role, weakAreas) {
    var roleTips = {};
    roleTips[ROLES.BACKEND] = 'Most candidates fail Backend interviews due to weak DSA and System Design, not resume formatting.';
    roleTips[ROLES.FULL_STACK] = 'Full Stack roles often screen for both problem-solving and hands-on project depth — gaps in either can hold you back.';
    roleTips[ROLES.DATA_ENGINEER] = 'Data Engineering interviews focus on data modeling, pipelines, and SQL; missing fundamentals here is a common gap.';
    var base = roleTips[role] || roleTips[ROLES.BACKEND];
    if (!weakAreas || weakAreas.length === 0) {
      return 'Your profile aligns well with common expectations for this role. Focus on the areas above to stay sharp.';
    }
    if (weakAreas.length <= 2) {
      return 'Focus on ' + weakAreas.join(' and ') + ' to improve your readiness for ' + role + ' roles. ' + base;
    }
    return base + ' In your case, the main gaps are: ' + weakAreas.slice(0, 3).join(', ') + '.';
  }

  window.runJobReadiness = function (text, role) {
    var analysis = analyzeJobReadiness(text, role);
    var insight = getInsight(role, analysis.weakAreas);
    var overallScore = perturbScore(analysis.overallScore);
    return {
      ok: true,
      overallScore: overallScore,
      skillAreas: analysis.skillAreas,
      weakAreas: analysis.weakAreas,
      insight: insight,
      role: analysis.role
    };
  };
})();
