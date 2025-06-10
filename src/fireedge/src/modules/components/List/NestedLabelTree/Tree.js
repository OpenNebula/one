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
import { STYLE_BUTTONS, T } from '@ConstantsModule'
import { useAuth } from '@FeaturesModule'
import SubmitButton from '@modules/components/FormControl/SubmitButton'
import { TreeView } from '@mui/lab'
import { Box, Stack } from '@mui/material'
import PropTypes from 'prop-types'
import { Component, useMemo } from 'react'
import { getExpandedNodes } from '@modules/components/List/NestedLabelTree/utils'
import { RenderTree } from '@modules/components/List/NestedLabelTree/SubTree'
import { useLabelTree } from '@modules/components/List/NestedLabelTree/reducer'
import { LabelTreeSearch } from '@modules/components/List/NestedLabelTree/Search'
import SmartActionButton from '@modules/components/List/NestedLabelTree/SmartActionButton'
import {
  handleNodeToggle,
  useLabelMutations,
} from '@modules/components/List/NestedLabelTree/handlers'
import { Expand, Collapse } from 'iconoir-react'

/**
 * Component for displaying a nested label tree.
 *
 * @param {object} root0 - Component props
 * @param {Array} root0.selectedRows - Selected table rows
 * @param {string} root0.resourceType - Resource type being rendered
 * @param {boolean} root0.enableAddDialog - Enables add new label button
 * @param {boolean} root0.enableLabelModify - Enables label add/remove buttons
 * @param {boolean} root0.renderResources - Render resources labels are applied to
 * @param {boolean} root0.disableSelect - Disable lable selection
 * @param {Array} root0.filters - Current table filters
 * @param {Function} root0.setFilter - Set table filters
 * @param {Function} root0.resetFilter - Reset table filters
 * @returns {Component} - Nested tree view of labels
 */
const NestedLabelTree = ({
  selectedRows = [],
  resourceType,
  renderResources = false,
  disableSelect = false,
  enableAddDialog = false,
  enableLabelModify = false,
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
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '50vh',
      }}
    >
      <Box
        sx={{
          position: 'sticky',
          top: 0,
          paddingBottom: 1,
        }}
      >
        <LabelTreeSearch
          treeState={treeState}
          onMatch={(path) => setExpandedPath(path)}
        />
        <Stack direction="row" spacing={1} pl={1}>
          <SubmitButton
            data-cy={'expand-all'}
            icon={<Expand />}
            onClick={(e) => {
              e.stopPropagation()
              setExpandedAll(true)
            }}
            importance={STYLE_BUTTONS.IMPORTANCE.SECONDARY}
            label={T.Expand}
            size={STYLE_BUTTONS.SIZE.MEDIUM}
            type={STYLE_BUTTONS.TYPE.FILLED}
          />
          <SubmitButton
            data-cy={'collapse-all'}
            icon={<Collapse />}
            onClick={(e) => {
              e.stopPropagation()
              setExpandedAll(false)
            }}
            importance={STYLE_BUTTONS.IMPORTANCE.SECONDARY}
            label={T.Collapse}
            size={STYLE_BUTTONS.SIZE.MEDIUM}
            type={STYLE_BUTTONS.TYPE.FILLED}
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
        sx={{
          flexGrow: 1,
          overflowY: 'auto',
        }}
      >
        <TreeView
          expanded={expandedNodes}
          data-cy={'labels-tree'}
          onNodeToggle={(e) => handleNodeToggle(e, toggleExpanded)}
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
  enableAddDialog: PropTypes.bool,
  enableLabelModify: PropTypes.bool,
  renderResources: PropTypes.bool,
  disableSelect: PropTypes.bool,
  filters: PropTypes.array,
  setFilter: PropTypes.func,
  resetFilter: PropTypes.func,
}

export default NestedLabelTree
