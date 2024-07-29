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
import { GUACAMOLE_CLIENT_STATES } from 'client/constants'

const isWindow = (display) => display instanceof Window

/**
 * @param {number} clientState - Guacamole client state
 * @returns {string} State information from resource
 */
export const clientStateToString = (clientState) =>
  GUACAMOLE_CLIENT_STATES[+clientState]

/**
 * Returns the string of connection parameters
 * to be passed to the Guacamole client.
 *
 * @param {object} options - Connection parameters
 * @param {HTMLElement} options.display - Element where the connection will be displayed
 * @param {number} options.width - Forced width connection
 * @param {number} options.height - Forced height connection
 * @returns {string} A string of connection parameters
 */
export const getConnectString = (options = {}) => {
  const { token, display = window, dpi, width, height } = options

  // Calculate optimal width/height for display
  const pixelDensity = window.devicePixelRatio || 1
  const optimalDpi = dpi || pixelDensity * 96

  const displayWidth =
    width || (isWindow(display) ? display?.innerWidth : display?.offsetWidth)

  const displayHeight =
    height || (isWindow(display) ? display?.innerHeight : display?.offsetHeight)

  return [
    `token=${encodeURIComponent(token)}`,
    `width=${Math.floor(displayWidth * pixelDensity)}`,
    `height=${Math.floor(displayHeight * pixelDensity)}`,
    `dpi=${Math.floor(optimalDpi)}`,
  ].join('&')
}
