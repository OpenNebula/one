/* ------------------------------------------------------------------------- *
 * Copyright 2002-2026, OpenNebula Project, OpenNebula Systems               *
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

import { useCallback, useEffect, useRef, useState } from 'react'

/** @enum {string} Clipboard state */
export const CLIPBOARD_STATUS = {
  INIT: 'INIT',
  ERROR: 'ERROR',
  COPIED: 'COPIED',
}

const { INIT, ERROR, COPIED } = CLIPBOARD_STATUS

const fallbackCopy = (text) => {
  const input = document.createElement('textarea')
  input.value = String(text)
  input.style.position = 'fixed'
  input.style.opacity = '0'

  document.body.appendChild(input)
  input.select()

  const isCopied = document.execCommand('copy')
  document.body.removeChild(input)

  if (!isCopied) throw new Error('Unable to copy text')
}

/**
 * @callback CallbackCopy
 * @param {string} text - Text to write on clipboard
 */

/**
 * @typedef {object} UseClipboard
 * @property {CallbackCopy} copy - Function to write text on clipboard
 * @property {CLIPBOARD_STATUS} state - Result state of copy action
 * @property {boolean} isCopied
 * - If the text is copied successfully, will be `true` temporally (2s)
 */

/**
 * Hook to manage a clipboard.
 *
 * @param {string|number} [tooltipDelay] - Time in milliseconds to hide the tooltip
 * @returns {UseClipboard} Returns management attributes
 */
const useClipboard = ({ tooltipDelay = 2000 } = {}) => {
  const isMounted = useRef(true)
  const [state, setState] = useState()
  const [copiedText, setCopiedText] = useState()

  useEffect(() => () => (isMounted.current = false), [])

  const isCopied = useCallback(
    (text) => copiedText === String(text),
    [copiedText]
  )

  const copy = useCallback(
    async (text) => {
      const setCopiedState = () => {
        setCopiedText(String(text))
        setState(COPIED)
        if (+tooltipDelay > 0) {
          setTimeout(() => {
            if (isMounted.current) {
              setState(INIT)
              setCopiedText(undefined)
            }
          }, +tooltipDelay)
        }
      }

      try {
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(String(text))
        } else {
          fallbackCopy(text)
        }
        setCopiedState()
      } catch {
        try {
          fallbackCopy(text)
          setCopiedState()
        } catch {
          setState(ERROR)
        }
      }
    },
    [tooltipDelay]
  )

  return { copy, state, isCopied }
}

export default useClipboard
