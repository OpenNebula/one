define(function(require) {
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

  var rfb;

  function passwordRequired(rfb) {
    var msg;
    msg = '<form onsubmit="return setPassword();"';
    msg += '  style="margin-bottom: 0px">';
    msg += 'Password Required: ';
    msg += '<input type=password size=10 id="password_input" class="noVNC_status">';
    msg += '<\/form>';
    $D('noVNC_status_bar').setAttribute("class", "noVNC_status_warn");
    $D('noVNC_status').innerHTML = msg;
  }
  function setPassword() {
    rfb.sendPassword($D('password_input').value);
    return false;
  }
  function sendCtrlAltDel() {
    rfb.sendCtrlAltDel();
    return false;
  }
  function xvpShutdown() {
    rfb.xvpShutdown();
    return false;
  }
  function xvpReboot() {
    rfb.xvpReboot();
    return false;
  }
  function xvpReset() {
    rfb.xvpReset();
    return false;
  }
  function updateState(rfb, state, oldstate, msg) {
    var s, sb, cad, level;
    s = $D('noVNC_status');
    sb = $D('noVNC_status_bar');
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
      xvpInit(0);
    }

    if (typeof(msg) !== 'undefined') {
      sb.setAttribute("class", "noVNC_status_" + level);
      s.innerHTML = msg;
    }
  }

  function xvpInit(ver) {
    var xvpbuttons;
    xvpbuttons = $D('noVNC_xvp_buttons');
    if (ver >= 1) {
      xvpbuttons.style.display = 'inline';
    } else {
      xvpbuttons.style.display = 'none';
    }
  }

    var host, port, password, path, token;

    $D('sendCtrlAltDelButton').style.display = "inline";
    $D('sendCtrlAltDelButton').onclick = sendCtrlAltDel;
    $D('xvpShutdownButton').onclick = xvpShutdown;
    $D('xvpRebootButton').onclick = xvpReboot;
    $D('xvpResetButton').onclick = xvpReset;

    WebUtil.init_logging(WebUtil.getQueryVar('logging', 'warn'));
    document.title = unescape(WebUtil.getQueryVar('title', 'noVNC'));
    // By default, use the host and port of server that served this file
    host = WebUtil.getQueryVar('host', window.location.hostname);
    port = WebUtil.getQueryVar('port', window.location.port);

    // if port == 80 (or 443) then it won't be present and should be
    // set manually
    if (!port) {
      if (window.location.protocol.substring(0, 4) == 'http') {
        port = 80;
      } else if (window.location.protocol.substring(0, 5) == 'https') {
        port = 443;
      }
    }

    // If a token variable is passed in, set the parameter in a cookie.
    // This is used by nova-novncproxy.
    token = WebUtil.getQueryVar('token', null);
    if (token) {
      WebUtil.createCookie('token', token, 1)
    }

    password = WebUtil.getQueryVar('password', '');
    path = WebUtil.getQueryVar('path', 'websockify');

    if ((!host) || (!port)) {
      updateState('failed',
          "Must specify host and port in URL");
      return;
    }

    rfb = new RFB({'target':       $D('noVNC_canvas'),
                   'encrypt':      WebUtil.getQueryVar('encrypt',
                            (window.location.protocol === "https:")),
                   'repeaterID':   WebUtil.getQueryVar('repeaterID', ''),
                   'true_color':   WebUtil.getQueryVar('true_color', true),
                   'local_cursor': WebUtil.getQueryVar('cursor', true),
                   'shared':       WebUtil.getQueryVar('shared', true),
                   'view_only':    WebUtil.getQueryVar('view_only', false),
                   'onUpdateState':  updateState,
                   'onXvpInit':    xvpInit,
                   'onPasswordRequired':  passwordRequired});

    rfb.connect(host, port, password, path + "?token=" + token);
})
