(function (global) {
  'use strict';

  /* 6 种情绪天气 · 与「天气」文件夹图片一一对应 */
  var WEATHER = [
    { key: 'happy',   name: '开心', icon: '☀️', word: '悦', image: 'assets/weather/happy.jpg',
      grad: ['#F98C53', '#FCCEB4'],
      sentence: '今日放晴，心里有光。',
      pick: '今天有日出，想把快乐存下来。' },
    { key: 'emo',     name: 'emo', icon: '🌫️', word: '雾', image: 'assets/weather/emo.png',
      grad: ['#8E8EA0', '#C9C9DE'],
      sentence: '今日有雾，看不清远方，但看得清自己。',
      pick: '今天有点emo，但说出来会轻一点。' },
    { key: 'anxiety', name: '焦虑', icon: '⚡', word: '躁', image: 'assets/weather/anxiety.jpg',
      grad: ['#142E4F', '#2A5A8C'],
      sentence: '今日雷暴，但雷声过后，雨会停。',
      pick: '今天在焦虑，但焦虑不是我的全部。' },
    { key: 'calm',    name: '平静', icon: '🌌', word: '静', image: 'assets/weather/calm.jpg',
      grad: ['#7BC6C0', '#ABD7FB'],
      sentence: '今日微风，万物静好。',
      pick: '今天很平静，像湖面一样。' },
    { key: 'tired',   name: '疲惫', icon: '🌧️', word: '倦', image: 'assets/weather/tired.jpg',
      grad: ['#8FA3B8', '#C7D3DE'],
      sentence: '今日小雨，适合发呆和呼吸。',
      pick: '今天有点累，想歇一歇。' },
    { key: 'expect',  name: '期待', icon: '🌅', word: '盼', image: 'assets/weather/expect.jpg',
      grad: ['#F6A8C0', '#FCCEB4'],
      sentence: '今日破晓，有什么正在发生。',
      pick: '今天有期待，像黎明前的光。' }
  ];

  var LOCATIONS = ['家', '公司', '教室', '宿舍', '图书馆', '食堂', '操场', '路上'];
  var WEATHER_LABEL = { happy: '晴', emo: '迷雾', anxiety: '雷暴', calm: '微风', tired: '小雨', expect: '破晓' };

  var DEFAULT_AVATAR = 'data:image/svg+xml,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 112 112">' +
    '<rect width="112" height="112" fill="#E5E5EA"/>' +
    '<circle cx="56" cy="46" r="17" fill="#C7C7CC"/>' +
    '<path d="M18 94c7-18 21-26 38-26s31 8 38 26z" fill="#C7C7CC"/>' +
    '</svg>'
  );

  var KEYS = {
    user: 'qx_user',
    records: 'qx_records',
    session: 'qx_session',
    welcome: 'qx_welcome'
  };

  var store = {
    get: function (key, fb) {
      try {
        var v = localStorage.getItem(key);
        return v === null ? fb : JSON.parse(v);
      } catch (e) { return fb; }
    },
    set: function (key, val) {
      try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) { /* 配额等异常忽略 */ }
    },
    del: function (key) {
      try { localStorage.removeItem(key); } catch (e) { /* 忽略 */ }
    }
  };

  function getWeather(key) {
    for (var i = 0; i < WEATHER.length; i++) {
      if (WEATHER[i].key === key) return WEATHER[i];
    }
    return WEATHER[0];
  }

  function getUser() {
    var u = store.get(KEYS.user, null);
    if (!u || !u.name) return null;
    return {
      name: String(u.name).slice(0, 20),
      avatar: u.avatar || DEFAULT_AVATAR
    };
  }

  function saveUser(patch) {
    var cur = getUser() || {};
    store.set(KEYS.user, {
      name: (patch.name !== undefined ? patch.name : cur.name) || '',
      avatar: patch.avatar !== undefined ? patch.avatar : (cur.avatar || DEFAULT_AVATAR)
    });
  }

  function isLoggedIn() { return !!getUser() && !!store.get(KEYS.session, false); }
  function login(name) { saveUser({ name: name }); store.set(KEYS.session, Date.now()); }
  function logout() { store.del(KEYS.session); store.del(KEYS.welcome); }
  function setWelcome(v) { store.set(KEYS.welcome, !!v); }
  function isWelcome() { return !!store.get(KEYS.welcome, false); }

  function getRecords() { return store.get(KEYS.records, []); }

  function addRecord(data) {
    var recs = getRecords();
    var rec = {
      id: Date.now() + '-' + Math.random().toString(36).slice(2, 7),
      ts: data.ts != null ? data.ts : Date.now(),
      weatherKey: data.weatherKey,
      text: String(data.text || '').slice(0, 30),
      location: String(data.location || '').slice(0, 12)
    };
    recs.push(rec);
    store.set(KEYS.records, recs);
    return rec;
  }

  function keyOf(ts) {
    var d = new Date(ts);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  function todayKey() { return keyOf(Date.now()); }

  function todayRecord() {
    var k = todayKey();
    return getRecords().filter(function (r) { return keyOf(r.ts) === k; })
      .sort(function (a, b) { return b.ts - a.ts; })[0] || null;
  }

  function last7Days() {
    var arr = [];
    var now = new Date();
    for (var i = 6; i >= 0; i--) {
      var d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      arr.push({
        key: d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'),
        label: i === 0 ? '今天' : (d.getMonth() + 1) + '/' + d.getDate(),
        weekday: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][d.getDay()]
      });
    }
    return arr;
  }

  function weekdayCn(ts) {
    return ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][new Date(ts).getDay()];
  }

  global.AppData = {
    WEATHER: WEATHER,
    LOCATIONS: LOCATIONS,
    WEATHER_LABEL: WEATHER_LABEL,
    DEFAULT_AVATAR: DEFAULT_AVATAR,
    store: store,
    getWeather: getWeather,
    getUser: getUser,
    saveUser: saveUser,
    isLoggedIn: isLoggedIn,
    login: login,
    logout: logout,
    setWelcome: setWelcome,
    isWelcome: isWelcome,
    getRecords: getRecords,
    addRecord: addRecord,
    todayKey: todayKey,
    dayKey: keyOf,
    todayRecord: todayRecord,
    last7Days: last7Days,
    weekdayCn: weekdayCn
  };
})(window);
