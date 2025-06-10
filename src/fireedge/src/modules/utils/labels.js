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

import { RESOURCE_NAMES, LABEL_DELIMITER } from '@ConstantsModule'

/**
 * @param {string} labelString - Double encoded JSON string
 * @returns {object} - JSON object
 */
export const parseLabels = (labelString) => {
  try {
    return JSON.parse(JSON.parse(labelString))
  } catch {
    try {
      return Object.fromEntries(
        labelString.split(',').map((lbl) => [`$${lbl}`, {}])
      )
    } catch {
      return labelString
    }
  }
}

/**
 * @param {object} params - Params
 * @returns {object} - Labels base state
 */
export const buildLabelTreeState = (params) => {
  const {
    user: { ID: uId },
    isOneAdmin,
    groups,
    labels,
    selectedRows,
    resourceType,
  } = params

  const selectedRowIds = new Set(
    selectedRows?.map(({ original }) => original?.ID)
  )

  const adminGroupNames = new Set(
    groups
      ?.filter((group) => [].concat(group?.ADMINS?.ID).includes(uId))
      ?.map((group) => group?.NAME)
  )

  const createMetadata = ({ expanded = false, isEditable = false }) => ({
    children: {},
    expanded,
    selected: false,
    indeterminate: false,
    ids: [],
    isEditable,
  })

  let treeRoot = null

  const walk = (node, isRoot = true, nodePath = [], currentResult = {}) => {
    if (isRoot) {
      treeRoot = currentResult
    }
    for (const [nodeKey, currentNode] of Object.entries(node)) {
      const isPlainObject =
        typeof currentNode === 'object' &&
        currentNode !== null &&
        !Array.isArray(currentNode)

      if (!isPlainObject) {
        currentResult[nodeKey] = currentNode // Assign and skip, this is a resource node
        continue
      }

      const path = [...nodePath, nodeKey]

      const isUserEditable = path?.[0] === 'user'
      const isGroupEditable =
        isOneAdmin || (path?.[0] === 'group' && adminGroupNames?.has(path?.[1]))

      const isEditable = isUserEditable || isGroupEditable

      // Always expand root nodes or if we have no selected rows
      const expanded = isRoot || selectedRowIds?.size <= 0

      const nodeMeta = createMetadata({ expanded, isEditable })
      currentResult[nodeKey] = nodeMeta

      const resourceIdMap = Object.fromEntries(
        Object.entries(currentNode).filter(
          ([k, v]) =>
            !k.startsWith('$') &&
            Object.values(RESOURCE_NAMES).includes(k) &&
            Array.isArray(v)
        )
      )

      const matchingResourceIds =
        resourceIdMap?.[resourceType]?.filter((id) =>
          selectedRowIds?.has(id)
        ) ?? []

      nodeMeta.ids = resourceIdMap

      if (matchingResourceIds?.length > 0) {
        nodeMeta.selected = true
        nodeMeta.expanded = true

        // Expand ancestors if current node is expanded
        path.slice(0, -1).reduce((acc, segment) => {
          const next = acc?.[segment]
          if (next) next.expanded = true

          return next?.children
        }, treeRoot)

        if (matchingResourceIds.length !== selectedRowIds.size) {
          nodeMeta.indeterminate = true
        }
      }

      Object.values(RESOURCE_NAMES).forEach((r) => delete currentNode[r])

      walk(currentNode, false, path, nodeMeta.children)
    }

    return currentResult
  }

  const parsedTree = walk(labels)

  return {
    ...parsedTree,
    __info: {
      uId,
      resourceType,
      rowIds: [...selectedRowIds],
    },
  }
}

/**
 * @param {object} labelString - JSON object
 * @returns {string} - Double encoded JSON string
 */
export const encodeLabels = (labelString) =>
  JSON.stringify(JSON.stringify(labelString))

/**
 * Extracts resource labels from a nested label structure.
 *
 * @param {object} labels - Root label object with user and group keys.
 * @param {string} resourceId - Resource ID to match.
 * @param {string} resourceType - Resource type to match.
 * @param {boolean} unified - If true, return a unified label list.
 * @param {string} delimiter - Label path delimiter
 * @returns {object|string[]} - Object with user/group keys or unified list.
 */
export const getResourceLabels = (
  labels,
  resourceId,
  resourceType,
  unified = false,
  delimiter = LABEL_DELIMITER
) => {
  const userLabels = new Set()
  const groupLabelsMap = new Map()

  const walk = (node, path = [], type) => {
    if (!node || typeof node !== 'object') return

    for (const [key, value] of Object.entries(node)) {
      if (['__proto__', 'constructor', 'prototype'].includes(key)) continue
      const newPath = [...path, key]

      if (Array.isArray(value)) {
        if (key === resourceType && value.includes(resourceId)) {
          const labelPath = path.join(delimiter)
          if (type === 'user') {
            userLabels.add(labelPath)
          } else if (type === 'group') {
            const group = path[0]
            if (!group) continue
            const set = groupLabelsMap.get(group) ?? new Set()
            set.add(labelPath)
            groupLabelsMap.set(group, set)
          }
        }
      } else {
        walk(value, newPath, type)
      }
    }
  }

  for (const [type, subtree] of Object.entries(labels ?? {})) {
    if (['user', 'group'].includes(type)) {
      walk(subtree, [], type)
    }
  }

  if (unified) {
    return [
      ...new Set([
        ...userLabels,
        ...[...groupLabelsMap.values()].flatMap((s) => [...s]),
      ]),
    ]
  }

  return {
    user: [...userLabels],
    group: Object.fromEntries([...groupLabelsMap].map(([k, v]) => [k, [...v]])),
  }
}
