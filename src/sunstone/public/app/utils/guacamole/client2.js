/* -------------------------------------------------------------------------- */
/* Copyright 2002-2021, OpenNebula Project, OpenNebula Systems                */
/*                                                                            */
/* Licensed under the Apache License, Version 2.0 (the "License"); you may    */
/* not use this file except in compliance with the License. You may obtain    */
/* a copy of the License at                                                   */
/*                                                                            */
/* http://www.apache.org/licenses/LICENSE-2.0                                 */
/*                                                                            */
/* Unless required by applicable law or agreed to in writing, software        */
/* distributed under the License is distributed on an "AS IS" BASIS,          */
/* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.   */
/* See the License for the specific language governing permissions and        */
/* limitations under the License.                                             */
/* -------------------------------------------------------------------------- */

define(function(require) {
  /**
   * DEPENDENCIES
   */
  require("guacamole-common-js")
  var Config = require("sunstone-config");
  var Notifier = require("utils/notifier");
  var Locale = require("utils/locale");
  var UtilsConnection = require("utils/info-connection/utils");

  /*
    CONSTANTS
   */

  var KEYS = {
    CTRL: 0xFF03,
    ALT: 0xFFE9,
    DELETE: 0xFFFF,
  };

  var client = null;

  /**
   * Whether the local, hardware mouse cursor is in use. 
   * @type Boolean
  */
  var localCursor = false;

  /**
   * CONSTRUCTOR
   */

  function GClient() {
    this._display = null;
    this._client = null;
    this._keyboard = null;
    this._clientErrorText = Locale.tr("The OpenNebula service for remote console is not running, please contact your administrator.")
    
    this._mouse = null;
    this._touchScreen = null;

    return this;
  };

  GClient.prototype = {
    "connect": connect,
    "mouse": mouse,
    "keyboard": keyboard,
    "disconnect": disconnect,
    
    /* ----- FUNCTIONS INTERACTION ----- */
    snapshot: getCanvas,
    sendCtrlAltDelete: sendCtrlAltDelete
  };

  return GClient;

  function setStatus(state = "") {
    $('#guacamole-state').text(state).animate();
  }

  function setLoading(isLoading = false) {
    $('#guacamole-loading')[isLoading ? 'fadeIn' : 'fadeOut']('fast');
  }

  function connect(response) {
    var that = this;
    
    if (!response.token) {
      Notifier.notifyError(this._clientErrorText)
      return null;
    }
    else {
      setLoading(true);
    }

    var endpoint = Config.publicFireedgeEndpoint.split("//");
    var fireedge_protocol = endpoint[0];
    var fireedge_host = endpoint[1].split(":")[0];
    var fireedge_port = endpoint[1].split(":")[1];

    var port = fireedge_port || '2616';
    var host = fireedge_host || 'localhost';
    var wsprotocol = (fireedge_protocol == 'https:') ? 'wss:' : 'ws:';

    var tunnel = new Guacamole.WebSocketTunnel(wsprotocol + '//' + host + ':' + port + '/fireedge/guacamole')
    console.log('-<<<<<< pepe')
    client = new Guacamole.Client(tunnel);
    var display = client.getDisplay();

    config.guac = client;

    //var guacLayout = new Guacamole.OnScreenKeyboard.Layout()

    //var keyboard = new Guacamole.OnScreenKeyboard(guacLayout);
    //$("#guacamole-keyboard").html(keyboard.getElement());
    //if (keyboard) keyboard.resize($("#guacamole-keyboard").offsetWidth);

    var info_decode = UtilsConnection.decodeInfoConnection(response.info);
    UtilsConnection.printInfoConnection($('.guac_info'), info_decode);

    // Client display
    this._displayContainer = document.getElementById('guacamole-display');
    this._displayContainer.appendChild(display.getElement());

    // client error handler
    client.onerror = function() {
      Notifier.notifyError(clientErrorText)
    };

    // websocket error handler
    tunnel.onerror = function() {
      disconnect();
      Notifier.notifyError(clientErrorText)

      setStatus("Guacamole tunnel ERROR");
      setLoading(false);
    };

    client.onstatechange = function(state) {
      switch (state) {
        case 0:
          setStatus('Client IDLE');
          setLoading(true);
        break;
        case 1:
          setStatus('Client CONNECTING');
          setLoading(true);
          break;
        case 2:
          setStatus('Client WAITING');
          setLoading(true);
          break;
        case 3:
          $("#sendCtrlAltDelButton_gclient").on("click", function() {
            sendCtrlAltDelete();
          });
          setStatus('Client CONNECTED');
          setLoading(false);
          setTimeout(function() {
            rescale(that);
            display.showCursor(false);
          }, 100);
          break;
        case 4:
          setStatus('Client DISCONNECTING');
          setLoading(true);
          break;
        case 5:
          setStatus('Client DISCONNECTED');
          setLoading(false);
          break;
        default:
          setStatus('Client ERROR');
          setLoading(false);
          break;
      }
    }

    // Connect
    var params = [
      'token=' + response.token,
      'width=' + this._displayContainer.offsetWidth
    ];

    try {
      var con = client.connect(params.join('&'));
      console.log('... connect', con)
    } catch (error) {
      console.log(error)
      client = null;
    }

    // Disconnect on close
    window.onunload = function () {
      disconnect();
    };

    // Scale display when window resize
    $(window).resize(function () {
      rescale(that);
    });
  }

  /*
    GuacamoleWrapper.mouse
    - handles mouse interaction
   */
  function mouse(enable = true) {
    var that = this;
    var display = client.getDisplay();

    if (!client || !display) return;

    if (enable) {
      var displayElement = display.getElement();

      var mouse = this._mouse = new Guacamole.Mouse(displayElement);

      // Ensure focus is regained via mouseup/mousedown before forwarding event
      mouse.onmouseup   =
      mouse.onmousedown = function(mouseState) {
        document.body.focus();
        handleMouseState(mouseState, that);
      };

      // Forward mousemove events
      mouse.onmousemove = function(mouseState) {
        mouseState.y =  mouseState.y / display.getScale();
        mouseState.x =  mouseState.x / display.getScale();
        handleMouseState(mouseState, that);
      }

      // Hide software cursor when mouse leaves display
      mouse.onmouseout = function() {
        if (!display) return;
        display.showCursor(false);
      };

      display.oncursor = function setClientCursor(canvas, x, y) {
        localCursor = mouse.setCursor(canvas, x, y);
      }
    } else {
      this._mouse.onmouseup =
      this._mouse.onmousedown =
      this._mouse.onmousemove =
      this._mouse.onmouseout =
      this._mouse = null;
    }
  }

  /**
   * Handles a mouse event originating from the user's actual mouse.
   * This differs from handleEmulatedMouseState() in that the
   * software mouse cursor must be shown only if the user's browser
   * does not support explicitly setting the hardware mouse cursor.
   *
   * @param {Guacamole.Mouse.State} mouseState
   *     The current state of the user's hardware mouse.
   */
   function handleMouseState(mouseState, thisContext) {
    var display = client.getDisplay();

    // Do not attempt to handle mouse state changes if the client
    // or display are not yet available
    if (!client || !display)
        return;

    // Send mouse state, show cursor if necessary
    display.showCursor(!localCursor);
    client.sendMouseState(mouseState, true);
  };


  /*
    GuacamoleWrapper.keyboard
    - handles keyboard interaction
   */
  function keyboard(enable = true) {
    var that = this;
    var displayContainer = this._displayContainer;

    if (!client || !displayContainer) return;

    if (enable) {
      var keyboard = this._keyboard = new Guacamole.Keyboard(document);
      var sink = new Guacamole.InputSink();

      document.body.appendChild(sink.getElement());
      keyboard.listenTo(sink.getElement());

      keyboard.onkeydown = function(keysym) {
        console.log(keysym)
        client.sendKeyEvent(1, keysym);
      }

      keyboard.onkeyup = function(keysym) {
        client.sendKeyEvent(0, keysym);
      }
    } else {
      this._keyboard.onkeydown =
      this._keyboard.onkeyup =
      this._keyboard = null;
    }
  }

  /*
    GuacamoleWrapper.sendCtrlAltDelete
   */
  function sendCtrlAltDelete() {
    if (!client) return;

    client.sendKeyEvent(1, KEYS.CTRL);
    client.sendKeyEvent(1, KEYS.ALT);
    client.sendKeyEvent(1, KEYS.DELETE);
    client.sendKeyEvent(0, KEYS.DELETE);
    client.sendKeyEvent(0, KEYS.ALT);
    client.sendKeyEvent(0, KEYS.CTRL);
  }
  
  /*
    GuacamoleWrapper.getCanvas
    - shortcut for returning default guac layer (active tunnel viewport)
   */
  function getCanvas() {
    return (client) ? client.getDisplay().getDefaultLayer().getCanvas() : false;
  }

  function disconnect() {
    if (client) {
      client.disconnect();
      client = null;

      console.log('->>> disconnect')

      this._scale = 1;
      this._displayContainer.innerHTML = ""
      $(window).off('resize');
      setStatus()
    }
  }

  /**
   * Updates the scale of the attached Guacamole.Client based on current window
   * size and "auto-fit" setting.
   */
  function rescale(thisContext) {
    var displayContainer = thisContext._displayContainer;
    var display = client.getDisplay();

    // Get screen resolution.
    var origHeight = Math.max(display.getHeight(), 1);
    var origWidth = Math.max(display.getWidth(), 1);
    
    var htmlWidth = displayContainer.offsetWidth;
    var htmlHeight = displayContainer.offsetHeight;
    
    var xScale = htmlWidth / origWidth;
    var yScale = htmlHeight / origHeight;
    
    // This is done to handle both X and Y axis
    var scale = Math.min(yScale, xScale);

    // Limit to 1
    scale = Math.min(scale, 1);

    if (scale !== 0) {
      display.scale(scale);
      
      // Set minimum height to display container
      displayContainer.style['min-height'] = display.getHeight() + "px";
    }
  }
});
