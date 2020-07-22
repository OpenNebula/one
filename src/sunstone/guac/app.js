// Guacamole Client

//// Application Variables ////
var helmet = require('helmet');
var app = require('express')();
var http = require('http').Server(app);
var GuacamoleLite = require('guacamole-lite');

var { clientOptions, clientCallbacks } = require('./options');

/**
 * CONSTANTS 
 * */
GUAC_PORT = process.env.PORT || 29877
GUACD_PORT = process.env.GUACD || 4822

/**
 * Spinup the Guac websocket proxy on port 29877 if guacd is running
 * */
var guacServer = new GuacamoleLite(
  { server: http, path: '/guacamole' },
  { host: '127.0.0.1', port: GUACD_PORT },
  clientOptions,
  clientCallbacks
);

/**
 * Helmet helps you secure your Express apps
 * */
app.use(helmet());

// Spin up application on port 29877
http.listen(GUAC_PORT, function(){
  console.log('listening on *:' + GUAC_PORT);
});
