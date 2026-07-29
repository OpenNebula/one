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
import { STYLE_BUTTONS, T } from '@ConstantsModule'
import { useAuth } from '@FeaturesModule'
import { SubmitButton } from '@ComponentsV2Module'
import { TreeView } from '@mui/lab'
import { Box, Stack } from '@mui/material'
import PropTypes from 'prop-types'
import { Component, useMemo } from 'react'
import { getExpandedNodes } from '@modules/resources/resources/Settings/NestedLabelTree/utils'
import { RenderTree } from '@modules/resources/resources/Settings/NestedLabelTree/SubTree'
import { useLabelTree } from '@modules/resources/resources/Settings/NestedLabelTree/reducer'
import { LabelTreeSearch } from '@modules/resources/resources/Settings/NestedLabelTree/Search'
import SmartActionButton from '@modules/resources/resources/Settings/NestedLabelTree/SmartActionButton'
import {
  handleNodeToggle,
  useLabelMutations,
} from '@modules/resources/resources/Settings/NestedLabelTree/handlers'
import { Expand, Collapse } from 'iconoir-react'

/**
 * Component for displaying a nested label tree.
 *
 * @param {object} root0 - Component props
 * @param {Array} root0.selectedRows - Selected table rows
 * @param {string} root0.resourceType - Resource type being rendered
 * @param {Array} root0.filters - Current table filters
 * @param {Function} root0.setFilter - Set table filters
 * @param {Function} root0.resetFilter - Reset table filters
 * @returns {Component} - Nested tree view of labels
 */
const NestedLabelTree = ({
  selectedRows = [],
  resourceType,
  filters,
  setFilter,
  resetFilter = () => undefined,
  ...params
}) => {
  const {
    state: { __info, ...treeState },
    actions,
    isModified,
    getModifiedPaths,
    resetInitialState,
  } = useLabelTree({ ...useAuth(), selectedRows, resourceType })

  const [{ applyLabels }, { isLoading: applyingLabels }] = useLabelMutations()

  const { setExpandedAll, setExpandedPath, toggleExpanded } = actions

  const expandedNodes = useMemo(() => getExpandedNodes(treeState), [treeState])

  const treeModified = isModified() // Recalculated every render, ON PURPOSE

  return (
    <Box
      sx={(theme) => ({
        display: 'flex',
        flexDirection: 'column',
        gap: `${theme.scale[300]}px`,
        height: 'min(50vh, 560px)',
        minHeight: 320,
        minWidth: 0,
        color: 'text.body',
      })}
    >
      <Box
        sx={(theme) => ({
          display: 'grid',
          gap: `${theme.scale[300]}px`,
          position: 'sticky',
          top: 0,
          zIndex: 1,
          bgcolor: 'surface.primary',
          paddingBottom: `${theme.scale[100]}px`,
        })}
      >
        <LabelTreeSearch
          treeState={treeState}
          onMatch={(path) => setExpandedPath(path)}
        />
        <Stack direction="row" flexWrap="wrap" gap={1}>
          <SubmitButton
            data-cy={'expand-all'}
            iconOnly={<Expand />}
            onClick={(e) => {
              e.stopPropagation()
              setExpandedAll(true)
            }}
            type={STYLE_BUTTONS.TYPE.SECONDARY}
            tooltip={T.Expand}
          />
          <SubmitButton
            data-cy={'collapse-all'}
            iconOnly={<Collapse />}
            onClick={(e) => {
              e.stopPropagation()
              setExpandedAll(false)
            }}
            type={STYLE_BUTTONS.TYPE.SECONDARY}
            tooltip={T.Collapse}
          />
          <SmartActionButton
            treeState={treeState}
            treeModified={treeModified}
            info={__info}
            applyingLabels={applyingLabels}
            applyLabels={applyLabels}
            resetInitialState={resetInitialState}
            getModifiedPaths={getModifiedPaths}
            resourceType={resourceType}
            setFilter={setFilter}
            {...params}
          />
        </Stack>
      </Box>
      <Box
        sx={(theme) => ({
          flexGrow: 1,
          minHeight: 0,
          overflowY: 'auto',
          border: `${theme.borderWidth.sm}px solid ${theme.palette.border.primary}`,
          borderRadius: `${theme.borderRadius['3xl']}px`,
          bgcolor: 'surface.primary',
          padding: `${theme.scale[200]}px`,
        })}
      >
        <TreeView
          expanded={expandedNodes}
          data-cy={'labels-tree'}
          onNodeToggle={(e) => handleNodeToggle(e, toggleExpanded)}
          sx={(theme) => ({
            '& .MuiTreeItem-content': {
              borderRadius: `${theme.borderRadius.lg}px`,
              minHeight: 36,
              paddingRight: `${theme.scale[100]}px`,
            },
            '& .MuiTreeItem-content:hover': {
              bgcolor: 'surface.actionHover4',
            },
            '& .MuiTreeItem-content.Mui-focused': {
              bgcolor: 'surface.focus2',
            },
            '& .MuiTreeItem-iconContainer svg': {
              width: 18,
              height: 18,
            },
            '& .MuiTreeItem-label': {
              minWidth: 0,
              fontSize: 'inherit',
            },
          })}
        >
          <RenderTree baseState={treeState} actions={actions} info={__info} />
        </TreeView>
      </Box>
    </Box>
  )
}

NestedLabelTree.propTypes = {
  selectedRows: PropTypes.array,
  resourceType: PropTypes.string,
  filters: PropTypes.array,
  setFilter: PropTypes.func,
  resetFilter: PropTypes.func,
}

export default NestedLabelTree
