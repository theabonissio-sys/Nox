/* NOX: armazenamento local em IndexedDB. Nada sai do aparelho. */
const DB = (() => {
  'use strict';
  let db;
  const STORES = ['records', 'rewards', 'meta'];

  const open = () => new Promise((resolve, reject) => {
    if (!self.indexedDB) return reject(new Error('IndexedDB indisponível'));
    const req = indexedDB.open('nox', 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore('records', { keyPath: 'date' });
      req.result.createObjectStore('rewards', { keyPath: 'id' });
      req.result.createObjectStore('meta');
    };
    req.onsuccess = () => {
      db = req.result;
      db.onversionchange = () => db.close();
      resolve();
    };
    req.onerror = () => reject(req.error);
  });

  const run = (mode, fn) => new Promise((resolve, reject) => {
    const tx = db.transaction(STORES, mode);
    const result = fn(name => tx.objectStore(name));
    tx.oncomplete = () => resolve(result);
    tx.onerror = tx.onabort = () => reject(tx.error || new Error('Falha ao gravar'));
  });

  const load = async () => {
    const reqs = await run('readonly', s => ({
      records: s('records').getAll(), rewards: s('rewards').getAll(), settings: s('meta').get('settings'), session: s('meta').get('session'),
    }));
    return { records: reqs.records.result, rewards: reqs.rewards.result, settings: reqs.settings.result, session: reqs.session.result || null };
  };

  /* Uma única transação: ou tudo é salvo, ou nada. */
  const commit = ({ put, remove, rewards = [], settings, replace, endSession }) => run('readwrite', s => {
    if (replace) { s('records').clear(); s('rewards').clear(); }
    (put || []).forEach(r => s('records').put(r));
    if (remove) s('records').delete(remove);
    rewards.forEach(r => s('rewards').put(r));
    if (settings) s('meta').put(settings, 'settings');
    if (endSession) s('meta').delete('session');
  });

  /* Lê e grava a sessão de sono na mesma transação (app e notificação não se atropelam). */
  const updateSession = async fn => {
    const out = {};
    await run('readwrite', s => {
      const meta = s('meta'), req = meta.get('session');
      req.onsuccess = () => {
        out.session = fn(req.result || null);
        if (out.session) meta.put(out.session, 'session'); else meta.delete('session');
      };
    });
    return out.session;
  };

  const wipe = () => run('readwrite', s => STORES.forEach(n => s(n).clear()));

  return { open, load, commit, wipe, updateSession };
})();
