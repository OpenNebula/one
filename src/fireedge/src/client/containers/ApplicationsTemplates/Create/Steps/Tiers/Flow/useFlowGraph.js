import { useCallback, useState } from 'react'

import {
  isNode,
  isEdge,
  addEdge,
  removeElements,
  useStoreActions
} from 'react-flow-renderer'

const useFlowGraph = ({ nodeFields, setList }) => {
  const [flow, setFlow] = useState([])
  const setSelectedElements = useStoreActions(
    actions => actions.setSelectedElements
  )

  const getParents = (currentFlow, childId) =>
    currentFlow
      .filter(isEdge)
      .filter(({ target }) => childId === target)
      .map(({ source }) => source)

  const getList = currentFlow =>
    currentFlow?.filter(isNode)?.map(({ data: nodeData, position }) =>
      Object.keys(nodeData)
        .filter(key => nodeFields.includes(key))
        .reduce(
          (res, key) => ({
            ...res,
            [key]: nodeData[key],
            parents: getParents(currentFlow, nodeData.id),
            position
          }),
          {}
        )
    )

  const handleRefreshFlow = useCallback((data, extraItemProps) => {
    setFlow(
      data?.reduce(
        (res, { position, parents, id, ...item }) => [
          ...res,
          {
            id,
            type: 'tier',
            position,
            data: { id, ...item, ...extraItemProps({ id }) }
          },
          ...(parents?.map(parent => ({
            id: `edge__${id}__${parent}`,
            source: parent,
            target: id,
            animated: true
          })) ?? [])
        ],
        []
      )
    )
  }, [])

  const updateList = newFlow => {
    const list = getList(newFlow)
    setList(list)
  }

  const handleRemoveElements = elements => {
    const newFlow = removeElements(elements, flow)
    updateList(newFlow)
  }

  const handleConnect = params => {
    const newFlow = addEdge({ ...params, animated: true }, flow)
    updateList(newFlow)
  }

  const handleUpdatePosition = (_, node) => {
    const newFlow = flow.map(element =>
      element.id === node.id ? node : element
    )
    updateList(newFlow)
  }

  const handleSelectAll = useCallback(() => {
    const nodes = flow.filter(isNode)
    setSelectedElements(nodes.map(({ id, type }) => ({ id, type })))
  }, [flow])

  return {
    flow,
    handleRefreshFlow,
    handleRemoveElements,
    handleConnect,
    handleUpdatePosition,
    handleSelectAll
  }
}

export default useFlowGraph
