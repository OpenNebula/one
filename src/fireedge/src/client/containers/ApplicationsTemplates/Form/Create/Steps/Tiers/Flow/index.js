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
import { memo, useEffect, useMemo, ReactElement } from 'react'
import PropTypes from 'prop-types'

import makeStyles from '@mui/styles/makeStyles'
import {
  AddCircledOutline as AddIcon,
  Selection as SelectAllIcon,
} from 'iconoir-react'

import ReactFlow, { Background } from 'react-flow-renderer'
import { useFormContext } from 'react-hook-form'

import SpeedDial from 'client/components/SpeedDial'
import { STEP_ID as TIER_ID } from 'client/containers/ApplicationsTemplates/Form/Create/Steps/Tiers'

import CustomNode from './CustomNode'
import useFlowGraph from './useFlowGraph'

const NOT_KEY_CODE = -1

const useStyles = makeStyles(() => ({
  root: {
    '& .react-flow__handle': {
      width: 10,
      height: 10,
      backgroundColor: 'rgba(0,0,0,0.2)',
      '&-bottom': {
        bottom: -6,
      },
      '&-connecting': {
        backgroundColor: '#ff6060',
      },
      '&-valid': {
        backgroundColor: '#55dd99',
      },
    },
  },
}))

/**
 * Create a flow node-based graph
 *
 * @param {object} props - Props
 * @param {Array} props.dataFields - List of keys
 * @param {Function} props.handleCreate - Create a new Node
 * @param {Function} props.handleEdit - Edit a current Node
 * @param {Function} props.handleSetData - Set new list of nodes
 * @returns {ReactElement} ReactFlow component
 */
const Flow = memo(({ dataFields, handleCreate, handleEdit, handleSetData }) => {
  const { watch } = useFormContext()
  const classes = useStyles()
  const {
    flow,
    handleRefreshFlow,
    handleRemoveElements,
    handleConnect,
    handleUpdatePosition,
    handleSelectAll,
  } = useFlowGraph({ nodeFields: dataFields, setList: handleSetData })

  useEffect(() => {
    handleRefreshFlow(watch(TIER_ID), ({ id }) => ({
      handleEdit: () => handleEdit(id),
    }))
  }, [watch])

  const actions = useMemo(
    () => [
      {
        icon: <AddIcon />,
        name: 'Add',
        handleClick: handleCreate,
      },
      {
        icon: <SelectAllIcon />,
        name: 'Select all',
        handleClick: handleSelectAll,
      },
    ],
    [handleCreate, handleSelectAll]
  )

  return (
    <ReactFlow
      className={classes.root}
      elements={flow}
      nodeTypes={{ tier: CustomNode }}
      onConnect={handleConnect}
      onNodeDragStop={handleUpdatePosition}
      onElementsRemove={handleRemoveElements}
      selectionKeyCode={NOT_KEY_CODE}
    >
      <SpeedDial actions={actions} />
      <Background color="#aaa" gap={16} />
    </ReactFlow>
  )
})

Flow.displayName = 'FlowGraph'

Flow.propTypes = {
  dataFields: PropTypes.arrayOf(PropTypes.string),
  handleCreate: PropTypes.func,
  handleEdit: PropTypes.func,
  handleSetData: PropTypes.func,
}

Flow.defaultProps = {
  dataFields: [],
  handleCreate: undefined,
  handleEdit: undefined,
  handleSetData: undefined,
}

export default Flow
