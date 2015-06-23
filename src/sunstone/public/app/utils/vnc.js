define(function(require) {
  INCLUDE_URI = "bower_components/no-vnc/include/";
  require('vnc-util');
  require('vnc-webutil');
  require('vnc-base64');
  require('vnc-websock');
  require('vnc-des');
  require('vnc-keysymdef');
  require('vnc-keyboard');
  require('vnc-input');
  require('vnc-display');
  require('vnc-jsunzip');
  require('vnc-rfb');
  require('vnc-keysym');
  
  var Config = require('sunstone-config');

  var _lock = false;
  var _rfb;

  return {
    'lockStatus': lockStatus,
    'lock': lock,
    'unlock': unlock,
    'vncCallback': vncCallback,
    'disconnect': disconnect,
    'sendCtrlAltDel': sendCtrlAltDel
  }

  function lockStatus() {
    return _lock;
  }

  function lock() {
    _lock = true;
  }

  function unlock() {
    _lock = false;
  }

  function vncCallback(response) {
    _rfb = new RFB({'target':       $D('VNC_canvas'),
                   'encrypt':      Config.vncWSS == "yes",
                   'true_color':   true,
                   'local_cursor': true,
                   'shared':       true,
                   'onUpdateState':  updateVNCState});

    var proxy_host = window.location.hostname;
    var proxy_port = Config.vncProxyPort;
    var pw = response["password"];
    var token = response["token"];
    var vm_name = response["vm_name"];
    var path = '?token=' + token;

    var url = "vnc?";
    url += "host=" + proxy_host;
    url += "&port=" + proxy_port;
    url += "&token=" + token;
    url += "&password=" + pw;
    url += "&encrypt=" + Config.vncWSS;
    url += "&title=" + vm_name;

    $("#open_in_a_new_window").attr('href', url)
    _rfb.connect(proxy_host, proxy_port, pw, path);
  }

  function disconnect() {
    if (_rfb) { _rfb.disconnect(); }
  }

  function sendCtrlAltDel() {
    if (_rfb) { rfb.sendCtrlAltDel(); }
  }

  //This is taken from noVNC examples
  function updateVNCState(rfb, state, oldstate, msg) {
    var s, sb, cad, klass;
    s = $D('VNC_status');
    sb = $D('VNC_status_bar');
    cad = $D('sendCtrlAltDelButton');
    switch (state) {
      case 'failed':       level = "error";  break;
      case 'fatal':        level = "error";  break;
      case 'normal':       level = "normal"; break;
      case 'disconnected': level = "normal"; break;
      case 'loaded':       level = "normal"; break;
      default:             level = "warn";   break;
    }

    if (state === "normal") {
      cad.disabled = false;
    } else {
      cad.disabled = true;
    }

    if (typeof(msg) !== 'undefined') {
      sb.setAttribute("class", "noVNC_status_" + level);
      s.innerHTML = msg;
    }
  }
});
