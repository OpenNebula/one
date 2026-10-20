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

import { Component, ReactNode, forwardRef, useMemo, useState } from 'react'
import PropTypes from 'prop-types'
import { Box } from '@mui/material'
import { NavArrowDown, NavArrowRight } from 'iconoir-react'
import { TreeItem } from '@modules/components/primitives/Tree/Default/item'
import { getStyles } from '@modules/components/primitives/Tree/Default/styles'

/**
 * Collapsible tree for nested data.
 *
 * @param {object} props - Component properties
 * @param {Array} props.items - Nested tree items
 * @param {string[]} props.expandedIds - Expanded item ids (controlled)
 * @param {string[]} props.defaultExpandedIds - Initially expanded item ids
 * @param {string} props.selectedId - Selected item id (controlled)
 * @param {string} props.defaultSelectedId - Initially selected item id
 * @param {Function} props.onExpandedChange - Called when expansion changes
 * @param {Function} props.onSelectedChange - Called when selection changes
 * @param {Function} props.renderLabel - Custom item label renderer
 * @param {Function} props.renderIcon - Custom item icon renderer
 * @param {boolean} props.treeMarker - Displays a tree marker for items
 * @param {boolean} props.showCount - Displays direct and additional descendant resource counts
 * @param {ReactNode} props.expandIcon - Icon for collapsed parent items
 * @param {ReactNode} props.collapseIcon - Icon for expanded parent items
 * @param {boolean} props.disableSelection - Disables item selection
 * @returns {Component} Collapsible tree
 */
export const Tree = forwardRef(
  (
    {
      items = [],
      expandedIds,
      defaultExpandedIds = [],
      selectedId,
      defaultSelectedId,
      onExpandedChange,
      onSelectedChange,
      renderLabel,
      renderIcon,
      treeMarker = false,
      showCount = false,
      expandIcon = <NavArrowRight />,
      collapseIcon = <NavArrowDown />,
      disableSelection = false,
      ...opts
    },
    ref
  ) => {
    const [uncontrolledExpandedIds, setUncontrolledExpandedIds] = useState(() =>
      defaultExpandedIds.map(String)
    )
    const [uncontrolledSelectedId, setUncontrolledSelectedId] = useState(() =>
      defaultSelectedId == null ? undefined : String(defaultSelectedId)
    )

    const currentExpandedIds =
      expandedIds === undefined
        ? uncontrolledExpandedIds
        : expandedIds.map(String)
    const currentSelectedId =
      selectedId === undefined
        ? uncontrolledSelectedId
        : selectedId == null
        ? undefined
        : String(selectedId)
    const expandedIdSet = useMemo(
      () => new Set(currentExpandedIds),
      [currentExpandedIds]
    )
    const resourceCounts = useMemo(() => {
      const counts = new Map()
      const countResources = ({ id, count = 0, children = [] }) => {
        const descendantCount = children.reduce(
          (total, child) => total + countResources(child),
          0
        )

        counts.set(String(id), {
          count,
          descendantCount,
        })

        return count + descendantCount
      }

      if (showCount) {
        items.forEach(countResources)
      }

      return counts
    }, [items, showCount])

    const changeExpanded = (event, nodeId, shouldExpand) => {
      const nextExpandedIds = shouldExpand
        ? [...new Set([...currentExpandedIds, nodeId])]
        : currentExpandedIds.filter((id) => id !== nodeId)

      if (expandedIds === undefined) {
        setUncontrolledExpandedIds(nextExpandedIds)
      }

      onExpandedChange?.(event, nextExpandedIds)
    }

    const handleItemSelect = (event, { disabled }, nodeId) => {
      if (disabled) return

      if (!disableSelection) {
        if (selectedId === undefined) {
          setUncontrolledSelectedId(nodeId)
        }

        onSelectedChange?.(event, nodeId)
      }
    }

    const handleItemExpand = (
      event,
      { hasChildren, isExpanded, disabled },
      nodeId
    ) => {
      if (disabled || !hasChildren) return

      changeExpanded(event, nodeId, !isExpanded)
    }

    const treeItemProps = {
      expandedIds: expandedIdSet,
      selectedId: currentSelectedId,
      renderLabel,
      renderIcon,
      expandIcon,
      collapseIcon,
      disableSelection,
      showCount,
      resourceCounts,
      onItemSelect: handleItemSelect,
      onItemExpand: handleItemExpand,
    }

    return (
      <Box
        component="ul"
        {...opts}
        ref={ref}
        role="tree"
        sx={(theme) => ({ ...getStyles({ theme }) })}
      >
        {items.map((item, itemIndex) => (
          <TreeItem
            key={String(item.id)}
            treeMarker={treeMarker}
            item={item}
            itemIndex={itemIndex}
            siblingCount={items.length}
            tree={treeItemProps}
          />
        ))}
      </Box>
    )
  }
)

Tree.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      label: PropTypes.node.isRequired,
      icon: PropTypes.node,
      disabled: PropTypes.bool,
      children: PropTypes.array,
      count: PropTypes.number,
    })
  ),
  expandedIds: PropTypes.arrayOf(PropTypes.string),
  defaultExpandedIds: PropTypes.arrayOf(PropTypes.string),
  selectedId: PropTypes.string,
  defaultSelectedId: PropTypes.string,
  onExpandedChange: PropTypes.func,
  onSelectedChange: PropTypes.func,
  renderLabel: PropTypes.func,
  renderIcon: PropTypes.func,
  treeMarker: PropTypes.bool,
  showCount: PropTypes.bool,
  expandIcon: PropTypes.node,
  collapseIcon: PropTypes.node,
  disableSelection: PropTypes.bool,
}

Tree.displayName = 'Tree'
