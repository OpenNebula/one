/**
 * CLIENT OPTIONS
 */
var clientOptions = {
  crypt: {
    cypher: 'AES-256-CBC',
    key: 'LSIOGCKYLSIOGCKYLSIOGCKYLSIOGCKY'
  },
  allowedUnencryptedConnectionSettings: {
    rdp: [
      'width',
      'height',
      'dpi'
    ],
    vnc: [
      'width',
      'height',
      'dpi'
    ],
    ssh: [
      'color-scheme',
      'font-name',
      'font-size',
      'width',
      'height',
      'dpi'
    ],
    telnet: [
      'color-scheme',
      'font-name',
      'font-size',
      'width',
      'height',
      'dpi'
    ]
  },
  log: { verbose: false }
};

/**
 * CALLBACKS
 */
var callbacks = {
  processConnectionSettings: function (settings, callback) {
    if (settings.expiration && settings.expiration < Date.now()) {
      return callback(new Error('Token expired'));
    }

    //settings.connection['drive-path'] = '/tmp/guacamole_'
    //settings.connection['enable-drive'] = false
    //settings.connection['create-drive-path'] = false
    
    callback(null, settings);
  }
};

module.exports = {
  clientOptions,
  callbacks
}
