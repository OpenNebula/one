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

import {
  Component,
  forwardRef,
  useMemo,
  isValidElement,
  createElement,
  Children,
  useEffect,
  useRef,
} from 'react'
import PropTypes from 'prop-types'
import {
  List as MUIList,
  Typography,
  Box,
  Stack,
  useTheme,
} from '@mui/material'
import { getStyles } from '@modules/componentsv2/primitives/Lists/Default/styles'
import { SkeletonLoading } from '@modules/componentsv2/primitives/Loaders'
import { v4 as uuidv4 } from 'uuid'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useTranslation } from '@ProvidersModule'

/**
 * @param {object} opts - Params
 * @returns {Component} - Custom MUI List component
 */
export const List = forwardRef(
  (
    {
      type = 'ordered',
      title = '',
      children,
      sorter = (arr) => [...arr].sort((a, b) => a - b),
      isRowIndicatorDisabled = false,
      isLoading = false,
      skeletonRows = 5,
      getItemId,
      onVisibleItemIdsChange,
      ...opts
    },
    ref
  ) => {
    const { translate } = useTranslation()
    const muiTheme = useTheme()
    const skeletonHeight = muiTheme.scale[1600]
    const parentRef = useRef(null)
    const listId = useMemo(() => uuidv4(), [])
    const isOrdered = type === 'ordered'

    const renderElement = (element) =>
      isValidElement(element)
        ? element
        : typeof element === 'function'
        ? createElement(element)
        : element

    const mChildren = useMemo(() => {
      if (isLoading) return Array.from({ length: skeletonRows })
      const arr = Children.toArray(children)

      return isOrdered ? sorter(arr) : arr
    }, [children, isLoading, skeletonRows])

    const virtualizer = useVirtualizer({
      count: mChildren?.length,
      getScrollElement: () => parentRef.current,
      estimateSize: () => (isLoading ? skeletonHeight : 64),
      overscan: 5,
    })
    const visibleItemIds = isLoading
      ? []
      : virtualizer
          .getVirtualItems()
          .map(({ index }) => getItemId?.(mChildren[index]))
          .filter((id) => id !== undefined && id !== null)
    const visibleItemIdsKey = visibleItemIds.join(',')

    useEffect(() => {
      if (!onVisibleItemIdsChange) return

      onVisibleItemIdsChange(visibleItemIds)
    }, [onVisibleItemIdsChange, visibleItemIdsKey])

    return (
      <Box sx={(theme) => getStyles({ theme, type })}>
        {title && (
          <Typography className="list-header">{translate(title)}</Typography>
        )}
        <MUIList className="list-container" ref={parentRef}>
          <Box
            className="list-virtual-container"
            style={{ height: virtualizer.getTotalSize() }}
          >
            {virtualizer.getVirtualItems().map((virtualItem) => (
              <Stack
                direction="row"
                key={`${listId}-item-${virtualItem.index}`}
                className="list-item"
                ref={isLoading ? null : virtualizer.measureElement}
                data-index={virtualItem.index}
                style={{ transform: `translateY(${virtualItem.start}px)` }}
              >
                {!isRowIndicatorDisabled && (
                  <Box className="row-indicator">
                    {isOrdered && !isLoading ? virtualItem.index + 1 : null}
                  </Box>
                )}
                <SkeletonLoading
                  loading={isLoading}
                  width="100%"
                  height={skeletonHeight}
                  borderRadius="none"
                >
                  {renderElement(mChildren[virtualItem.index])}
                </SkeletonLoading>
              </Stack>
            ))}
          </Box>
        </MUIList>
      </Box>
    )
  }
)

List.propTypes = {
  type: PropTypes.string,
  title: PropTypes.string,
  isRowIndicatorDisabled: PropTypes.bool,
  children: PropTypes.array,
  sorter: PropTypes.func,
  isLoading: PropTypes.bool,
  skeletonRows: PropTypes.number,
  getItemId: PropTypes.func,
  onVisibleItemIdsChange: PropTypes.func,
}

List.displayName = 'List'
