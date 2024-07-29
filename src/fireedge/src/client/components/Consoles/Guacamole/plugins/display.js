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
import {
  useEffect,
  useMemo,
  useRef,
  MutableRefObject, // eslint-disable-line no-unused-vars
  ReactElement, // eslint-disable-line no-unused-vars
} from 'react'
import { styled } from '@mui/material'

import { GuacamoleSession } from 'client/constants'

/**
 * @typedef GuacamoleDisplayPlugin
 * @property {MutableRefObject} [display] - Display object
 * @property {MutableRefObject} [viewport] - Viewport object is the wrapper of display
 * @property {ReactElement} [displayElement] - Display element
 */

const Viewport = styled('div')({
  backgroundColor: '#222431',
  width: '100%',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  placeContent: 'center',
})

const Display = styled('div')({
  zIndex: 1,
  overflow: 'hidden',
  '& > *': { cursor: 'none' },
})

/**
 * @param {GuacamoleSession} session - Guacamole session
 * @returns {GuacamoleDisplayPlugin} Guacamole display plugin
 */
const GuacamoleDisplay = (session) => {
  const { id, container, header, client, isConnected } = session ?? {}
  const isSSH = useMemo(() => id.includes('ssh'), [id])

  const viewportRef = useRef(null)
  const displayRef = useRef(null)

  const containerResized = () => {
    if (!client || !container) return

    const clientDisplay = client.getDisplay()
    const pixelDensity = window.devicePixelRatio || 1
    const headerHeight = header?.offsetHeight ?? 0

    const width = document.fullscreenElement
      ? window.innerWidth * pixelDensity
      : container.offsetWidth * pixelDensity

    const height = document.fullscreenElement
      ? window.innerHeight * pixelDensity
      : (container.offsetHeight - headerHeight) * pixelDensity

    if (
      clientDisplay.getWidth() !== width ||
      clientDisplay.getHeight() !== height
    ) {
      client.sendSize(width, height)
    }

    // when type connection is SSH, display doesn't need scale
    id.includes('vnc') && updateDisplayScale()
  }

  const updateDisplayScale = () => {
    if (!client) return

    const clientDisplay = client.getDisplay()
    // Get screen resolution.
    const origHeight = Math.max(clientDisplay.getHeight(), 1)
    const origWidth = Math.max(clientDisplay.getWidth(), 1)

    const headerHeight = header?.offsetHeight ?? 0

    const containerWidth = document.fullscreenElement
      ? window.innerWidth
      : container.offsetWidth

    const containerHeight = document.fullscreenElement
      ? window.innerHeight
      : container.offsetHeight - headerHeight

    const xScale = containerWidth / origWidth
    const yScale = containerHeight / origHeight

    // This is done to handle both X and Y axis
    let scale = Math.min(yScale, xScale)

    // Limit to 1
    scale = Math.min(scale, 1)

    scale !== 0 && clientDisplay.scale(scale)
  }

  useEffect(() => {
    if (!isConnected) return

    const display = displayRef.current
    const clientDisplay = client.getDisplay()

    display?.appendChild(clientDisplay.getElement())

    const pollResize = setInterval(containerResized, 10)

    return () => {
      display?.childNodes.forEach((node) => display?.removeChild(node))
      clearInterval(pollResize)
    }
  }, [isConnected])

  return {
    display: displayRef.current,
    viewport: viewportRef.current,
    displayElement: (
      <Viewport ref={viewportRef}>
        <Display
          ref={displayRef}
          sx={isSSH ? { width: '100%', height: '100%' } : {}}
        />
      </Viewport>
    ),
  }
}

export { GuacamoleDisplay }
