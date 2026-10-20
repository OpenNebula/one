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

import { Component } from 'react'
import PropTypes from 'prop-types'
import { Tooltip } from '@modules/components/primitives/Tooltip'

/**
 * Recursive tree item.
 *
 * @param {object} props - Component properties
 * @param {object} props.item - Item data
 * @param {number} props.itemIndex - Item position between its siblings
 * @param {number} props.siblingCount - Number of items at the current level
 * @param {number} props.level - Current tree level
 * @param {object} props.tree - Tree state and event handlers
 * @param {boolean} props.treeMarker - Displays a tree marker for items
 * @returns {Component} Tree item
 */
export const TreeItem = ({
  item,
  itemIndex,
  siblingCount,
  level = 0,
  tree,
  treeMarker = false,
}) => {
  const {
    expandedIds,
    selectedId,
    renderLabel,
    renderIcon,
    expandIcon,
    collapseIcon,
    disableSelection,
    showCount,
    resourceCounts,
    onItemSelect,
    onItemExpand,
  } = tree
  const { id, label, icon, disabled = false, children = [] } = item
  const nodeId = String(id)
  const { count = 0, descendantCount = 0 } = resourceCounts.get(nodeId) ?? {}
  const hasChildren = children.length > 0
  const isExpanded = expandedIds.has(nodeId)
  const isSelected = selectedId === nodeId
  const context = { level, hasChildren, isExpanded, isSelected, disabled }
  const itemLabel = renderLabel ? renderLabel(item, context) : label
  const itemIcon = renderIcon ? renderIcon(item, context) : icon
  const itemTreeMarker = treeMarker || item?.treeMarker

  return (
    <li
      role="treeitem"
      aria-expanded={hasChildren ? isExpanded : undefined}
      aria-selected={disableSelection ? undefined : isSelected}
      aria-disabled={disabled || undefined}
      aria-level={level + 1}
      aria-posinset={itemIndex + 1}
      aria-setsize={siblingCount}
    >
      <div
        className={`tree-item ${isSelected ? 'selected' : ''} ${
          disabled ? 'disabled' : ''
        } ${hasChildren ? 'has-children' : ''}`}
        style={{ '--tree-level': level }}
        onClick={(event) => {
          event.stopPropagation()
          onItemSelect(event, context, nodeId)
        }}
      >
        <span
          className={`expand-icon ${isExpanded ? 'expanded' : ''}`}
          aria-hidden="true"
          onClick={(event) => {
            if (!hasChildren) {
              return
            }

            event.stopPropagation()
            onItemExpand(event, context, nodeId)
          }}
        >
          {hasChildren && (isExpanded ? collapseIcon : expandIcon)}
        </span>

        <div className="content">
          {itemTreeMarker && <span className="tree-marker" />}
          {itemIcon && <span className="icon">{itemIcon}</span>}
          {itemLabel && (
            <Tooltip title={itemLabel} placement="top">
              <span className="label">{itemLabel}</span>
            </Tooltip>
          )}
        </div>

        {showCount && (
          <span className="tree-count">
            <span>{count}</span>
            {descendantCount > 0 && (
              <span className="descendant-count">+{descendantCount}</span>
            )}
          </span>
        )}
      </div>

      {hasChildren && isExpanded && (
        <ul role="group" className="tree-group">
          {children.map((child, childIndex) => (
            <TreeItem
              key={String(child.id)}
              item={child}
              itemIndex={childIndex}
              siblingCount={children.length}
              level={level + 1}
              tree={tree}
            />
          ))}
        </ul>
      )}
    </li>
  )
}

TreeItem.propTypes = {
  item: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    label: PropTypes.node.isRequired,
    icon: PropTypes.node,
    disabled: PropTypes.bool,
    children: PropTypes.array,
    treeMarker: PropTypes.bool,
    count: PropTypes.number,
  }).isRequired,
  itemIndex: PropTypes.number.isRequired,
  siblingCount: PropTypes.number.isRequired,
  level: PropTypes.number,
  tree: PropTypes.shape({
    expandedIds: PropTypes.instanceOf(Set).isRequired,
    selectedId: PropTypes.string,
    renderLabel: PropTypes.func,
    renderIcon: PropTypes.func,
    expandIcon: PropTypes.node,
    collapseIcon: PropTypes.node,
    disableSelection: PropTypes.bool.isRequired,
    showCount: PropTypes.bool.isRequired,
    resourceCounts: PropTypes.instanceOf(Map).isRequired,
    onItemSelect: PropTypes.func.isRequired,
    onItemExpand: PropTypes.func.isRequired,
  }).isRequired,
  treeMarker: PropTypes.bool,
}

TreeItem.displayName = 'TreeItem'
