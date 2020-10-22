import React, { memo, useCallback } from 'react'
import PropTypes from 'prop-types'

import {
  Handle,
  useStoreState,
  getOutgoers,
  addEdge
} from 'react-flow-renderer'

import { TierCard } from 'client/components/Cards'

const CustomNode = memo(({ data, selected, ...nodeProps }) => {
  const { tier, handleEdit } = data
  const elements = useStoreState(state => state.elements)
  const nodes = useStoreState(state => state.nodes)

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

  const detectCycle = useCallback(
    params => {
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
          style: { minWidth: 200 }
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
  selected: PropTypes.bool
}

CustomNode.defaultProps = {
  data: {},
  selected: false
}

CustomNode.displayName = 'CustomFlowNode'

export default CustomNode
