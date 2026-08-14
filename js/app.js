(function () {
  'use strict';

  var A = window.AppData;
  var WEATHER = A.WEATHER, LOCATIONS = A.LOCATIONS, WEATHER_LABEL = A.WEATHER_LABEL;
  var DEFAULT_AVATAR = A.DEFAULT_AVATAR;
  var getWeather = A.getWeather, getUser = A.getUser, saveUser = A.saveUser;
  var isLoggedIn = A.isLoggedIn, login = A.login, logout = A.logout;
  var setWelcome = A.setWelcome, isWelcome = A.isWelcome;
  var getRecords = A.getRecords, addRecord = A.addRecord;
  var todayRecord = A.todayRecord, last7Days = A.last7Days, dayKey = A.dayKey, weekdayCn = A.weekdayCn;

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };
  var pad = function (n) { return String(n).padStart(2, '0'); };
  var fmtDate = function (ts) {
    var d = new Date(ts);
    return (d.getMonth() + 1) + '月' + d.getDate() + '日 · ' + weekdayCn(ts) + ' · ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
  };
  var fmtToday = function () {
    var d = new Date();
    return d.getFullYear() + '年' + (d.getMonth() + 1) + '月' + d.getDate() + '日 · ' + weekdayCn(d.getTime());
  };
  var fmtShortDate = function () {
    var d = new Date();
    return (d.getMonth() + 1) + '月' + d.getDate() + '日 · ' + weekdayCn(d.getTime());
  };

  var currentRoute = null;
  var midnightTimer = null;

  /* 跨过午夜时自动刷新当前页，让日期和“今日天气”跟着现实日期走 */
  function scheduleMidnightRefresh() {
    clearTimeout(midnightTimer);
    var now = new Date();
    var next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 1);
    midnightTimer = setTimeout(function () { render(true); }, Math.max(0, next.getTime() - now.getTime()));
  }

  function navigate(h) { window.location.hash = h; }

  function toast(msg) {
    var t = $('#toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(t._t);
    t._t = setTimeout(function () { t.classList.remove('show'); }, 2400);
  }

  function modal(opt) {
    return new Promise(function (resolve) {
      var m = document.createElement('div');
      m.className = 'modal';
      m.innerHTML =
        '<div class="modal-card" role="dialog" aria-modal="true">' +
        '<h3 class="modal-title">' + esc(opt.title) + '</h3>' +
        '<p class="modal-msg">' + esc(opt.msg) + '</p>' +
        '<div class="modal-actions">' +
        (opt.cancel ? '<button class="btn-ghost" data-a="cancel">' + esc(opt.cancel) + '</button>' : '') +
        '<button class="btn" data-a="ok">' + esc(opt.ok || '确定') + '</button>' +
        '</div></div>';
      var close = function (v) { m.remove(); resolve(v); };
      m.addEventListener('click', function (e) {
        var a = e.target.closest('[data-a]');
        if (a) close(a.getAttribute('data-a') === 'ok');
      });
      document.body.appendChild(m);
    });
  }

  function navHTML(active) {
    var u = getUser() || {};
    return '<nav class="navbar">' +
      '<a class="nav-logo" href="#/home">情绪气象台</a>' +
      '<div class="nav-links">' +
      '<a href="#/home" class="nav-link' + (active === 'home' ? ' active' : '') + '">气象台</a>' +
      '<a href="#/view" class="nav-link' + (active === 'view' ? ' active' : '') + '">查看情绪</a>' +
      '</div>' +
      '<a class="nav-cta btn btn-sm" href="#/record">记录情绪</a>' +
      '<button class="nav-avatar" data-nav-avatar aria-label="个人页"><img src="' + esc(u.avatar || DEFAULT_AVATAR) + '" alt="头像"></button>' +
      '</nav>';
  }

  /* ================= 登录页 ================= */
  function renderLogin(app) {
    app.innerHTML =
      '<div class="view view-login">' +
      '<div class="login-inner">' +
      '<div class="login-left">' +
      '<div class="login-brand stagger">' +
      '<div class="brand-logo">情绪气象台</div>' +
      '<p class="brand-tag">会呼吸的日记</p>' +
      '<p class="brand-line">记录不是为了改变，而是为了看见。</p>' +
      '<p class="brand-question">今天你的心情，是什么天气？</p>' +
      '</div>' +
      '<div class="login-cta" id="loginCta"><button class="btn btn-lg" id="btnOpenForm">进入情绪气象台</button></div>' +
      '<form class="login-form hidden" id="loginForm" novalidate>' +
      '<button type="button" class="login-back" id="btnBack">← 返回</button>' +
      '<div class="field-group"><label for="fName">用户名</label><input class="field" id="fName" maxlength="20" placeholder="请输入用户名" autocomplete="username"></div>' +
      '<p class="form-error hidden" id="loginError">用户名不能为空（最多 20 个字符）</p>' +
      '<button class="btn btn-lg" type="submit">进入情绪气象台</button>' +
      '</form>' +
      '</div>' +
      '<div class="login-photo"><img src="assets/brand/telescope.png" alt="望远镜"></div>' +
      '</div></div>';

    var form = $('#loginForm', app), cta = $('#loginCta', app), err = $('#loginError', app);
    $('#btnOpenForm', app).addEventListener('click', function () {
      cta.classList.add('hidden');
      form.classList.remove('hidden');
      $('#fName', app).focus();
    });
    $('#btnBack', app).addEventListener('click', function () {
      form.classList.add('hidden');
      cta.classList.remove('hidden');
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = $('#fName', app).value.trim();
      if (!name) { err.classList.remove('hidden'); return; }
      err.classList.add('hidden');
      login(name);
      setWelcome(true);
      navigate('#/profile');
    });
  }

  /* ================= 首页（气象台） ================= */
  function renderHome(app) {
    var u = getUser() || {};
    var today = todayRecord();
    var recs = getRecords();
    var days = last7Days();
    var byDay = {};
    recs.forEach(function (r) { byDay[dayKey(r.ts)] = r; });

    var hero = '';
    if (today) {
      var w = getWeather(today.weatherKey);
      hero =
        '<div class="home-hero stagger">' +
        '<div class="hero-card">' +
        '<p class="hero-kicker">今日天气 · 由你定义</p>' +
        '<h1 class="hero-date">' + fmtShortDate() + '</h1>' +
        '<div class="hero-weather">' +
        '<div class="hero-name"><span class="hero-icon">' + w.icon + '</span>' + w.name + '</div>' +
        '<p class="hero-sentence">' + w.sentence + '</p>' +
        '<p class="hero-note">" ' + esc(today.text) + ' " · 📍 ' + esc(today.location) + '</p>' +
        '</div>' +
        '</div>' +
        '<div class="hero-photo"><img src="' + w.image + '" alt="' + w.name + '"></div>' +
        '</div>';
    } else {
      hero =
        '<div class="home-hero stagger"><div class="hero-card">' +
        '<p class="hero-kicker">今日天气 · 由你定义</p>' +
        '<h1 class="hero-date">' + fmtShortDate() + '</h1>' +
        (recs.length ? '' : '<div class="hero-weather"><p class="hero-sentence">还没有胶囊。要丢下第一颗吗？</p></div>') +
        '</div></div>';
    }

    app.innerHTML =
      navHTML('home') +
      '<div class="view view-home">' +
      '<header class="home-head stagger"><div class="home-greet"><h2>你好，<span class="greet-name">' + esc(u.name) + '</span></h2><p class="home-date">' + fmtToday() + '</p></div></header>' +
      '<section>' + hero + '</section>' +
      '<section class="home-week stagger"><h3>过去7天 · 天气轨迹</h3><div class="week-strip">' +
      days.map(function (d) {
        var r = byDay[d.key], w = r ? getWeather(r.weatherKey) : null;
        return '<button class="week-item" data-day="' + d.key + '" title="' +
          (r ? w.name + ' · ' + esc(r.text) : '晴（未记录）') + '">' +
          '<span class="week-label">' + d.label + '</span>' +
          '<span class="week-icon' + (r ? '' : ' empty') + '">' + (r ? w.icon : '＋') + '</span>' +
          '<span class="week-word">' + (r ? w.word : '未记录') + '</span>' +
          '</button>';
      }).join('') +
      '</div></section>' +
      '</div>';

    $$('.week-item', app).forEach(function (el) {
      el.addEventListener('click', function () {
        var r = byDay[el.getAttribute('data-day')];
        if (r) { navigate('#/view'); return; }
        modal({
          title: '补一颗胶囊？',
          msg: '这天还没留下印记，要补一颗胶囊吗？',
          ok: '去记录',
          cancel: '再想想'
        }).then(function (ok) { if (ok) navigate('#/record?day=' + encodeURIComponent(el.getAttribute('data-day'))); });
      });
    });
  }

  /* ================= 记录页 ================= */
  function renderRecord(app, targetDay) {
    var days = last7Days();
    var backfill = null;
    for (var i = 0; i < days.length - 1; i++) {
      if (days[i].key === targetDay) { backfill = days[i]; break; }
    }
    var isBackfill = !!backfill;
    var step = 1, weatherKey = null, sentence = '', location = null;

    app.innerHTML =
      navHTML('') +
      '<div class="view view-record">' +
      '<header class="page-head">' +
      '<h1>丢一颗胶囊</h1>' +
      '<p class="step-label" id="stepLabel">第 1/3 步 · 选天气</p>' +
      '<div class="step-dots"><span class="on"></span><span></span><span></span></div>' +
      (isBackfill ? '<p class="backfill-tip">✨ 正在补充 ' + backfill.label + '（' + backfill.weekday + '）的情绪，会记到那一天</p>' : '') +
      '</header>' +
      '<section class="step" id="step1">' +
      '<p class="step-tip">' + (isBackfill ? '回想那一天，选一个最像当时你的天气。不必准确，只要感觉。' : '选一个最像此刻你的天气。不必准确，只要感觉。') + '</p>' +
      '<div class="weather-grid">' +
      WEATHER.map(function (w) {
        return '<button class="weather-option" data-key="' + w.key + '">' +
          '<img src="' + w.image + '" alt="' + w.name + '" loading="lazy">' +
          '<span class="wo-body"><span class="wo-title">' + w.icon + ' ' + w.name + '</span>' +
          '<span class="wo-pick">' + w.pick + '</span></span>' +
          '</button>';
      }).join('') +
      '</div>' +
      '</section>' +
      '<section class="step hidden" id="step2">' +
      '<textarea class="field" id="sentence" maxlength="30" rows="4" placeholder="' + (isBackfill ? '那天，你想对自己说什么？' : '此刻，你想对自己说什么？') + '"></textarea>' +
      '<p class="char-count" id="charCount">0/30 · 越短越有力</p>' +
      '<p class="step-error hidden" id="sentenceErr">哪怕只写一个字，也是你的声音。</p>' +
      '<div class="step-nav"><button class="btn btn-ghost" id="b1">上一步</button><button class="btn" id="to3" disabled>下一步</button></div>' +
      '</section>' +
      '<section class="step hidden" id="step3">' +
      '<div class="location-chips" id="chips">' +
      LOCATIONS.map(function (l) { return '<button class="chip" data-loc="' + l + '">' + l + '</button>'; }).join('') +
      '<button class="chip" data-loc="custom">其他</button>' +
      '</div>' +
      '<div class="custom-loc hidden" id="customBox"><input class="field" id="customLoc" maxlength="10" placeholder="这里没有你的坐标？自定义一个吧。"></div>' +
      '<p class="loc-feedback" id="locFb"></p>' +
      '<div class="step-nav"><button class="btn btn-ghost" id="b2">上一步</button><button class="btn" id="saveRec" disabled>🌊 丢进情绪海洋</button></div>' +
      '</section>' +
      '</div>';

    var label = $('#stepLabel', app), dots = $$('.step-dots span', app);
    var s1 = $('#step1', app), s2 = $('#step2', app), s3 = $('#step3', app);
    var fb = $('#locFb', app), saveBtn = $('#saveRec', app);

    function goto(n) {
      step = n;
      s1.classList.toggle('hidden', n !== 1);
      s2.classList.toggle('hidden', n !== 2);
      s3.classList.toggle('hidden', n !== 3);
      label.textContent = n === 1 ? '第 1/3 步 · 选天气' : n === 2 ? '第 2/3 步 · 写心事' : '第 3/3 步 · 你在哪';
      dots.forEach(function (d, i) { d.classList.toggle('on', i === n - 1); });
    }

    $$('.weather-option', app).forEach(function (el) {
      el.addEventListener('click', function () {
        $$('.weather-option', app).forEach(function (x) { x.classList.remove('selected'); });
        el.classList.add('selected');
        weatherKey = el.getAttribute('data-key');
        setTimeout(function () { goto(2); }, 260);
      });
    });
    $('#b1', app).addEventListener('click', function () { goto(1); });

    var textEl = $('#sentence', app), count = $('#charCount', app), err = $('#sentenceErr', app);
    textEl.addEventListener('input', function () {
      sentence = textEl.value.slice(0, 30);
      textEl.value = sentence;
      var len = sentence.length;
      count.textContent = len + '/30 · 越短越有力';
      count.classList.toggle('warn', len >= 28);
      count.classList.remove('error');
      err.classList.add('hidden');
      $('#to3', app).disabled = len === 0;
    });
    $('#to3', app).addEventListener('click', function () {
      sentence = textEl.value.trim();
      if (!sentence) {
        count.classList.add('error');
        err.classList.remove('hidden');
        return;
      }
      goto(3);
    });
    $('#b2', app).addEventListener('click', function () { goto(2); });

    var customBox = $('#customBox', app), customInput = $('#customLoc', app);
    $('#chips', app).addEventListener('click', function (e) {
      var chip = e.target.closest('.chip');
      if (!chip) return;
      $$('.chip', app).forEach(function (x) { x.classList.remove('selected'); });
      chip.classList.add('selected');
      var v = chip.getAttribute('data-loc');
      if (v === 'custom') {
        location = null;
        customBox.classList.remove('hidden');
        customInput.value = '';
        customInput.focus();
      } else {
        location = v;
        customBox.classList.add('hidden');
      }
      updateFb();
    });
    customInput.addEventListener('input', function () {
      location = customInput.value.trim() || null;
      updateFb();
    });

    function updateFb() {
      if (location) {
        fb.textContent = '📍 在' + location + '，心情' + getWeather(weatherKey).name + '。';
        saveBtn.disabled = false;
      } else {
        fb.textContent = weatherKey ? '' : '';
        saveBtn.disabled = true;
      }
    }

    saveBtn.addEventListener('click', function () {
      if (!location || !weatherKey) return;
      var finalLoc = location;
      if (finalLoc === '其他') finalLoc = customInput.value.trim() || '其他';
      var ts = null;
      if (isBackfill) {
        var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(backfill.key);
        if (m) ts = new Date(+m[1], +m[2] - 1, +m[3], 12, 0, 0).getTime();
      }
      addRecord({ weatherKey: weatherKey, text: sentence, location: finalLoc, ts: ts });
      app.innerHTML =
        '<div class="view view-saved">' +
        '<div class="saved-icon">🌊</div>' +
        '<h2>' + (isBackfill ? '胶囊已丢出 · 它会漂回 ' + backfill.label + '。' : '胶囊已丢出 · 它会漂到该去的地方。') + '</h2>' +
        '</div>';
      setTimeout(function () { navigate('#/home'); }, 1500);
    });
  }

  /* ================= 查看页（沉浸式左右翻卡） ================= */
  function renderViewPage(app) {
    var records = getRecords().slice().reverse();
    var n = records.length;

    if (!n) {
      app.innerHTML =
        '<div class="view view-view">' +
        '<div class="view-top"><a class="back-link" href="#/home">← 回气象台</a><span class="view-count">📅 共 0 颗胶囊</span></div>' +
        '<div class="view-empty">' +
        '<p class="empty-big">你的天气日记还是空白。</p>' +
        '<button class="btn btn-lg" id="goRecord">去记录第一个情绪吧</button>' +
        '</div></div>';
      $('#goRecord', app).addEventListener('click', function () { navigate('#/record'); });
      return;
    }

    var isCoarse = window.matchMedia('(pointer: coarse)').matches;
    var canFling = !isCoarse && window.innerWidth >= 768;
    var index = 0, dragging = false, transitioning = false, moved = false;
    var startX = 0, offset = 0, lastX = 0, lastT = 0, velo = 0, rafId = 0;

    app.innerHTML =
      '<div class="view view-view" id="viewView">' +
      '<div class="view-top"><a class="back-link" href="#/home">← 回气象台</a><span class="view-count">📅 共 ' + n + ' 颗胶囊</span></div>' +
      '<div class="view-hint" id="viewHint">← 左右滑动，翻看你的情绪天气。</div>' +
      '<div class="carousel">' +
      '<div class="carousel-stage" id="stage"></div>' +
      '<button class="carousel-arrow prev" id="arrowPrev" aria-label="上一张">‹</button>' +
      '<button class="carousel-arrow next" id="arrowNext" aria-label="下一张">›</button>' +
      '<div class="carousel-counter" id="pageCounter">第 1 / 共 ' + n + ' 页</div>' +
      '<div class="carousel-dots" id="dots"></div>' +
      '<p class="carousel-edge" id="edgeTip">你已经翻完了所有天气。要丢一颗新的吗？</p>' +
      '<p class="carousel-tip" id="switchTip"></p>' +
      '</div></div>';

    var stage = $('#stage', app);
    var viewView = $('#viewView', app);
    var dotsBox = $('#dots', app);
    var counter = $('#pageCounter', app);
    var edgeTip = $('#edgeTip', app);
    var hint = $('#viewHint', app);
    var switchTip = $('#switchTip', app);
    var tipTimer = null;

    function cardHTML(r, i) {
      var w = getWeather(r.weatherKey);
      return '<div class="wcard-img"><img src="' + w.image + '" alt="' + w.name + '" draggable="false"></div>' +
        '<div class="wcard-meta">' +
        '<div class="wcard-date">' + fmtDate(r.ts) + '</div>' +
        '<div class="wcard-tags">' +
        '<span class="wcard-weather">' + w.icon + ' ' + (WEATHER_LABEL[w.key] || '') + '（' + w.name + '）</span>' +
        '<span class="wcard-loc">📍 ' + esc(r.location) + '</span>' +
        '</div>' +
        '<p class="wcard-text">' + esc(r.text) + '</p>' +
        '</div>';
    }

    function cardW() {
      var c = stage.querySelector('.wcard');
      return c ? c.offsetWidth : stage.clientWidth;
    }

    function setBg(key, delay) {
      var w = getWeather(key);
      setTimeout(function () {
        viewView.style.background = 'linear-gradient(135deg, ' + w.grad[0] + ' 0%, ' + w.grad[1] + ' 100%)';
      }, delay || 0);
    }

    function paint() {
      dotsBox.innerHTML = records.map(function (_, i) {
        return '<button class="dot' + (i === index ? ' on' : '') + '" data-i="' + i + '" aria-label="第' + (i + 1) + '张"></button>';
      }).join('');
      stage.innerHTML = '';
      for (var i = index - 1; i <= index + 1; i++) {
        if (i < 0 || i >= n) continue;
        var el = document.createElement('article');
        el.className = 'wcard';
        el.setAttribute('data-i', String(i));
        el.innerHTML = cardHTML(records[i], i);
        stage.appendChild(el);
      }
      var off = cardW();
      var cur = stage.querySelector('[data-i="' + index + '"]');
      var prev = stage.querySelector('[data-i="' + (index - 1) + '"]');
      var next = stage.querySelector('[data-i="' + (index + 1) + '"]');
      var stackOp = isCoarse ? 0.35 : 0.45;
      if (cur) { cur.style.transform = 'translateX(0) rotate(0deg) scale(1)'; cur.style.opacity = '1'; cur.style.zIndex = '3'; }
      if (prev) { prev.style.transform = 'translateX(' + (-off * 0.55) + 'px) scale(0.85)'; prev.style.opacity = String(stackOp); prev.style.zIndex = '2'; }
      if (next) { next.style.transform = 'translateX(' + (off * 0.55) + 'px) scale(0.85)'; next.style.opacity = String(stackOp); next.style.zIndex = '2'; }
      counter.textContent = '第 ' + (index + 1) + ' / 共 ' + n + ' 页';
      edgeTip.classList.toggle('show', index === 0 || index === n - 1);
      setBg(records[index].weatherKey, 0);
    }

    function applyDrag() {
      if (!dragging || transitioning) return;
      var off = cardW();
      var o = offset;
      if (index === 0 && o > 0) o *= 0.35;
      if (index === n - 1 && o < 0) o *= 0.35;
      var cur = stage.querySelector('[data-i="' + index + '"]');
      var prev = stage.querySelector('[data-i="' + (index - 1) + '"]');
      var next = stage.querySelector('[data-i="' + (index + 1) + '"]');
      var k = o / off;
      if (cur) {
        cur.style.transform = 'translateX(' + o + 'px) rotate(' + (o * 0.08) + 'deg) scale(' + (0.95 + o / 10000) + ')';
        cur.style.opacity = '1';
        cur.style.zIndex = '3';
      }
      if (prev) {
        var ps = Math.min(1, 0.85 + Math.max(0, k) * 0.15);
        var pa = Math.min(1, 0.45 + Math.max(0, k) * 0.55);
        prev.style.transform = 'translateX(' + (-off * 0.55 + Math.max(0, o) * 0.55) + 'px) scale(' + ps + ')';
        prev.style.opacity = String(pa);
        prev.style.zIndex = '2';
      }
      if (next) {
        var ns = Math.min(1, 0.85 + Math.max(0, -k) * 0.15);
        var na = Math.min(1, 0.45 + Math.max(0, -k) * 0.55);
        next.style.transform = 'translateX(' + (off * 0.55 + Math.min(0, o) * 0.55) + 'px) scale(' + ns + ')';
        next.style.opacity = String(na);
        next.style.zIndex = '2';
      }
    }

    function scheduleDrag() {
      if (rafId) return;
      rafId = requestAnimationFrame(function () { rafId = 0; applyDrag(); });
    }

    function onDown(x) {
      if (transitioning) return;
      dragging = true;
      moved = false;
      startX = x; lastX = x; lastT = performance.now(); velo = 0; offset = 0;
      hint.classList.add('fade');
      $$('.wcard', stage).forEach(function (c) { c.style.transition = 'none'; });
    }

    function onMove(x) {
      if (!dragging) return;
      var now = performance.now();
      var dt = now - lastT;
      if (dt > 0) velo = (x - lastX) / dt;
      lastX = x; lastT = now;
      offset = x - startX;
      if (Math.abs(offset) > 4) moved = true;
      scheduleDrag();
    }

    function onUp() {
      if (!dragging) return;
      dragging = false;
      if (rafId) { cancelAnimationFrame(rafId); rafId = 0; }
      if (!moved) { bounce(); return; }
      var off = cardW();
      var target = index;
      var absV = Math.abs(velo);
      if (offset < -off * 0.3 || (canFling && offset < 0 && absV > 0.45)) {
        if (index >= n - 1) { bounce(); return; }
        var pages = 1;
        if (canFling && absV > 0.45) pages = Math.max(1, Math.min(n - 1 - index, Math.round(absV / 1.1)));
        target = index + pages;
      } else if (offset > off * 0.3 || (canFling && offset > 0 && absV > 0.45)) {
        if (index <= 0) { bounce(); return; }
        var pages2 = 1;
        if (canFling && absV > 0.45) pages2 = Math.max(1, Math.min(index, Math.round(absV / 1.1)));
        target = index - pages2;
      }
      if (target === index) { bounce(); return; }
      settle(target);
    }

    function bounce() {
      transitioning = true;
      var off = cardW();
      var cur = stage.querySelector('[data-i="' + index + '"]');
      var prev = stage.querySelector('[data-i="' + (index - 1) + '"]');
      var next = stage.querySelector('[data-i="' + (index + 1) + '"]');
      var stackOp = isCoarse ? 0.35 : 0.45;
      [cur, prev, next].forEach(function (c) {
        if (c) c.style.transition = 'transform 350ms var(--ease-card), opacity 350ms var(--ease-card)';
      });
      if (cur) { cur.style.transform = 'translateX(0) rotate(0deg) scale(1)'; cur.style.opacity = '1'; }
      if (prev) { prev.style.transform = 'translateX(' + (-off * 0.55) + 'px) scale(0.85)'; prev.style.opacity = String(stackOp); }
      if (next) { next.style.transform = 'translateX(' + (off * 0.55) + 'px) scale(0.85)'; next.style.opacity = String(stackOp); }
      setTimeout(function () {
        transitioning = false;
        $$('.wcard', stage).forEach(function (c) { c.style.transition = ''; });
      }, 360);
    }

    function showSwitchTip(dir, key) {
      switchTip.textContent = dir > 0 ? '→ 明日 · ' + getWeather(key).name : '← 昨日 · ' + getWeather(key).name;
      switchTip.classList.add('show');
      clearTimeout(tipTimer);
      tipTimer = setTimeout(function () { switchTip.classList.remove('show'); }, 1600);
    }

    function settle(target) {
      transitioning = true;
      var off = cardW();
      var from = index;
      var dir = target > from ? 1 : -1;
      var pages = Math.abs(target - from);
      var cur = stage.querySelector('[data-i="' + from + '"]');
      var tEl = stage.querySelector('[data-i="' + target + '"]');
      if (!tEl) {
        tEl = document.createElement('article');
        tEl.className = 'wcard';
        tEl.setAttribute('data-i', String(target));
        tEl.innerHTML = cardHTML(records[target], target);
        stage.appendChild(tEl);
      }
      /* 先把目标卡放到“入场”起始位置（无过渡），再强制回流后开启过渡 */
      tEl.style.transition = 'none';
      tEl.style.transform = 'translateX(' + (dir * off * pages) + 'px) scale(0.92)';
      tEl.style.opacity = '0';
      tEl.style.zIndex = '4';
      void tEl.offsetWidth;
      [cur, tEl].forEach(function (c) {
        if (c) c.style.transition = 'transform 350ms var(--ease-card), opacity 350ms var(--ease-card)';
      });
      if (cur) {
        cur.style.transform = 'translateX(' + (-dir * off * pages) + 'px) rotate(0deg) scale(0.95)';
        cur.style.opacity = '0';
        cur.style.zIndex = '2';
      }
      tEl.style.transform = 'translateX(0) scale(1)';
      tEl.style.opacity = '1';
      setBg(records[target].weatherKey, 150);
      showSwitchTip(dir, records[target].weatherKey);
      index = target;
      setTimeout(function () {
        transitioning = false;
        $$('.wcard', stage).forEach(function (c) { c.style.transition = ''; });
        paint();
      }, 360);
    }

    function flashEdge() {
      edgeTip.classList.remove('show');
      void edgeTip.offsetWidth;
      edgeTip.classList.add('show');
    }

    stage.addEventListener('mousedown', function (e) {
      if (e.button !== 0) return;
      e.preventDefault();
      onDown(e.clientX);
    });
    window.addEventListener('mousemove', function (e) { if (dragging) onMove(e.clientX); });
    window.addEventListener('mouseup', function () { if (dragging) onUp(); });
    stage.addEventListener('touchstart', function (e) { onDown(e.touches[0].clientX); }, { passive: true });
    stage.addEventListener('touchmove', function (e) { if (dragging) onMove(e.touches[0].clientX); }, { passive: true });
    stage.addEventListener('touchend', function () { if (dragging) onUp(); }, { passive: true });

    dotsBox.addEventListener('click', function (e) {
      var d = e.target.closest('.dot');
      if (!d || transitioning) return;
      var t = Number(d.getAttribute('data-i'));
      if (t !== index) settle(t);
    });

    var ctl = {
      go: function (dir) {
        if (transitioning) return;
        var t = index + dir;
        if (t < 0 || t >= n) { flashEdge(); return; }
        settle(t);
      }
    };
    $('#arrowPrev', app).addEventListener('click', function () { ctl.go(-1); });
    $('#arrowNext', app).addEventListener('click', function () { ctl.go(1); });
    window._viewCtl = ctl;

    paint();
  }

  /* ================= 个人页 ================= */
  function renderProfile(app) {
    var u = getUser() || {};
    var welcome = isWelcome();
    var today = todayRecord();
    var moodLine = today
      ? '今日心情：' + getWeather(today.weatherKey).icon + ' ' + WEATHER_LABEL[today.weatherKey] + '（' + getWeather(today.weatherKey).name + '）'
      : '今天还没有记录';

    app.innerHTML =
      '<div class="view view-profile">' +
      '<a class="profile-back" href="#/home">← 回气象台</a>' +
      '<div class="profile-card card stagger">' +
      '<div class="avatar-wrap"><img id="avatarImg" src="' + esc(u.avatar || DEFAULT_AVATAR) + '" alt="头像"></div>' +
      '<h1 class="profile-name" id="profileName">' + esc(u.name) + '</h1>' +
      '<p class="profile-mood">' + moodLine + '</p>' +
      (welcome
        ? '<p class="profile-welcome">欢迎回来。今天你的心情，是什么天气？</p>' +
          '<div class="profile-actions"><button class="btn btn-lg" id="enterHome">进入气象台</button></div>'
        : '<div class="profile-actions">' +
          '<button class="btn btn-ghost" id="btnAvatar">更换头像</button>' +
          '<button class="btn btn-ghost" id="btnName">修改用户名</button>' +
          '<button class="btn btn-ghost btn-subtle" id="btnLogout">退出登录</button>' +
          '</div>') +
      '<input type="file" id="avatarFile" accept="image/*" hidden>' +
      '<div class="name-edit hidden" id="nameEdit">' +
      '<input class="field" id="nameInput" maxlength="20" placeholder="新用户名">' +
      '<button class="btn btn-sm" id="nameSave">保存</button>' +
      '<button class="btn-ghost btn-sm" id="nameCancel">取消</button>' +
      '</div>' +
      '</div></div>';

    var avatarImg = $('#avatarImg', app);
    var nameEl = $('#profileName', app);

    if (welcome) {
      $('#enterHome', app).addEventListener('click', function () {
        setWelcome(false);
        navigate('#/home');
      });
      return;
    }

    $('#btnAvatar', app).addEventListener('click', function () { $('#avatarFile', app).click(); });
    $('#avatarFile', app).addEventListener('change', function (e) {
      var f = e.target.files[0];
      if (!f) return;
      var reader = new FileReader();
      reader.onload = function () {
        var img = new Image();
        img.onload = function () {
          var max = 256;
          var k = Math.min(1, max / Math.max(img.width, img.height));
          var w = Math.max(1, Math.round(img.width * k));
          var h = Math.max(1, Math.round(img.height * k));
          var cv = document.createElement('canvas');
          cv.width = w; cv.height = h;
          cv.getContext('2d').drawImage(img, 0, 0, w, h);
          var data = cv.toDataURL('image/jpeg', 0.85);
          saveUser({ avatar: data });
          avatarImg.src = data;
          toast('头像已更新');
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(f);
      e.target.value = '';
    });

    var nameEdit = $('#nameEdit', app);
    $('#btnName', app).addEventListener('click', function () {
      nameEdit.classList.remove('hidden');
      $('#nameInput', app).value = u.name;
      $('#nameInput', app).focus();
    });
    $('#nameCancel', app).addEventListener('click', function () { nameEdit.classList.add('hidden'); });
    $('#nameSave', app).addEventListener('click', function () {
      var v = $('#nameInput', app).value.trim();
      if (!v) { toast('用户名不能为空'); return; }
      saveUser({ name: v.slice(0, 20) });
      nameEl.textContent = v.slice(0, 20);
      nameEdit.classList.add('hidden');
      toast('用户名已更新');
    });

    $('#btnLogout', app).addEventListener('click', function () {
      modal({
        title: '退出登录？',
        msg: '退出后本地记录仍会保留，下次登录随时回来。',
        ok: '退出',
        cancel: '取消'
      }).then(function (ok) {
        if (ok) { logout(); navigate('#/login'); }
      });
    });
  }

  /* ================= 路由 ================= */
  function render(force) {
    clearTimeout(midnightTimer);
    var hash = window.location.hash || '';
    var raw = hash.replace(/^#\/?/, '');
    var qIdx = raw.indexOf('?');
    var route = qIdx === -1 ? raw : raw.slice(0, qIdx);
    var params = {};
    if (qIdx !== -1) {
      raw.slice(qIdx + 1).split('&').forEach(function (kv) {
        if (!kv) return;
        var eq = kv.indexOf('=');
        if (eq === -1) return;
        try {
          params[decodeURIComponent(kv.slice(0, eq))] = decodeURIComponent(kv.slice(eq + 1));
        } catch (e) { /* 忽略无效参数 */ }
      });
    }
    var logged = isLoggedIn();

    if (!logged && route !== 'login') { window.location.hash = '#/login'; return; }
    if (logged && (route === '' || route === 'login')) { window.location.hash = '#/home'; return; }
    if (['home', 'record', 'view', 'profile', 'login'].indexOf(route) === -1) {
      window.location.hash = logged ? '#/home' : '#/login';
      return;
    }
    if (!force && hash === currentRoute) return;
    currentRoute = hash;

    var app = $('#app');
    app.innerHTML = '';
    app.classList.remove('view-enter');
    void app.offsetWidth;
    app.classList.add('view-enter');

    if (route === 'login') renderLogin(app);
    else if (route === 'home') { renderHome(app); scheduleMidnightRefresh(); }
    else if (route === 'record') renderRecord(app, params.day || null);
    else if (route === 'view') renderViewPage(app);
    else if (route === 'profile') { renderProfile(app); scheduleMidnightRefresh(); }
    window.scrollTo(0, 0);
  }

  window.addEventListener('hashchange', render);
  document.addEventListener('click', function (e) {
    var avatar = e.target.closest('[data-nav-avatar]');
    if (avatar) { navigate('#/profile'); return; }
    var cta = e.target.closest('a.nav-cta');
    if (cta) {
      e.preventDefault();
      navigate('#/record');
    }
  });
  window.addEventListener('keydown', function (e) {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    var ctl = window._viewCtl;
    if (!ctl || currentRoute !== 'view') return;
    var t = e.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return;
    e.preventDefault();
    ctl.go(e.key === 'ArrowRight' ? 1 : -1);
  });

  render();
})();
