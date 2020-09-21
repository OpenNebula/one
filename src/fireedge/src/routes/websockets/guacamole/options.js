const clientOptions = {
  crypt: {
    cypher: 'AES-256-CBC',
    key: 'LSIOGCKYLSIOGCKYLSIOGCKYLSIOGCKY'
  },
  allowedUnencryptedConnectionSettings: {
    rdp: ['width', 'height', 'dpi'],
    vnc: ['width', 'height', 'dpi'],
    ssh: ['color-scheme', 'font-name', 'font-size', 'width', 'height', 'dpi'],
    telnet: ['color-scheme', 'font-name', 'font-size', 'width', 'height', 'dpi']
  },
  log: { verbose: false }
};

const callbacks = {
  processConnectionSettings: (settings, callback) => {
    if (settings.expiration && settings.expiration < Date.now()) {
      return callback(new Error('Token expired'));
    }
    return callback(null, settings);
  }
};

module.exports = {
  clientOptions,
  callbacks
};
