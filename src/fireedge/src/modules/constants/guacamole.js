/* ------------------------------------------------------------------------- *
 * Copyright 2002-2024, OpenNebula Project, OpenNebula Systems               *
 *                                                                           *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may   *
 * not use this file except in compliance with the License. You may obtain   *
 * a copy of the License at                                                  *
 *                                                                           *
 * http://www.apache.org/licenses/LICENSE-2.0                                *
 *                                                                           *
 * Unless required by applicable law or agreed to in writing, software       *
 * distributed under the License is distributed on an "AS IS" BASIS,         *
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  *
 * See the License for the specific language governing permissions and       *
 * limitations under the License.                                            *
 * ------------------------------------------------------------------------- */

// eslint-disable-next-line no-unused-vars
import { Client, WebSocketTunnel, Status } from 'guacamole-common-js'

/**
 * @typedef GuacamoleSessionThumbnail
 * @property {number} timestamp - The time that this thumbnail was generated
 * @property {HTMLCanvasElement} canvas - The thumbnail of the Guacamole client display
 */

/**
 * @typedef GuacamoleSessionProperties
 * @property {boolean} autoFit - Whether the display should be scaled automatically
 * @property {number} scale - The current scale.
 * If autoFit is true, the effect of setting this value is undefined
 * @property {number} minScale - The minimum scale value
 * @property {number} maxScale - The maximum scale value
 * @property {boolean} keyboardEnabled - Whether or not the client should listen to keyboard events
 * @property {number} emulateAbsoluteMouse - Whether translation of touch to mouse events should
 * emulate an absolute pointer device, or a relative pointer device
 * @property {number} scrollTop - The relative Y coordinate of the scroll offset of the display
 * @property {number} scrollLeft - The relative X coordinate of the scroll offset of the display
 */

/**
 * @typedef GuacamoleSessionState
 * @property {GUACAMOLE_CLIENT_STATES} connectionState - The current connection state
 * @property {Status.Code} statusCode - The status code of the current error condition
 * @property {boolean} tunnelUnstable - Whether the network connection used by the tunnel seems unstable
 */

/**
 * @typedef GuacamoleSession
 * @property {string} token - The token of the connection associated with this client
 * @property {string} name - The name returned associated with the connection or connection group in use
 * @property {string} title - The title which should be displayed as the page title for this client
 * @property {Client} client - The actual underlying Guacamole client
 * @property {WebSocketTunnel} tunnel - The tunnel being used by the underlying Guacamole client
 * @property {GuacamoleSessionState} clientState - The current state of the Guacamole client
 * @property {boolean} isUninitialized - When true, indicates that the session hasn't been fired yet
 * @property {boolean} isLoading - When true, indicates that the session is awaiting a response
 * @property {boolean} isConnected - When true, indicates that the last session was connected successfully
 * @property {boolean} isDisconnected - When true, indicates that the last session was disconnected
 * @property {boolean} isError -  When true, indicates that the last session has an error state
 * @property {GuacamoleSessionProperties} clientProperties - The current state of the Guacamole client
 * @property {GuacamoleSessionThumbnail} thumbnail - The most recently-generated thumbnail for this connection
 * @property {number} multiTouchSupport - The number of simultaneous touch contacts supported
 */

/** @enum {string} Guacamole client state strings */
export const GUACAMOLE_STATES_STR = {
  IDLE: 'IDLE',
  CONNECTING: 'CONNECTING',
  WAITING: 'WAITING',
  CONNECTED: 'CONNECTED',
  DISCONNECTING: 'DISCONNECTING',
  DISCONNECTED: 'DISCONNECTED',
  CLIENT_ERROR: 'CLIENT_ERROR',
  TUNNEL_ERROR: 'TUNNEL_ERROR',
}

/** @enum {string} Guacamole client states */
export const GUACAMOLE_CLIENT_STATES = [
  GUACAMOLE_STATES_STR.IDLE,
  GUACAMOLE_STATES_STR.CONNECTING,
  GUACAMOLE_STATES_STR.WAITING,
  GUACAMOLE_STATES_STR.CONNECTED,
  GUACAMOLE_STATES_STR.DISCONNECTING,
  GUACAMOLE_STATES_STR.DISCONNECTED,
]

/**
 * The mimetype of audio data to be sent along the Guacamole
 * connection if audio input is supported.
 *
 * @type {string}
 */
export const AUDIO_INPUT_MIMETYPE = 'audio/L16;rate=44100,channels=2'

/**
 * The minimum amount of time to wait between updates to
 * the client thumbnail, in milliseconds.
 *
 * @type {number}
 */
export const THUMBNAIL_UPDATE_FREQUENCY = 5000
