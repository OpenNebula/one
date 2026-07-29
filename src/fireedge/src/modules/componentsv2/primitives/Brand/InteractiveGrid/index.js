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

import { ReactElement, useCallback, useRef } from 'react'
import PropTypes from 'prop-types'
import { Box } from '@mui/material'
import { getStyles } from '@modules/componentsv2/primitives/Brand/InteractiveGrid/styles'

/**
 * @param {object} root0 - Props
 * @param {ReactElement} root0.children - Children elements
 * @returns {ReactElement} - Interactive grid component
 */
export const InteractiveGrid = ({ children, ...opts }) => {
  const { sx, ...boxProps } = opts
  const frameRef = useRef(null)

  const handlePointerMove = useCallback((event) => {
    const node = event.currentTarget
    const rect = node.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    window.cancelAnimationFrame(frameRef.current)
    frameRef.current = window.requestAnimationFrame(() => {
      node.style.setProperty('--interactive-grid-x', `${x}px`)
      node.style.setProperty('--interactive-grid-y', `${y}px`)
      node.style.setProperty('--interactive-grid-opacity', 1)
    })
  }, [])

  const handlePointerLeave = useCallback((event) => {
    window.cancelAnimationFrame(frameRef.current)
    event.currentTarget.style.setProperty('--interactive-grid-opacity', 0)
  }, [])

  return (
    <Box
      {...boxProps}
      sx={[
        (theme) => getStyles({ theme }),
        ...(Array.isArray(sx) ? sx : [sx]),
      ].filter(Boolean)}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      <Box className="interactive-grid-content">{children}</Box>
    </Box>
  )
}

InteractiveGrid.propTypes = {
  children: PropTypes.node,
}

InteractiveGrid.displayName = 'InteractiveGrid'
