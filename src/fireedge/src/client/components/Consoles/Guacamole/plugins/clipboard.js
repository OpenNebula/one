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
import { useEffect, useState } from 'react'
import {
  StringReader,
  StringWriter,
  BlobReader,
  BlobWriter,
} from 'guacamole-common-js'

import { GuacamoleSession } from 'client/constants'
import { isDevelopment } from 'client/utils'

const createClipboardData = ({ id, type, data } = {}) => ({
  source: id,
  /**
   * The mimetype of the data currently stored within the clipboard.
   *
   * @type {string}
   */
  type: type || 'text/plain',
  /**
   * The data currently stored within the clipboard.
   *
   * @type {string|Blob|File}
   */
  data: data ?? '',
})

/**
 * @param {GuacamoleSession} session - Current session
 * @returns {null} null
 */
const GuacamoleClipboard = (session) => {
  const { id, client, isConnected } = session ?? {}

  const [pendingRead, setPendingRead] = useState(() => false)
  const [storedClipboard, storeClipboard] = useState(() =>
    createClipboardData({ id })
  )

  const getLocalClipboard = async () => {
    try {
      if (pendingRead) return

      const text = await navigator.clipboard.readText()
      storeClipboard((prev) => ({ ...prev, data: text, type: 'text/plain' }))

      return text
    } finally {
      setPendingRead(false)
    }
  }

  const setLocalClipboard = async ({ data, type }) => {
    if (type !== 'text/plain') return

    await navigator.clipboard.writeText(data)
    storeClipboard((prev) => ({ ...prev, data, type }))
  }

  const setClientClipboard = ({ data, type = 'text/plain' } = {}) => {
    // Create stream with proper mimetype
    const stream = client.createClipboardStream(type)

    // Send data as a string if it is stored as a string
    if (typeof data === 'string') {
      const writer = new StringWriter(stream)
      writer.sendText(data)
      writer.sendEnd()
    }
    // Otherwise, assume the data is a File/Blob
    else {
      // Write File/Blob asynchronously
      const writer = new BlobWriter(stream)
      writer.oncomplete = () => {
        writer.sendEnd()
      }

      // Begin sending data
      writer.sendBlob(data)
    }
  }

  const resyncClipboard = async () => {
    try {
      const localClipboard = await getLocalClipboard()
      setClientClipboard({ data: localClipboard })
    } catch (e) {
      isDevelopment() && console.log(e)
    }
  }

  const focusGained = (evt) => {
    // Only recheck clipboard if it's the window itself that gained focus
    evt.target === window && resyncClipboard()
  }

  useEffect(() => {
    if (!isConnected) return
    ;(async () => await resyncClipboard())()

    window.addEventListener('load', resyncClipboard, true)
    window.addEventListener('copy', resyncClipboard)
    window.addEventListener('cut', resyncClipboard)
    window.addEventListener('focus', focusGained, true)

    client.onclipboard = (stream, mimetype) => {
      // If the received data is text, read it as a simple string
      if (/^text\//.exec(mimetype)) {
        const reader = new StringReader(stream)

        // Assemble received data into a single string
        let data = ''
        reader.ontext = (text) => {
          data += text
        }

        // Set clipboard contents once stream is finished
        reader.onend = () => {
          setLocalClipboard({ data, type: mimetype })
        }
      }
      // Otherwise read the clipboard data as a Blob
      else {
        const reader = new BlobReader(stream, mimetype)

        reader.onend = () => {
          setLocalClipboard({ data: reader.getBlob(), type: mimetype })
        }
      }
    }

    return () => {
      window.removeEventListener('load', resyncClipboard, true)
      window.removeEventListener('copy', resyncClipboard)
      window.removeEventListener('cut', resyncClipboard)
      window.removeEventListener('focus', focusGained, true)
    }
  }, [isConnected])

  return { storedClipboard }
}

export { GuacamoleClipboard }
