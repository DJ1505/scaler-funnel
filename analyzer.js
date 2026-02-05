(function () {
  if (typeof pdfjsLib !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';
  }

  var MIN_LENGTH = 80;

  var form = document.getElementById('analyzerForm');
  var resumeInput = document.getElementById('resumeInput');
  var jdInput = document.getElementById('jdInput');
  var roleSelect = document.getElementById('roleSelect');
  var results = document.getElementById('results');
  var emptyState = document.getElementById('emptyState');
  var errorState = document.getElementById('errorState');
  var emptyMessage = document.getElementById('emptyMessage');
  var errorMessage = document.getElementById('errorMessage');
  var analyzeBtn = document.getElementById('analyzeBtn');
  var uploadZone = document.getElementById('uploadZone');
  var pdfInput = document.getElementById('pdfInput');

  // How Scaler helps close each gap (controlled copy — no job/salary promises)
  var GAP_TO_SCALER = {
    'DSA': {
      why: 'DSA is the first filter in most technical interviews. Weak problem-solving here leads to early rejection.',
      scaler: 'Scaler’s structured DSA curriculum and practice with mentors helps you build pattern recognition and coding speed.'
    },
    'System Design': {
      why: 'System Design rounds separate senior and staff-level candidates. Interviewers look for trade-off thinking and scalability sense.',
      scaler: 'Live system design classes and real-world case studies at Scaler build the judgment interviewers expect.'
    },
    'Core Programming': {
      why: 'Language depth, concurrency, and clean code come up in both coding and design discussions.',
      scaler: 'Scaler’s core programming track covers language fundamentals, concurrency, and best practices used in production.'
    },
    'Role Stack': {
      why: 'Role-specific tech (APIs, databases, frameworks) is checked in projects and sometimes in live coding.',
      scaler: 'Relevant Scaler programs include hands-on projects and stack-specific modules aligned with industry roles.'
    },
    'Projects / Experience': {
      why: 'Interviewers probe real projects for depth. Thin or vague experience is a common red flag.',
      scaler: 'Guided projects and portfolio-building at Scaler give you concrete stories to discuss in interviews.'
    }
  };

  function track(step) {
    try {
      var data = JSON.parse(localStorage.getItem('job_readiness_funnel') || '{}');
      data[step] = (data[step] || 0) + 1;
      data.last = step;
      data.timestamp = Date.now();
      localStorage.setItem('job_readiness_funnel', JSON.stringify(data));
    } catch (e) {}
  }

  function getInputText() {
    var resumeTab = document.querySelector('.tab[data-tab="resume"]');
    var isResume = resumeTab && resumeTab.classList.contains('active');
    if (isResume) {
      return (resumeInput && resumeInput.value || '').trim();
    }
    return (jdInput && jdInput.value || '').trim();
  }

  function hideAll() {
    if (results) results.style.display = 'none';
    if (emptyState) emptyState.style.display = 'none';
    if (errorState) errorState.style.display = 'none';
  }

  function showEmpty(msg) {
    hideAll();
    if (emptyState) {
      if (emptyMessage && msg) emptyMessage.textContent = msg;
      emptyState.style.display = 'block';
    }
  }

  function showError(msg) {
    hideAll();
    if (errorState) {
      if (errorMessage && msg) errorMessage.textContent = msg;
      errorState.style.display = 'block';
    }
  }

  function showResults(data) {
    hideAll();
    if (!results) return;
    results.style.display = 'block';
    track('analyzed');

    var score = data.overallScore != null ? data.overallScore : 0;
    var role = data.role || 'Backend Engineer';

    var scoreCircle = document.getElementById('scoreCircle');
    var scorePct = document.getElementById('scorePct');
    var scoreRole = document.getElementById('scoreRole');
    var scoreSubtext = document.getElementById('scoreSubtext');
    if (scoreCircle) scoreCircle.textContent = score;
    if (scorePct) scorePct.textContent = score;
    if (scoreRole) scoreRole.textContent = role;
    if (scoreCircle) {
      scoreCircle.className = 'score-circle ' + (score >= 70 ? 'score-good' : score >= 50 ? 'score-ok' : 'score-bad');
    }
    if (scoreSubtext) {
      scoreSubtext.textContent = score >= 70 ? 'You’re in a strong position. Focus on weak areas to stand out.' : score >= 50 ? 'You have a base; closing the gaps below will improve your odds.' : 'Focus on the skill areas below to raise your readiness.';
    }

    var insightText = document.getElementById('insightText');
    if (insightText) insightText.textContent = data.insight || '';

    var tbody = document.getElementById('skillGapBody');
    if (tbody && Array.isArray(data.skillAreas)) {
      tbody.innerHTML = '';
      data.skillAreas.forEach(function (row) {
        var tr = document.createElement('tr');
        var statusClass = row.status === 'Good' ? 'status-good' : 'status-needs-work';
        tr.innerHTML =
          '<td>' + escapeHtml(row.skillArea) + '</td>' +
          '<td>' + escapeHtml(row.expectedLevel) + '</td>' +
          '<td>' + escapeHtml(row.yourLevel) + '</td>' +
          '<td class="' + statusClass + '">' + escapeHtml(row.status) + '</td>';
        tbody.appendChild(tr);
      });
    }

    var weakAreas = data.weakAreas || [];
    var gapCards = document.getElementById('gapCards');
    var closeGapsSection = document.getElementById('closeGapsSection');
    if (gapCards) {
      gapCards.innerHTML = '';
      if (weakAreas.length > 0) {
        weakAreas.forEach(function (area) {
          var info = GAP_TO_SCALER[area] || { why: 'This area is often assessed in interviews.', scaler: 'Scaler’s programs cover this with structured curriculum and mentor support.' };
          var li = document.createElement('li');
          li.className = 'gap-card';
          li.innerHTML = '<h4>' + escapeHtml(area) + '</h4>' +
            '<p><strong>Why it matters:</strong> ' + escapeHtml(info.why) + '</p>' +
            '<p><strong>How Scaler helps:</strong> ' + escapeHtml(info.scaler) + '</p>';
          gapCards.appendChild(li);
        });
      } else {
        var li = document.createElement('li');
        li.className = 'gap-card';
        li.innerHTML = '<p>Your profile looks aligned with expectations for this role. A career consultation can still help you prioritize and plan next steps.</p>';
        gapCards.appendChild(li);
      }
    }
    if (closeGapsSection) closeGapsSection.style.display = 'block';

    var consultCta = document.getElementById('consultCta');
    var programsCta = document.getElementById('programsCta');
    if (consultCta) consultCta.addEventListener('click', function () { track('consult_clicked'); });
    if (programsCta) programsCta.addEventListener('click', function () { track('programs_clicked'); });
  }

  function escapeHtml(s) {
    if (s == null) return '';
    var div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  function runCheck() {
    var text = getInputText();
    var role = roleSelect ? roleSelect.value : 'Backend Engineer';

    if (!text) {
      showEmpty('Paste your resume or job description and choose a target role, then click Check My Job Readiness.');
      return Promise.resolve();
    }
    if (text.length < MIN_LENGTH) {
      showEmpty('Please provide at least ' + MIN_LENGTH + ' characters (a few lines of resume or job description) so we can analyze meaningfully.');
      return Promise.resolve();
    }

    analyzeBtn.disabled = true;
    analyzeBtn.textContent = 'Checking...';

    // Run in browser (no server needed) — works on GitHub Pages and any static host
    if (typeof window.runJobReadiness === 'function') {
      try {
        var data = window.runJobReadiness(text, role);
        analyzeBtn.disabled = false;
        analyzeBtn.textContent = 'Check My Job Readiness';
        if (data && data.ok) {
          showResults(data);
        } else {
          showError('Something went wrong. Please try again.');
        }
      } catch (e) {
        analyzeBtn.disabled = false;
        analyzeBtn.textContent = 'Check My Job Readiness';
        showError('Something went wrong. Please try again.');
      }
      return Promise.resolve();
    }

    return fetch('/api/job-readiness', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: text, role: role })
    })
      .then(function (res) { return res.json().then(function (data) { return { ok: res.ok, status: res.status, data: data }; }); })
      .then(function (r) {
        analyzeBtn.disabled = false;
        analyzeBtn.textContent = 'Check My Job Readiness';
        if (r.ok && r.data.ok) {
          showResults(r.data);
        } else {
          var msg = (r.data && r.data.error) ? r.data.error : 'Something went wrong. Please try again.';
          showError(msg);
        }
      })
      .catch(function () {
        analyzeBtn.disabled = false;
        analyzeBtn.textContent = 'Check My Job Readiness';
        showError('Network error. Please try again.');
      });
  }

  // Tabs: Resume vs Job Description
  document.querySelectorAll('.tab').forEach(function (tab) {
    tab.addEventListener('click', function () {
      document.querySelectorAll('.tab').forEach(function (t) { t.classList.remove('active'); });
      document.querySelectorAll('.tab-panel').forEach(function (p) { p.classList.remove('active'); });
      tab.classList.add('active');
      var panelId = tab.dataset.tab === 'resume' ? 'resumePanel' : 'jdPanel';
      var panel = document.getElementById(panelId);
      if (panel) panel.classList.add('active');
      if (uploadZone) uploadZone.classList.remove('loading', 'error');
      if (uploadZone && uploadZone.querySelector('p')) {
        uploadZone.querySelector('p').innerHTML = 'Drop your PDF here or <span class="upload-link">browse</span>';
      }
    });
  });

  // Sub-tabs: Paste vs Upload (resume only)
  document.querySelectorAll('.sub-tab').forEach(function (tab) {
    tab.addEventListener('click', function () {
      document.querySelectorAll('.sub-tab').forEach(function (t) { t.classList.remove('active'); });
      document.querySelectorAll('.sub-tab-panel').forEach(function (p) { p.classList.remove('active'); });
      tab.classList.add('active');
      var subtab = tab.dataset.subtab;
      if (subtab === 'paste') {
        var p = document.getElementById('resumePastePanel');
        if (p) p.classList.add('active');
      } else {
        var u = document.getElementById('resumeUploadPanel');
        if (u) u.classList.add('active');
      }
      if (uploadZone) uploadZone.classList.remove('loading', 'error');
      if (uploadZone && uploadZone.querySelector('p')) {
        uploadZone.querySelector('p').innerHTML = 'Drop your PDF here or <span class="upload-link">browse</span>';
      }
    });
  });

  uploadZone.addEventListener('click', function () { pdfInput.click(); });
  uploadZone.addEventListener('dragover', function (e) { e.preventDefault(); uploadZone.classList.add('dragover'); });
  uploadZone.addEventListener('dragleave', function () { uploadZone.classList.remove('dragover'); });
  uploadZone.addEventListener('drop', function (e) {
    e.preventDefault();
    uploadZone.classList.remove('dragover');
    var file = e.dataTransfer.files[0];
    if (file && file.type === 'application/pdf') {
      handlePdf(file);
    } else {
      uploadZone.classList.add('error');
      uploadZone.querySelector('p').textContent = 'PDF only. Drop a PDF file or paste text instead.';
    }
  });

  pdfInput.addEventListener('change', function () {
    var file = pdfInput.files[0];
    if (file) handlePdf(file);
    pdfInput.value = '';
  });

  function handlePdf(file) {
    uploadZone.classList.remove('error');
    uploadZone.classList.add('loading');
    uploadZone.querySelector('p').textContent = 'Reading PDF...';

    var reader = new FileReader();
    reader.onload = function () {
      if (typeof pdfjsLib === 'undefined') {
        uploadZone.classList.remove('loading');
        uploadZone.classList.add('error');
        uploadZone.querySelector('p').textContent = 'PDF library didn’t load. Try pasting your resume instead.';
        return;
      }
      pdfjsLib.getDocument(reader.result).promise.then(function (pdf) {
        var numPages = pdf.numPages;
        var texts = [];
        function getPage(n) {
          return pdf.getPage(n).then(function (page) {
            return page.getTextContent().then(function (content) {
              return content.items.map(function (item) { return item.str; }).join(' ');
            });
          });
        }
        var chain = Promise.resolve();
        for (var i = 1; i <= Math.min(numPages, 3); i++) {
          (function (pageNum) {
            chain = chain.then(function () { return getPage(pageNum).then(function (t) { texts.push(t); }); });
          })(i);
        }
        chain.then(function () {
          var full = texts.join('\n\n').trim();
          uploadZone.classList.remove('loading');
          if (full.length < 30) {
            uploadZone.classList.add('error');
            uploadZone.querySelector('p').textContent = 'Couldn’t read text from PDF. Try pasting instead.';
          } else {
            document.querySelector('.sub-tab[data-subtab="paste"]').click();
            resumeInput.value = full;
            uploadZone.querySelector('p').innerHTML = 'Drop your PDF here or <span class="upload-link">browse</span>';
            runCheck();
          }
        }).catch(function () {
          uploadZone.classList.remove('loading');
          uploadZone.classList.add('error');
          uploadZone.querySelector('p').textContent = 'Something went wrong. Try pasting instead.';
        });
      }).catch(function () {
        uploadZone.classList.remove('loading');
        uploadZone.classList.add('error');
        uploadZone.querySelector('p').textContent = 'Couldn’t read that PDF. Try pasting instead.';
      });
    };
    reader.readAsArrayBuffer(file);
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    runCheck();
  });

  document.getElementById('clearBtn').addEventListener('click', function () {
    resumeInput.value = '';
    jdInput.value = '';
    hideAll();
    document.querySelector('.tab[data-tab="resume"]').click();
    document.querySelector('.sub-tab[data-subtab="paste"]').click();
    if (resumeInput) resumeInput.focus();
  });

  track('analyzer_viewed');
})();
