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

let entryId = 0

/**
 * @param {*} value - Candidate value
 * @returns {boolean} Whether a value can identify a resource
 */
const hasValue = (value) =>
  value !== undefined && value !== null && value !== ''

/**
 * @param {*} resource - Resource name
 * @returns {string} Normalized resource name
 */
const getResourceName = (resource) => String(resource ?? '').toLowerCase()

/**
 * @param {object|string|number} data - Resource data or identifier
 * @returns {object} Resource data normalized to an object
 */
const getResourceData = (data) =>
  data && typeof data === 'object' ? data : { ID: data, id: data }

/**
 * @param {object} data - Resource data
 * @returns {string|number} Resource identifier
 */
const getResourceId = (data = {}) => (hasValue(data?.ID) ? data.ID : data?.id)

/**
 * @param {string} resource - Resource name
 * @param {object|string|number} data - Resource data or identifier
 * @param {object} props - Drawer properties
 * @param {string} key - Optional stable entry key
 * @returns {object} New resource stack entry
 */
const getStackEntry = (resource, data, props, key) => ({
  key: key ?? `${resource}-${entryId++}`,
  resource,
  data: getResourceData(data),
  props,
})

/**
 * @param {string} resource - Resource name
 * @param {object|string|number} data - Resource data or identifier
 * @param {object} props - Drawer properties
 * @returns {object} Stable entry for the route-owned base drawer
 */
const getBaseStackEntry = (resource, data, props) => {
  const resourceName = getResourceName(resource)
  const resourceData = getResourceData(data)

  return getStackEntry(
    resourceName,
    resourceData,
    props,
    `base-${resourceName}-${getResourceId(resourceData)}`
  )
}

/**
 * @param {number} index - Requested index
 * @param {number} length - Available entry count
 * @returns {number} Index constrained to the available entries
 */
const clampIndex = (index, length) =>
  length ? Math.min(Math.max(index, 0), length - 1) : -1

/**
 * @param {number} index - Requested index
 * @param {object[]} entries - Stack entries
 * @returns {number} Index constrained to the resource stack
 */
const clampStackIndex = (index, entries) => clampIndex(index, entries.length)

/**
 * @param {object[]} entries - Child stack entries
 * @param {boolean} hasBase - Whether a base drawer is rendered
 * @returns {number} Number of rendered base and child drawers
 */
const getRenderedStackLength = (entries, hasBase) =>
  entries.length + (hasBase && entries.length ? 1 : 0)

const getEntryIdentity = ({ resource, data } = {}) =>
  `${getResourceName(resource)}:${getResourceId(data)}`

/**
 * @param {object} first - First stack entry
 * @param {object} second - Second stack entry
 * @returns {boolean} Whether two entries represent the same resource
 */
const isSameEntry = (first, second) =>
  first &&
  second &&
  hasValue(getResourceId(first?.data)) &&
  getEntryIdentity(first) === getEntryIdentity(second)

/**
 * @param {object} data - Resource data
 * @param {string} resource - Resource name fallback
 * @returns {string|number} Best available drawer title
 */
const getResourceTitle = (data = {}, resource) =>
  data?.TEMPLATE?.NAME ??
  data?.NAME ??
  data?.name ??
  (hasValue(getResourceId(data)) ? getResourceId(data) : resource)

/**
 * @param {Function} getBreadcrumbs - Manifest breadcrumb lookup
 * @param {object} entry - Stack entry
 * @returns {object[]} Breadcrumbs for a stack entry
 */
const getResourceBreadcrumbs = (getBreadcrumbs, entry = {}) => {
  const { data = {}, resource } = entry
  const id = getResourceId(data)
  const resourcePath = `/${resource}`
  const detailPath = hasValue(id) ? `${resourcePath}/${id}` : undefined
  const title = getResourceTitle(data, resource)
  const detailCrumbs = detailPath ? getBreadcrumbs?.(detailPath) : null
  const listCrumbs = getBreadcrumbs?.(resourcePath)
  const crumbs = detailCrumbs ?? listCrumbs ?? []

  if (!crumbs.length) {
    return [
      { label: resource, path: resourcePath },
      ...(detailPath ? [{ label: title, path: detailPath }] : []),
    ]
  }

  const nextCrumbs = crumbs.map((crumb) => ({ ...crumb }))

  if (detailCrumbs) {
    nextCrumbs[nextCrumbs.length - 1] = {
      ...nextCrumbs[nextCrumbs.length - 1],
      label: title,
      path: detailPath,
    }

    return nextCrumbs
  }

  return detailPath
    ? [...nextCrumbs, { label: title, path: detailPath }]
    : nextCrumbs
}

export {
  clampIndex,
  clampStackIndex,
  getBaseStackEntry,
  getRenderedStackLength,
  getResourceBreadcrumbs,
  getResourceData,
  getResourceId,
  getResourceName,
  getResourceTitle,
  getStackEntry,
  hasValue,
  isSameEntry,
}
