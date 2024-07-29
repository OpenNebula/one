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
/* eslint-disable jsdoc/require-jsdoc */
import { useCallback, useState } from 'react'

import {
  isNode,
  isEdge,
  addEdge,
  removeElements,
  useStoreActions,
} from 'react-flow-renderer'

const useFlowGraph = ({ nodeFields, setList }) => {
  const [flow, setFlow] = useState([])
  const setSelectedElements = useStoreActions(
    (actions) => actions.setSelectedElements
  )

  const getParents = (currentFlow, childId) =>
    currentFlow
      .filter(isEdge)
      .filter(({ target }) => childId === target)
      .map(({ source }) => source)

  const getList = (currentFlow) =>
    currentFlow?.filter(isNode)?.map(({ data: nodeData, position }) =>
      Object.keys(nodeData)
        .filter((key) => nodeFields.includes(key))
        .reduce(
          (res, key) => ({
            ...res,
            [key]: nodeData[key],
            parents: getParents(currentFlow, nodeData.id),
            position,
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
            data: { id, ...item, ...extraItemProps({ id }) },
          },
          ...(parents?.map((parent) => ({
            id: `edge__${id}__${parent}`,
            source: parent,
            target: id,
            animated: true,
          })) ?? []),
        ],
        []
      )
    )
  }, [])

  const updateList = (newFlow) => {
    const list = getList(newFlow)
    setList(list)
  }

  const handleRemoveElements = (elements) => {
    const newFlow = removeElements(elements, flow)
    updateList(newFlow)
  }

  const handleConnect = (params) => {
    const newFlow = addEdge({ ...params, animated: true }, flow)
    updateList(newFlow)
  }

  const handleUpdatePosition = (_, node) => {
    const newFlow = flow.map((element) =>
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
    handleSelectAll,
  }
}

export default useFlowGraph
