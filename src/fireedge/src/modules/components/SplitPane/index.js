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
import PropTypes from 'prop-types'
import { Children, ReactElement, useCallback, useEffect, useRef } from 'react'

import { Divider, styled } from '@mui/material'
import Split, { SplitOptions } from 'split-grid'

const Gutter = styled(Divider)(({ theme, direction = 'row' }) => ({
  position: 'relative',
  cursor: `${direction}-resize`,
  height: 8,
  marginBlock: '1em',
  background: `linear-gradient(
    to right,
    transparent,
    ${theme.palette.divider},
    transparent
  )`,
  '&:after': {
    content: "''",
    position: 'absolute',
    zIndex: 1,
    left: '50%',
    width: 8,
    height: 8,
    transform: 'rotate(45deg)',
    backgroundColor: theme.palette.action.active,
  },
}))

/**
 * @typedef SplitGridHook
 * @property {function():object} getGridProps - Function to get grid props
 * @property {ReactElement} GutterComponent - Gutter component
 */

/**
 * Hook to create a split pane with a divider between the two panes.
 *
 * @param {SplitOptions} options - Options to configure the split pane
 * @returns {SplitGridHook} Hook functions to element grid and gutter
 */
const useSplitGrid = (options) => {
  const {
    columnMinSizes,
    rowMinSizes,
    columnMaxSizes,
    rowMaxSizes,
    gridTemplateColumns,
    gridTemplateRows,
  } = options

  const split = useRef({})

  useEffect(() => {
    split.current = Split(options)

    return () => split.current.destroy()
  }, [columnMinSizes, rowMinSizes, columnMaxSizes, rowMaxSizes])

  const getGridProps = useCallback(
    () => ({
      display: 'grid',
      height: 1, // 100%
      gridTemplateColumns,
      gridTemplateRows,
    }),
    [gridTemplateColumns, gridTemplateRows]
  )

  const GutterComponent = useCallback(
    ({ direction, track }) => {
      const handleDragStart = (e) => {
        split.current?.handleDragStart(e, direction, track)
      }

      return (
        <Gutter
          key={`gutter-${direction}-${track}`}
          className="gutter"
          direction={direction}
          track={track}
          onMouseDown={handleDragStart}
          onTouchStart={handleDragStart}
        />
      )
    },
    [split.current?.handleDragStart]
  )

  return { getGridProps, GutterComponent }
}

/**
 * @param {SplitOptions} props - Component props
 * @param {Function|ReactElement} [props.children] - Child components
 * @returns {ReactElement|function(SplitGridHook):ReactElement} Split pane component
 */
const SplitGrid = ({ children, ...options }) => {
  const hook = useSplitGrid(options)

  if (!children) return null
  if (typeof children === 'function') return children(hook)

  return !(Children.count(children) === 0) ? Children.only(children) : null
}

SplitGrid.propTypes = {
  children: PropTypes.oneOfType([PropTypes.func, PropTypes.element]),
  options: PropTypes.object,
}

export { Gutter, useSplitGrid }

export default SplitGrid
