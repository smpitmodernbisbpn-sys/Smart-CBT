/* Compatibility bridge: keeps existing google.script.run call sites unchanged. */
(function () {
  const KEY = 'smart_cbt_gas_url';
  const valid = value => /^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec(?:\?.*)?$/.test((value || '').trim());
  window.CBTDatabase = {
    getURL: () => localStorage.getItem(KEY) || '',
    setURL: value => {
      value = (value || '').trim();
      if (value && !valid(value)) throw new Error('Gunakan URL Web App Google Apps Script yang berakhiran /exec.');
      if (value) localStorage.setItem(KEY, value); else localStorage.removeItem(KEY);
    },
    test: async () => {
      const data = await call('getInitialData', []);
      return data && Array.isArray(data.questions);
    }
  };
  async function call(method, args) {
    const url = window.CBTDatabase.getURL();
    if (!url) throw new Error('URL Google Apps Script belum diatur di Pengaturan.');
    const res = await fetch('/api/gas', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({url,method,args})});
    const body = await res.json();
    if (!res.ok || !body.ok) throw new Error(body.error || 'Koneksi database gagal');
    return body.data;
  }
  function runner(success, failure) {
    return new Proxy({}, {get(_target, name) {
      if (name === 'withSuccessHandler') return fn => runner(fn, failure);
      if (name === 'withFailureHandler') return fn => runner(success, fn);
      if (name === 'then') return undefined;
      return (...args) => {call(String(name), args).then(data => success && success(data)).catch(err => {if (failure) failure(err); else console.error('Google Apps Script:', err);});};
    }});
  }
  if (!window.google?.script?.run) {
    window.google = window.google || {};
    window.google.script = window.google.script || {};
    window.google.script.run = runner(null, null);
  }
})();
