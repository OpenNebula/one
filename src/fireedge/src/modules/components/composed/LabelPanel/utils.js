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
/* eslint-disable jsdoc/require-param-description, jsdoc/require-param-type, jsdoc/require-returns */

import {
  cleanLabelPath,
  isLabelResourceName,
  normalizeLabelResourceName,
} from '@UtilsModule'
import { T } from '@ConstantsModule'

const UNSAFE_KEYS = new Set(['__proto__', 'constructor', 'prototype'])

const isPlainObject = (value) =>
  value !== null && typeof value === 'object' && !Array.isArray(value)

const clone = (value) => structuredClone(value ?? {})

const cleanSegment = (segment = '') => String(segment).replace(/^\$+/, '')

/**
 * @param selectedRows
 */
export const getSelectedResourceIds = (selectedRows = []) =>
  [selectedRows]
    .flat(2)
    .map((row) => row?.original ?? row)
    .map((row) => (isPlainObject(row) ? row?.ID ?? row?.id : row))
    .filter((id) => id !== undefined && id !== null)
    .map(String)

const getResourceEntries = (node = {}) =>
  Object.entries(node).filter(
    ([key, value]) => Array.isArray(value) && isLabelResourceName(key)
  )

const countItems = (node = {}) =>
  getResourceEntries(node).reduce((total, [, ids]) => total + ids.length, 0)

const getResourceIds = (node = {}, resourceType) => {
  if (!resourceType) return []

  const normalizedType = normalizeLabelResourceName(resourceType)
  const entry = getResourceEntries(node).find(
    ([key]) => normalizeLabelResourceName(key) === normalizedType
  )

  return [].concat(entry?.[1] ?? []).map(String)
}

const isGroupEditable = (groupName, auth = {}) => {
  if (auth?.isOneAdmin) return true

  const userId = String(auth?.user?.ID ?? '')
  const group = []
    .concat(auth?.groups ?? [])
    .find(({ NAME }) => String(NAME) === String(groupName))
  const admins = [].concat(group?.ADMINS?.ID ?? []).map(String)

  return !!userId && admins.includes(userId)
}

const getSelection = (node, resourceType, selectedIds) => {
  if (!selectedIds.length || !resourceType) return false

  const assignedIds = new Set(getResourceIds(node, resourceType))
  const selectedCount = selectedIds.filter((id) => assignedIds.has(id)).length

  if (selectedCount === 0) return false
  if (selectedCount === selectedIds.length) return true

  return null
}

const walkLabels = (node, context, path = [], depth = 0, rows = []) => {
  if (!isPlainObject(node)) return rows

  Object.entries(node).forEach(([key, value]) => {
    if (UNSAFE_KEYS.has(key) || !isPlainObject(value)) return

    const rawPath = [...path, key]
    const displayPath = cleanLabelPath(rawPath.filter(Boolean).join('/'))
    const rowId = [context.scope, context.groupName, ...rawPath]
      .filter(Boolean)
      .join(':')

    rows.push({
      id: rowId,
      name: cleanSegment(key),
      displayPath,
      rawPath,
      depth,
      scope: context.scope,
      groupName: context.groupName,
      visibility: context.scope === 'user' ? T.Private : T.Group,
      items: countItems(value),
      editable:
        context.scope === 'user' ||
        isGroupEditable(context.groupName, context.auth),
      selection: getSelection(value, context.resourceType, context.selectedIds),
    })

    walkLabels(value, context, rawPath, depth + 1, rows)
  })

  return rows
}

/**
 * @param labels
 * @param auth
 * @param resourceType
 * @param selectedIds
 */
export const getLabelRows = (
  labels = {},
  auth = {},
  resourceType,
  selectedIds = []
) => {
  const userRows = walkLabels(labels?.user, {
    scope: 'user',
    auth,
    resourceType,
    selectedIds,
  })
  const groupRows = Object.entries(labels?.group ?? {}).flatMap(
    ([groupName, groupLabels]) =>
      walkLabels(groupLabels, {
        scope: 'group',
        groupName,
        auth,
        resourceType,
        selectedIds,
      })
  )

  return { user: userRows, group: groupRows, all: [...userRows, ...groupRows] }
}

/**
 * @param rows
 * @param search
 */
export const filterLabelRows = (rows = [], search = '') => {
  const query = search.trim().toLowerCase()

  return query
    ? rows.filter(({ displayPath, groupName }) =>
        `${groupName ?? ''} ${displayPath}`.toLowerCase().includes(query)
      )
    : rows
}

/**
 * @param labels
 * @param auth
 * @param scope
 * @param excludedRow
 */
export const getParentOptions = (labels, auth, scope, excludedRow) => {
  const { user, group } = getLabelRows(labels, auth)
  const excludedPrefix = excludedRow?.rawPath?.join('/')
  /**
   * @param row
   */
  const isExcluded = (row) =>
    row.scope === excludedRow?.scope &&
    row.groupName === excludedRow?.groupName &&
    (row.rawPath.join('/') === excludedPrefix ||
      row.rawPath.join('/').startsWith(`${excludedPrefix}/`))

  if (scope === 'user') {
    return user
      .filter((row) => !isExcluded(row))
      .map((row) => ({ text: row.displayPath, value: row.rawPath.join('/') }))
  }

  const editableGroupNames = auth?.isOneAdmin
    ? Object.keys(labels?.group ?? {})
    : []
        .concat(auth?.groups ?? [])
        .map(({ NAME }) => NAME)
        .filter((groupName) => isGroupEditable(groupName, auth))

  return editableGroupNames.flatMap((groupName) => [
    { text: groupName, value: groupName },
    ...group
      .filter(
        (row) => row.groupName === groupName && row.editable && !isExcluded(row)
      )
      .map((row) => ({
        text: `${groupName}/${row.displayPath}`,
        value: [groupName, ...row.rawPath].join('/'),
      })),
  ])
}

const getTreeRoot = (labels, scope, groupName, create = false) => {
  if (scope === 'user') {
    if (create) labels.user ??= {}

    return labels.user
  }

  if (create) {
    labels.group ??= {}
    labels.group[groupName] ??= {}
  }

  return labels?.group?.[groupName]
}

const getNode = (root, path = []) =>
  path.reduce((node, segment) => node?.[segment], root)

const setNode = (root, path, value) => {
  const parent = path.slice(0, -1).reduce((node, segment) => {
    node[segment] ??= {}

    return node[segment]
  }, root)

  parent[path.at(-1)] = value
}

const deleteNode = (root, path) => {
  const parent = getNode(root, path.slice(0, -1))
  if (parent) delete parent[path.at(-1)]
}

const getDestination = ({ name, visibility, nest, parent }) => {
  if (!name) throw new Error(T.MissingLabelName)

  const scope = visibility === 'group' ? 'group' : 'user'
  const normalizedName = `$${String(name).replace(/^\$+/, '')}`
  const parentPath = parent ? String(parent).split('/').filter(Boolean) : []

  if (scope === 'group') {
    const [groupName, ...labelParentPath] = parentPath

    return {
      scope,
      groupName,
      path: [...labelParentPath, normalizedName],
    }
  }

  return {
    scope,
    path: [...(nest ? parentPath : []), normalizedName],
  }
}

const affectedScopes = (...rows) => ({
  user: rows.some(({ scope }) => scope === 'user'),
  groups: new Set(
    rows
      .filter(({ scope, groupName }) => scope === 'group' && groupName)
      .map(({ groupName }) => groupName)
  ),
})

/**
 * @param labels
 * @param formData
 */
export const createLabel = (labels, formData) => {
  const next = clone(labels)
  const destination = getDestination(formData)

  if (destination.scope === 'group' && !destination.groupName) {
    throw new Error(T.SelectParentLabel)
  }

  const root = getTreeRoot(next, destination.scope, destination.groupName, true)

  if (getNode(root, destination.path)) throw new Error(T.LabelAlreadyExists)

  setNode(root, destination.path, {})

  return {
    labels: next,
    affected: affectedScopes(destination),
  }
}

/**
 * @param labels
 * @param row
 * @param formData
 */
export const updateLabel = (labels, row, formData) => {
  const next = clone(labels)
  const sourceRoot = getTreeRoot(next, row.scope, row.groupName)
  const currentSourceNode = getNode(sourceRoot, row.rawPath)
  const destination = getDestination(formData)

  if (!currentSourceNode) throw new Error(T.LabelNotFound)
  if (destination.scope === 'group' && !destination.groupName) {
    throw new Error(T.SelectParentLabel)
  }

  const sourceNode = clone(currentSourceNode)
  const destinationRoot = getTreeRoot(
    next,
    destination.scope,
    destination.groupName,
    true
  )
  const samePath =
    row.scope === destination.scope &&
    row.groupName === destination.groupName &&
    row.rawPath.join('/') === destination.path.join('/')

  if (!samePath && getNode(destinationRoot, destination.path)) {
    throw new Error(T.LabelAlreadyExists)
  }

  deleteNode(sourceRoot, row.rawPath)
  setNode(destinationRoot, destination.path, sourceNode)

  return {
    labels: next,
    affected: affectedScopes(row, destination),
  }
}

/**
 * @param labels
 * @param row
 */
export const deleteLabel = (labels, row) => {
  const next = clone(labels)
  const root = getTreeRoot(next, row.scope, row.groupName)

  deleteNode(root, row.rawPath)

  return { labels: next, affected: affectedScopes(row) }
}

/**
 * @param labels
 * @param rows
 * @param changes
 * @param resourceType
 * @param selectedIds
 */
export const applyLabelChanges = (
  labels,
  rows,
  changes,
  resourceType,
  selectedIds
) => {
  const next = clone(labels)
  const normalizedType = normalizeLabelResourceName(resourceType)
  const rowsById = new Map(rows.map((row) => [row.id, row]))
  const changedRows = []

  Object.entries(changes).forEach(([rowId, selected]) => {
    const row = rowsById.get(rowId)
    if (!row) return

    const root = getTreeRoot(next, row.scope, row.groupName)
    const node = getNode(root, row.rawPath)
    if (!node) return

    const resourceKey =
      Object.keys(node).find(
        (key) =>
          Array.isArray(node[key]) &&
          normalizeLabelResourceName(key) === normalizedType
      ) ?? normalizedType
    const ids = new Set([].concat(node[resourceKey] ?? []).map(String))

    selectedIds.forEach((id) =>
      selected ? ids.add(String(id)) : ids.delete(String(id))
    )

    if (ids.size) node[resourceKey] = [...ids]
    else delete node[resourceKey]

    changedRows.push(row)
  })

  return { labels: next, affected: affectedScopes(...changedRows) }
}
