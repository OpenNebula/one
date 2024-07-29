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
import { memo, useCallback, JSXElementConstructor } from 'react'
import PropTypes from 'prop-types'

import {
  Handle,
  useStoreState,
  getOutgoers,
  addEdge,
} from 'react-flow-renderer'

import { TierCard } from 'client/components/Cards'

/**
 * Custom Node component
 *
 * @param {object} props - Props
 * @param {object} props.data - Node values
 * @param {Function} props.selected - If `true`, the node is selected
 * @returns {JSXElementConstructor} Node component
 */
const CustomNode = memo(({ data, selected }) => {
  const { tier, handleEdit } = data
  const elements = useStoreState((state) => state.elements)
  const nodes = useStoreState((state) => state.nodes)

  /**
   * Algorithm to detect if a sequence of vertices starting
   * and ending at the same vertex.
   */
  const detectCycleUtil = useCallback(
    (node, elementsTemp, visited, recStack) => {
      const { id: nodeId } = node.data

      if (!visited[nodeId]) {
        visited[nodeId] = true
        recStack[nodeId] = true

        const children = getOutgoers(node, elementsTemp)

        for (let index = 0; index < children.length; index += 1) {
          const child = children[index]
          const { id: childId } = child.data
          if (
            !visited[childId] &&
            detectCycleUtil(child, elementsTemp, visited, recStack)
          ) {
            return true
          } else if (recStack[childId]) {
            return true
          }
        }
      }

      recStack[nodeId] = false

      return false
    },
    []
  )

  /**
   * Detect if the new link is a cycle.
   * If `true`, don't allow it.
   *
   * @param {{ source: string, target: string }} params - Edge of 2 Nodes
   * @constant {object} visited - List of checked Nodes
   * @constant {object} rectStack - Temporal list of Nodes
   * @returns {boolean} Returns `true` if the edge is a cycle
   */
  const detectCycle = useCallback(
    (params) => {
      const elementsTemp = addEdge(params, elements)
      const visited = {}
      const recStack = {}

      for (let index = 0; index < nodes.length; index += 1) {
        const node = nodes[index]
        if (detectCycleUtil(node, elementsTemp, visited, recStack)) {
          return false
        }
      }

      return true
    },
    [nodes, elements, detectCycleUtil]
  )

  /**
   * Validate the connection with other Node
   *
   * @param {string} source - Node id
   * @param {string} target - Node id
   */
  const isValidConnection = useCallback(
    ({ source, target }) =>
      source !== target ? detectCycle({ source, target }) : false,
    [detectCycle]
  )

  return (
    <>
      <TierCard
        value={tier}
        handleEdit={handleEdit}
        cardProps={{
          elevation: selected ? 6 : 1,
          style: { width: 300 },
        }}
      />
      <Handle
        type="target"
        position="top"
        isValidConnection={isValidConnection}
      />
      <Handle
        type="source"
        position="bottom"
        isValidConnection={isValidConnection}
      />
    </>
  )
})

CustomNode.propTypes = {
  data: PropTypes.objectOf(PropTypes.any),
  selected: PropTypes.bool,
}

CustomNode.defaultProps = {
  data: {},
  selected: false,
}

CustomNode.displayName = 'CustomFlowNode'

export default CustomNode
