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
import { useCallback, useEffect, useRef, useState } from 'react'
import { Keyboard } from 'guacamole-common-js'

import { GuacamoleSession } from 'client/constants'

/**
 * @typedef GuacamoleKeyboardPlugin
 * @property {Keyboard} [keyboard] - Guacamole keyboard
 */

/**
 * @param {GuacamoleSession} session - Guacamole session
 * @returns {GuacamoleKeyboardPlugin} Guacamole keyboard plugin
 */
const GuacamoleKeyboard = (session) => {
  const { client, isConnected } = session ?? {}

  const keyboardRef = useRef(null)

  useEffect(() => {
    if (!isConnected) return

    keyboardRef.current = new Keyboard(document)

    keyboardRef.current.onkeydown = (keySym) => client?.sendKeyEvent(1, keySym)
    keyboardRef.current.onkeyup = (keySym) => client?.sendKeyEvent(0, keySym)

    // Release all keys when window loses focus
    window.addEventListener('blur', keyboardRef.current?.reset)

    return () => {
      window.removeEventListener('blur', keyboardRef.current?.reset)
    }
  }, [isConnected])

  return { keyboard: keyboardRef.current }
}

export { GuacamoleKeyboard }
