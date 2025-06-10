/* ------------------------------------------------------------------------- *
 * Copyright 2002-2025, OpenNebula Project, OpenNebula Systems               *
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
import { NavArrowRight, NavArrowDown } from 'iconoir-react'
import { TreeItem } from '@mui/lab'
import { Tooltip, Box, Checkbox } from '@mui/material'
import HintIcon from 'iconoir-react/dist/QuestionMarkCircle'
import { T } from '@ConstantsModule'
import { Tr } from '@modules/components/HOC'

const getLabelText = (label, isRoot = false) => {
  const formatLabel = (text) => text?.replace(/[^a-zA-Z0-9 ]/g, '')

  if (isRoot) {
    return label === 'user'
      ? T.UserLabels
      : label === 'group'
      ? T.GroupLabels
      : formatLabel(label)
  } else {
    return formatLabel(label)
  }
}

const getTooltipText = (label) =>
  label === 'user' ? T.UserLabelsConcept : T.GroupLabelsConcept

/**
 * @param {object} props - Props
 * @param {object} props.baseState - Current state of the tree
 * @param {string[]} [props.path=[]] - Current path of keys leading to the node
 * @param {boolean} [props.isRoot=true] - Indicates if this is the root level
 * @param {object} props.actions - Reducer actions for manipulating tree state
 * @param {object} props.info - Tree state info
 * @returns {Component} - An array of rendered TreeItem components
 */
export const RenderTree = ({
  baseState,
  info,
  path = [],
  isRoot = true,
  actions,
}) =>
  Object.entries(baseState).map(([key, node]) => {
    const { rowIds = [] } = info
    const { toggleSelected } = actions
    const currentPath = [...path, key]
    const nodeId = currentPath.join('.')
    const checked = node.selected ?? false
    const indeterminate = node.indeterminate ?? false
    const hasChildren = node.children && Object.keys(node.children).length > 0
    const isEditable = node?.isEditable ?? false
    const isGroupName = path?.[0] === 'group' && path?.length === 1
    const isFilterable = rowIds?.length <= 0

    return (
      <TreeItem
        key={nodeId}
        nodeId={nodeId}
        label={
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              width: '100%',
              overflow: 'hidden',
              ...(isRoot && {
                fontWeight: 'bold',
                borderBottom: '1px solid',
                borderColor: 'divider',
                py: 0.5,
                fontSize: '1.1rem',
              }),
              ...(isGroupName && {
                fontWeight: 500,
                py: 0.5,
              }),
              ...(!isRoot &&
                !isGroupName && {
                  pl: 0.5,
                }),
            }}
            data-nodeid={nodeId}
          >
            {!isRoot && !isGroupName && (isEditable || isFilterable) && (
              <Checkbox
                checked={checked}
                indeterminate={indeterminate}
                onChange={(e) => {
                  e.stopPropagation()
                  toggleSelected(nodeId)
                }}
                size="small"
                sx={{ flexShrink: 0, width: 28 }}
              />
            )}

            {isRoot && (
              <Tooltip arrow title={Tr(getTooltipText(key))}>
                <HintIcon width={18} height={18} style={{ strokeWidth: 1.3 }} />
              </Tooltip>
            )}

            {!isRoot && isGroupName && (
              <Tooltip arrow title={Tr(isEditable ? T.Editable : T.ReadOnly)}>
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    bgcolor: isEditable ? 'primary.main' : 'text.disabled',
                    flexShrink: 0,
                  }}
                />
              </Tooltip>
            )}

            <Box
              sx={{
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                flexGrow: 1,
              }}
            >
              {getLabelText(key, isRoot)}
            </Box>
          </Box>
        }
        expandIcon={hasChildren ? <NavArrowRight /> : null}
        collapseIcon={hasChildren ? <NavArrowDown /> : null}
      >
        {node.children && (
          <RenderTree
            baseState={node.children}
            info={info}
            path={currentPath}
            isRoot={false}
            actions={actions}
          />
        )}
      </TreeItem>
    )
  })
