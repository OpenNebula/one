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

import { alpha } from '@mui/material'

const GRID_SIZE = '55px'
const GRID_HEIGHT = 'clamp(18rem, 42vh, 34rem)'
const SPOTLIGHT_SIZE = '180px'

/**
 * @param {object} root0 - Params
 * @param {object} root0.theme - Current theme in use
 * @returns {object} - Interactive grid SX style
 */
export const getStyles = ({ theme }) => {
  const brandColor = theme.palette.logo?.color ?? theme.palette.primary.main
  const baseLineColor = alpha(brandColor, 0.12)
  const activeLineColor = alpha(brandColor, 0.75)

  return {
    '--interactive-grid-x': '50%',
    '--interactive-grid-y': '50%',
    '--interactive-grid-opacity': 0,
    gridColumn: '1 / -1',
    gridRow: '1',
    justifySelf: 'center',
    width: '100%',
    height: GRID_HEIGHT,
    display: 'grid',
    placeItems: 'center',
    overflow: 'hidden',
    isolation: 'isolate',
    position: 'fixed',
    top: 0,
    left: 0,
    padding: '150px 0',
    boxSizing: 'initial',
    transform: 'translate(0, -50%)',
    WebkitMaskImage:
      'radial-gradient(circle, rgb(0, 0, 0) 0px, rgb(0, 0, 0) 15%, transparent 30%)',
    maskImage:
      'radial-gradient(circle, rgb(0, 0, 0) 0px, rgb(0, 0, 0) 15%, transparent 30%)',

    '&::before, &::after': {
      content: '""',
      position: 'absolute',
      inset: 0,
      backgroundPosition: 'center',
      backgroundSize: `${GRID_SIZE} ${GRID_SIZE}`,
    },

    '&::before': {
      backgroundImage: `linear-gradient(to right, ${baseLineColor} 1px, transparent 1px), linear-gradient(to bottom, ${baseLineColor} 1px, transparent 1px)`,
    },

    '&::after': {
      opacity: 'var(--interactive-grid-opacity)',
      backgroundImage: `linear-gradient(to right, ${activeLineColor} 1px, transparent 1px), linear-gradient(to bottom, ${activeLineColor} 1px, transparent 1px)`,
      transition: 'opacity 120ms ease',
      WebkitMaskImage: `
        radial-gradient(
          circle ${SPOTLIGHT_SIZE} at var(--interactive-grid-x) var(--interactive-grid-y),
          #000 0 28%,
          rgba(0, 0, 0, 0.55) 52%,
          transparent 82%
        )
      `,
      maskImage: `
        radial-gradient(
          circle ${SPOTLIGHT_SIZE} at var(--interactive-grid-x) var(--interactive-grid-y),
          #000 0 28%,
          rgba(0, 0, 0, 0.55) 52%,
          transparent 82%
        )
      `,
    },

    '& .interactive-grid-content': {
      position: 'relative',
      zIndex: 1,
      top: '10%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
  }
}
