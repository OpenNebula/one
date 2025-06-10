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
import { unset } from 'lodash'

/**
 * @param {object} tree - Node tree
 * @returns {Array} - Array of expanded node ids
 */
export const getExpandedNodes = (tree) => {
  const expandedIds = []

  const walk = (nodes, path = []) => {
    if (typeof nodes !== 'object') return

    for (const [key, node] of Object.entries(nodes)) {
      const currentPath = [...path, key]
      const nodeId = currentPath?.join('.')

      if (node?.expanded) {
        expandedIds.push(nodeId)
      }

      if (node?.children && Object.keys(node?.children)?.length > 0) {
        walk(node.children, currentPath)
      }
    }
  }
  walk(tree)

  return expandedIds
}

/**
 * @param {object} tree - The label tree object
 * @param {string} key - The property to update on each node
 * @param {*} value - Updates value to the property
 */
export const updateAllNodes = (tree, key, value) => {
  Object.values(tree).forEach((node) => {
    if (!Object.hasOwn(node, key)) return
    node[key] = value

    if (node.children) {
      updateAllNodes(node.children, key, value)
    }
  })
}

/**
 * @param {object} tree - Base label tree state
 * @param {string} nodeId - Dot-notated path to the node
 */
export const expandByPath = (tree, nodeId) => {
  if (!tree || !nodeId) return

  const [head, ...tail] = nodeId.split('.')
  const currentNode = tree[head]
  if (!currentNode) return

  currentNode.expanded = true

  if (tail.length > 0 && currentNode.children) {
    expandByPath(currentNode.children, tail.join('.'))
  }
}

/**
 * @param {object} tree - Base state
 * @param {string} nodeId - Dot-separated path to the node
 * @returns {object|null} - Target node or null if not found
 */
export const getNodeById = (tree, nodeId) =>
  nodeId.split('.').reduce((acc, key, index) => {
    if (!acc) return null

    return index === 0 ? acc[key] : acc.children?.[key] ?? null
  }, tree)

/**
 * @param {object} tree - The nested label tree
 * @param {string} term - Search term
 * @param {string[]} path - Internal recursive path (default empty)
 * @returns {string[] | null} - Path to the matching node, or null
 */
export const findNodePathByLabel = (tree, term, path = []) => {
  for (const [key, node] of Object.entries(tree)) {
    const currentPath = [...path, key]
    const normalizedKey = key?.replace(/[^a-zA-Z0-9 ]/g, '')?.toLowerCase()

    if (normalizedKey?.includes(term?.trim()?.toLowerCase())) return currentPath

    if (node.children) {
      const match = findNodePathByLabel(node.children, term, currentPath)
      if (match) return match
    }
  }

  return null
}

/**
 * @param {Function} event - Click event
 * @returns {string} - Node id
 */
export const getNodeIdFromEvent = (event) => {
  let el = event.target
  while (el && !el.dataset.nodeid) {
    el = el.parentElement
  }

  if (!el) {
    return null
  }

  return el.dataset.nodeid
}

/**
 * @param {object} current - Current node
 * @param {object} initial - Initial node
 * @param {Array} path - Internal path tracking
 * @returns {boolean} - True if diff
 */
export const getModifiedPaths = (current, initial, path = []) => {
  let modified = []

  for (const [key, nodeA] of Object.entries(current)) {
    const nodeB = initial?.[key]
    const currentPath = [...path, key]
    const pathStr = currentPath.join('.')

    if (!nodeB) {
      modified.push(pathStr)
      continue
    }

    const changed =
      nodeA?.selected !== nodeB?.selected ||
      nodeA?.indeterminate !== nodeB?.indeterminate

    if (changed) modified.push(pathStr)

    const childrenA = nodeA?.children ?? {}
    const childrenB = nodeB?.children ?? {}

    modified = [
      ...modified,
      ...getModifiedPaths(childrenA, childrenB, currentPath),
    ]
  }

  return modified
}

/**
 * @param {object} node - Current label tree node
 * @param {string} resourceType - Table resource type
 * @param {Array} rowIds - Selected row ids
 * @returns {object} - Transformed tree
 */
export const transformTreeMetadata = (node, resourceType, rowIds) =>
  Object.fromEntries(
    Object.entries(node)
      .filter(([key]) => key !== '__info')
      .map(([key, value]) => {
        const children =
          value?.children && Object.keys(value.children).length > 0
            ? transformTreeMetadata(value.children, resourceType, rowIds)
            : {}

        const allIds = { ...(value?.ids ?? {}) }

        const existing = new Set(allIds[resourceType] ?? [])

        if (!value.indeterminate) {
          if (value?.selected) {
            rowIds?.forEach((rId) => existing.add(rId))
          } else {
            rowIds?.forEach((rId) => existing.delete(rId))
          }
        }

        if (existing.size > 0) {
          allIds[resourceType] = [...existing]
        } else {
          delete allIds[resourceType]
        }

        return [key, { ...children, ...allIds }]
      })
  )

/**
 * @param {object} tree - Base state
 * @param {Array} path - Path to new label
 * @returns {object|null} - Modified tree
 */
export const createLabelPath = (tree, path) => {
  if (path.length === 0) return tree

  const [key, ...restPath] = path

  const node = tree[key] ?? {
    children: {},
    expanded: false,
    selected: false,
    indeterminate: false,
    ids: {},
    isEditable: true,
  }

  if (restPath.length === 0) {
    return {
      ...tree,
      [key]: node,
    }
  }

  return {
    ...tree,
    [key]: {
      ...node,
      children: createLabelPath(node.children || {}, restPath),
    },
  }
}

/**
 * @param {object} tree - Base state
 * @returns {object} - Stripped tree
 */
export const stripTreeMetadata = (tree) => {
  const cloneTree = structuredClone(tree)

  const strip = (node) =>
    Object.fromEntries(
      Object.entries(node)
        .filter(([key]) => key !== '__info')
        .map(([key, value]) => {
          const children = value?.children ? strip(value.children) : {}

          const ids = value?.ids ?? {}

          return [key, { ...children, ...ids }]
        })
    )

  return strip(cloneTree)
}

/**
 * @param {object} formData - New label data
 * @param {object} tree - Base state
 * @returns {object} - API Data
 */
export const formatAddLabel = (formData, tree) => {
  const { NAME, NEST, PARENT, LABEL_TYPE } = formData

  try {
    if (!NAME) throw new Error('Missing label name')

    const path = [LABEL_TYPE]
    if (NEST && PARENT) {
      path.push(...PARENT.split('/'))
    }
    path.push(NAME)

    const updatedTree = createLabelPath(tree, path)
    const transformedTree = stripTreeMetadata(updatedTree)

    const getGroupName = () => PARENT?.split('/')?.[0] ?? ''

    const data =
      LABEL_TYPE === 'group'
        ? transformedTree?.group?.[getGroupName()]
        : transformedTree?.user

    return {
      type: LABEL_TYPE,
      data,
      groupName: getGroupName(),
      modifiedTree: transformedTree, // Used to update reducer state
    }
  } catch (err) {
    console.error('Failed to add label: ', err)

    return null
  }
}

/**
 * @param {object} tree - Base state
 * @returns {Array} - Flattened array of labels
 */
export const labelsToArray = (tree) => {
  const result = {}
  const walk = (nodes, path = []) => {
    for (const [key, node] of Object.entries(nodes)) {
      const currentPath = [...path, key]
      const subPath = currentPath?.slice(1)?.join('/')

      if (!Array.isArray(node)) {
        if (subPath) {
          ;(result[currentPath[0]] ??= []).push(subPath)
        }
      }

      if (
        node &&
        typeof node === 'object' &&
        !Array.isArray(node) &&
        Object.keys(node)?.length > 0
      ) {
        if (node?.children && typeof node?.children === 'object') {
          walk(node.children, currentPath)
        } else {
          walk(node, currentPath)
        }
      }
    }
  }
  walk(tree)

  return result
}

/**
 * @param {object} tree - Base state
 * @param {string} path - "." separated path
 * @returns {object} - Cloned tree
 */
export const removeNode = (tree, path) => {
  const cloneTree = structuredClone(tree)

  unset(cloneTree, path)

  return cloneTree
}
