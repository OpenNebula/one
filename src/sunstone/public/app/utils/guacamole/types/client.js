/* -------------------------------------------------------------------------- */
/* Copyright 2002-2024, OpenNebula Project, OpenNebula Systems                */
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

  require("guacamole-common-js")
  var ClientProperties = require("utils/guacamole/types/client-properties");
  var ClipboardData = require("utils/guacamole/types/clipboard-data");
  var Config = require("sunstone-config");
  var ManagedClientState = require("utils/guacamole/types/client-state");
  var ManagedClientThumbnail = require("utils/guacamole/types/client-thumbnail");
  var ManagedDisplay = require("utils/guacamole/types/display");

  /**
   * The minimum amount of time to wait between updates to the client
   * thumbnail, in milliseconds.
   *
   * @type Number
   */
  var THUMBNAIL_UPDATE_FREQUENCY = 5000;

  /**
   * Object which serves as a surrogate interface, encapsulating a Guacamole
   * client while it is active, allowing it to be detached and reattached
   * from different client views.
   * 
   * @constructor
   * @param {ManagedClient|Object} [template = {}]
   *     The object whose properties should be copied within the new ManagedClient.
   */
  function ManagedClient(template = {}) {
    /**
     * The token of the connection associated with this client.
     *
     * @type String
     */
    this.token = template.token;

    /**
     * The time that the connection was last brought to the foreground of
     * the current tab, as the number of milliseconds elapsed since
     * midnight of January 1, 1970 UTC. If the connection has not yet been
     * viewed, this will be 0.
     *
     * @type Number
     */
    this.lastUsed = template.lastUsed || 0;

    /**
     * The actual underlying Guacamole client.
     *
     * @type Guacamole.Client
     */
    this.client = template.client;

    /**
     * The tunnel being used by the underlying Guacamole client.
     *
     * @type Guacamole.Tunnel
     */
    this.tunnel = template.tunnel;

    /**
     * The display associated with the underlying Guacamole client.
     * 
     * @type ManagedDisplay
     */
    this.managedDisplay = template.managedDisplay;

    /**
     * The name returned associated with the connection or connection
     * group in use.
     *
     * @type String
     */
    this.name = template.name;

    /**
     * The title which should be displayed as the page title for this
     * client.
     *
     * @type String
     */
    this.title = template.title;

    /**
     * The most recently-generated thumbnail for this connection, as
     * stored within the local connection history. If no thumbnail is
     * stored, this will be null.
     *
     * @type ManagedClientThumbnail
     */
    this.thumbnail = template.thumbnail;

    /**
     * The current clipboard contents.
     *
     * @type ClipboardData
     */
    this.clipboardData = template.clipboardData || new ClipboardData({
        type : 'text/plain',
        data : ''
    });

    /**
     * The current state of all parameters requested by the server via
     * "required" instructions, where each object key is the name of a
     * requested parameter and each value is the current value entered by
     * the user or null if no parameters are currently being requested.
     *
     * @type Object.<String, String>
     */
    this.requiredParameters = null;

    /**
     * All uploaded files. As files are uploaded, their progress can be
     * observed through the elements of this array. It is intended that
     * this array be manipulated externally as needed.
     *
     * @type ManagedFileUpload[]
     */
    this.uploads = template.uploads || [];

    /**
     * All currently-exposed filesystems. When the Guacamole server exposes
     * a filesystem object, that object will be made available as a
     * ManagedFilesystem within this array.
     *
     * @type ManagedFilesystem[]
     */
    this.filesystems = template.filesystems || [];

    /**
     * All available share links generated for the this ManagedClient via
     * ManagedClient.createShareLink(). Each resulting share link is stored
     * under the identifier of its corresponding SharingProfile.
     *
     * @type Object.<String, ManagedShareLink>
     */
    this.shareLinks = template.shareLinks || {};

    /**
     * The number of simultaneous touch contacts supported by the remote
     * desktop. Unless explicitly declared otherwise by the remote desktop
     * after connecting, this will be 0 (multi-touch unsupported).
     *
     * @type Number
     */
    this.multiTouchSupport = template.multiTouchSupport || 0;

    /**
     * The current state of the Guacamole client (idle, connecting,
     * connected, terminated with error, etc.).
     * 
     * @type ManagedClientState
     */
    this.clientState = template.clientState || new ManagedClientState();

    /**
     * Properties associated with the display and behavior of the Guacamole
     * client.
     *
     * @type ClientProperties
     */
    this.clientProperties = template.clientProperties || new ClientProperties();

    /**
     * All editable arguments (connection parameters), stored by their
     * names. Arguments will only be present within this set if their
     * current values have been exposed by the server via an inbound "argv"
     * stream and the server has confirmed that the value may be changed
     * through a successful "ack" to an outbound "argv" stream.
     *
     * @type {Object.<String, ManagedArgument>}
     */
    this.arguments = template.arguments || {};

  };

  /**
   * The mimetype of audio data to be sent along the Guacamole connection if
   * audio input is supported.
   *
   * @constant
   * @type String
   */
  ManagedClient.AUDIO_INPUT_MIMETYPE = 'audio/L16;rate=44100,channels=2';

  /**
   * Returns a promise which resolves with the string of connection
   * parameters to be passed to the Guacamole client during connection. This
   * string generally contains the desired connection ID, display resolution,
   * and supported audio/video/image formats. The returned promise is
   * guaranteed to resolve successfully.
   *
   * @param {String} token The identifier representing the connection or group to connect to.
   * @param {Element} options.display Element where the connection will be displayed.
   * @param {String} options.width Forced width connection
   * @param {String} options.height Forced height connection
   * 
   * @returns {String} A string of connection parameters to be passed to the Guacamole client.
   */
  function getConnectString(token, options = {}) {
    options = Object.assign({ display: window }, options)

    // Calculate optimal width/height for display
    var pixel_density = window.devicePixelRatio || 1;
    var optimal_dpi = options.dpi || pixel_density * 96;
    
    var display = options.display

    var width = options.width || (
      display instanceof Window ? display.innerWidth : display.offsetWidth
    )

    var height = options.height || (
      display instanceof Window ? display.innerHeight : display.offsetHeight
    )

    // Build base connect string
    var connectString = [
      "token="    + encodeURIComponent(token),
      "width="    + Math.floor(width * pixel_density),
      "height="   + Math.floor(height * pixel_density),
      "dpi="      + Math.floor(optimal_dpi)  
    ];

    return connectString.join('&');
  }

  /**
   * Requests the creation of a new audio stream, recorded from the user's
   * local audio input device. If audio input is supported by the connection,
   * an audio stream will be created which will remain open until the remote
   * desktop requests that it be closed. If the audio stream is successfully
   * created but is later closed, a new audio stream will automatically be
   * established to take its place. The mimetype used for all audio streams
   * produced by this function is defined by
   * ManagedClient.AUDIO_INPUT_MIMETYPE.
   *
   * @param {Guacamole.Client} client
   *     The Guacamole.Client for which the audio stream is being requested.
   */
   var requestAudioStream = function requestAudioStream(client) {
    // Create new audio stream, associating it with an AudioRecorder
    var stream = client.createAudioStream(ManagedClient.AUDIO_INPUT_MIMETYPE);
    var recorder = Guacamole.AudioRecorder.getInstance(stream, ManagedClient.AUDIO_INPUT_MIMETYPE);

    // If creation of the AudioRecorder failed, simply end the stream
    if (!recorder) {
      stream.sendEnd();
    }
    // Otherwise, ensure that another audio stream is created after this
    // audio stream is closed
    else {
      recorder.onclose = requestAudioStream.bind(this, client);
    }
  };

  /**
   * Creates a new ManagedClient, connecting it to the specified connection
   * or group.
   *
   * @param {String} token The token of the connection.
   * @param {Object} displayOptions The options to client display
   * 
   * @returns {ManagedClient}
   *     A new ManagedClient instance which is connected to the connection or
   *     connection group having the given ID.
   */
  ManagedClient.getInstance = function getInstance(token, displayOptions) {
    var endpoint = new URL(Config.publicFireedgeEndpoint);
    
    var websocketProtocol = endpoint.protocol === 'https:' ? 'wss:' : 'ws:';
    var fireedgeWebsocket = websocketProtocol + '//' + endpoint.host + '/fireedge/guacamole'

    // Get new websocket tunnel instance
    var tunnel = new Guacamole.WebSocketTunnel(fireedgeWebsocket);

    // Get new client instance
    var client = new Guacamole.Client(tunnel);

    // Associate new managed client with new client and tunnel
    var managedClient = new ManagedClient({
      id     : token,
      client : client,
      tunnel : tunnel
    });

    tunnel.onerror = function tunnelError(status) {
      ManagedClientState.setConnectionState(
        managedClient.clientState,
        ManagedClientState.ConnectionState.TUNNEL_ERROR,
        status.code
      );
    };

    // Update connection state as tunnel state changes
    tunnel.onstatechange = function tunnelStateChanged(state) {
      switch (state) {
      // Connection is being established
      case Guacamole.Tunnel.State.CONNECTING:
        ManagedClientState.setConnectionState(
          managedClient.clientState,
          ManagedClientState.ConnectionState.CONNECTING
        );
        break;

      // Connection is established / no longer unstable
      case Guacamole.Tunnel.State.OPEN:
        ManagedClientState.setTunnelUnstable(managedClient.clientState, false);
        break;

      // Connection is established but misbehaving
      case Guacamole.Tunnel.State.UNSTABLE:
        ManagedClientState.setTunnelUnstable(managedClient.clientState, true);
        break;

      // Connection has closed
      case Guacamole.Tunnel.State.CLOSED:
        ManagedClientState.setConnectionState(
          managedClient.clientState,
          ManagedClientState.ConnectionState.DISCONNECTED
        );
        break;     
      }
    };

    // Update connection state as client state changes
    client.onstatechange = function clientStateChanged(clientState) {
      switch (clientState) {
        // Idle
        case 0:
          ManagedClientState.setConnectionState(
            managedClient.clientState,
            ManagedClientState.ConnectionState.IDLE
          );
          break;

        // Ignore "connecting" state
        case 1: // Connecting
            break;

        // Connected + waiting
        case 2:
          ManagedClientState.setConnectionState(
            managedClient.clientState,
            ManagedClientState.ConnectionState.WAITING
          );
          break;

        // Connected
        case 3:
          ManagedClientState.setConnectionState(
            managedClient.clientState,
            ManagedClientState.ConnectionState.CONNECTED
          );

          // Send any clipboard data already provided
          if (managedClient.clipboardData) {
            ManagedClient.setClipboard(managedClient, managedClient.clipboardData);
          }

          // Begin streaming audio input if possible
          // requestAudioStream(client);

          // Update thumbnail with initial display contents
          //ManagedClient.updateThumbnail(managedClient);
          break;

        // Update history when disconnecting
        case 4: // Disconnecting
        case 5: // Disconnected
          //ManagedClient.updateThumbnail(managedClient);
          break;
      }
    };

    // Disconnect and update status when the client receives an error
    client.onerror = function clientError(status) {
      // Disconnect, if connected
      client.disconnect();

      // Update state
      ManagedClientState.setConnectionState(
        managedClient.clientState,
        ManagedClientState.ConnectionState.CLIENT_ERROR,
        status.code
      );
    };

    // Automatically update the client thumbnail
    client.onsync = function syncReceived() {
      var thumbnail = managedClient.thumbnail;
      var timestamp = new Date().getTime();

      // Update thumbnail if it doesn't exist or is old
      if (!thumbnail || timestamp - thumbnail.timestamp >= THUMBNAIL_UPDATE_FREQUENCY) {
        //ManagedClient.updateThumbnail(managedClient);
      }
    };

    // Handle any received clipboard data
    client.onclipboard = function clientClipboardReceived(stream, mimetype) {
      var reader;

      // If the received data is text, read it as a simple string
      if (/^text\//.exec(mimetype)) {
        reader = new Guacamole.StringReader(stream);

        // Assemble received data into a single string
        var data = '';
        reader.ontext = function textReceived(text) {
          data += text;
        };

        // Set clipboard contents once stream is finished
        reader.onend = function textComplete() {
          managedClient.clipboardData = new ClipboardData({
            type : mimetype,
            data : data
          });
        };
      }
      // Otherwise read the clipboard data as a Blob
      else {
        reader = new Guacamole.BlobReader(stream, mimetype);
        reader.onend = function blobComplete() {
          managedClient.clipboardData = new ClipboardData({
              type : mimetype,
              data : reader.getBlob()
          });
        };
      }
    };

    // Update title when a "name" instruction is received
    client.onname = function clientNameReceived(name) {
      managedClient.title = name;
    };

    // Manage the client display
    managedClient.managedDisplay = ManagedDisplay.getInstance(client.getDisplay());

    // Connect the Guacamole client
    var connectString = getConnectString(token, displayOptions);
    client.connect(connectString);

    return managedClient;
  }

  /**
   * Sends the given clipboard data over the given Guacamole client, setting
   * the contents of the remote clipboard to the data provided.
   *
   * @param {ManagedClient} managedClient
   *     The ManagedClient over which the given clipboard data is to be sent.
   *
   * @param {ClipboardData} data
   *     The clipboard data to send.
   */
  ManagedClient.setClipboard = function setClipboard(managedClient, data) {
    var writer;

    // Create stream with proper mimetype
    var stream = managedClient.client.createClipboardStream(data.type);

    // Send data as a string if it is stored as a string
    if (typeof data.data === 'string') {
      writer = new Guacamole.StringWriter(stream);

      for (var i = 0; i < data.data.length; i += 4096) {
        writer.sendText(data.data.substring(i, i + 4096));
      }

      writer.sendEnd();
    }
    // Otherwise, assume the data is a File/Blob
    else {
      // Write File/Blob asynchronously
      writer = new Guacamole.BlobWriter(stream);
      writer.oncomplete = function clipboardSent() {
          writer.sendEnd();
      };

      // Begin sending data
      writer.sendBlob(data.data);
    }
  };

  /**
   * Store the thumbnail of the given managed client within the connection
   * history under its associated ID. If the client is not connected, this
   * function has no effect.
   *
   * @param {ManagedClient} managedClient
   *     The client whose history entry should be updated.
   */
  ManagedClient.updateThumbnail = function updateThumbnail(managedClient) {
    var display = managedClient.client.getDisplay();

    // Update stored thumbnail of previous connection
    if (display && display.getWidth() > 0 && display.getHeight() > 0) {

        // Get screenshot
        var canvas = display.flatten();

        // Calculate scale of thumbnail (max 320x240, max zoom 100%)
        var scale = Math.min(320 / canvas.width, 240 / canvas.height, 1);

        // Create thumbnail canvas
        var thumbnail = document.createElement('canvas');
        thumbnail.width  = canvas.width * scale;
        thumbnail.height = canvas.height * scale;

        // Scale screenshot to thumbnail
        var context = thumbnail.getContext('2d');
        context.drawImage(canvas,
            0, 0, canvas.width, canvas.height,
            0, 0, thumbnail.width, thumbnail.height
        );

        // Store updated thumbnail within client
        managedClient.thumbnail = new ManagedClientThumbnail({
            timestamp : new Date().getTime(),
            canvas    : thumbnail
        });

        // Update historical thumbnail
        // guacHistory.updateThumbnail(managedClient.id, thumbnail.toDataURL("image/png"));

    }

};

  return ManagedClient;

});