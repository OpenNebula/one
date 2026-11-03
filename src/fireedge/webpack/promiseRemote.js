/**
 * Build a native promise remote that reads its URL from runtime configuration.
 *
 * @param {string} module - Remote configuration key.
 * @param {string} name - Container global name.
 * @returns {string} Webpack promise remote expression.
 */
const promiseRemote = (module, name) =>
  `promise new Promise((resolve, reject) => {
    const name = ${JSON.stringify(name)};
    if (window[name]) return resolve(window[name]);

    const url = window.__REMOTES_MODULE_CONFIG__?.[${JSON.stringify(
      module
    )}]?.entry;
    if (!url) return reject(new Error('Missing remote entry URL: ' + name));

    const script = document.createElement('script');
    const finish = (event) => {
      clearTimeout(timeout);
      script.onload = script.onerror = null;
      script.remove();
      if (event.type === 'load' && window[name]) {
        resolve(window[name]);
      } else {
        reject(new Error('Failed to load remote ' + name + ' (' + event.type + '): ' + url));
      }
    };
    const timeout = setTimeout(() => finish({ type: 'timeout' }), 120000);
    script.src = url;
    script.onload = script.onerror = finish;
    document.head.appendChild(script);
  })`

module.exports = promiseRemote
