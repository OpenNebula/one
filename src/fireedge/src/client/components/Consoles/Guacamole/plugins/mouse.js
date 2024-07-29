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
import { useEffect, useRef } from 'react'
import { Mouse } from 'guacamole-common-js'

import { GuacamoleSession } from 'client/constants'

/**
 * @typedef GuacamoleMousePlugin
 * @property {Mouse} [mouse] - Guacamole mouse
 */

/**
 * @param {GuacamoleSession} session - Guacamole session
 * @returns {GuacamoleMousePlugin} Guacamole mouse plugin
 */
const GuacamoleMouse = (session) => {
  const { client, display, isConnected } = session ?? {}

  const mouseRef = useRef(null)

  const handleMouseState = (mouseState, scaleMouse = false) => {
    // Do not attempt to handle mouse state changes if the client
    // or display are not yet available
    if (!client) return

    if (scaleMouse) {
      const clientScale = client.getDisplay().getScale()
      mouseState.y = mouseState.y / clientScale
      mouseState.x = mouseState.x / clientScale
    }

    // Send mouse state, show cursor if necessary
    // client.display?.showCursor(!localCursor)
    client.sendMouseState(mouseState)
  }

  useEffect(() => {
    if (!isConnected) return

    const mouse = new Mouse(client.getDisplay().getElement())
    mouseRef.current = mouse

    mouse.onmousedown = mouse.onmouseup = (mouseState) => {
      // Ensure focus is regained via mousedown before forwarding event
      display?.focus()
      handleMouseState(mouseState)
    }

    // Forward mousemove events untouched
    mouse.onmousemove = (mouseState) => {
      handleMouseState(mouseState, true)
    }

    // Hide software cursor when mouse leaves display
    mouse.onmouseout = () => {
      // client?.display?.showCursor(false)
    }
  }, [isConnected])

  return { mouse: mouseRef.current }
}

export { GuacamoleMouse }
