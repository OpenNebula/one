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
/**
 * @param {string} labelString - Double encoded JSON string
 * @returns {object} - JSON object
 */
export const parseLabels = (labelString) => {
  try {
    return JSON.parse(JSON.parse(labelString))
  } catch {
    return labelString
  }
}

/**
 * @param {object} labelString - JSON object
 * @returns {string} - Double encoded JSON string
 */
export const encodeLabels = (labelString) =>
  JSON.stringify(JSON.stringify(labelString))

/**
 * @param {object} labels - user/group with list of labels
 * @param {string} resourceId - ID of the resource to scan for
 * @param {string} resourceType - Resource type identifier
 * @param {boolean} unified - Split user/group labels
 * @returns {object} - User/Group separated list of labels
 */
export const getResourceLabels = (
  labels,
  resourceId,
  resourceType,
  unified = false
) => {
  const result = { user: [], group: {} }

  const traverse = (node, path = [], type) => {
    Object.entries(node).forEach(([key, value]) => {
      const newPath = [...path, key]

      if (Array.isArray(value) && key === resourceType) {
        if (value.includes(resourceId)) {
          const labelPath = newPath.slice(0, -1).join('/')

          if (type === 'user') {
            result.user.push(labelPath)
          } else if (type === 'group') {
            const groupKey = path[0]
            if (!result.group[groupKey]) {
              result.group[groupKey] = []
            }
            result.group[groupKey].push(labelPath)
          }
        }
      } else if (typeof value === 'object' && value !== null) {
        traverse(value, newPath, type)
      }
    })
  }

  Object.entries(labels).forEach(([type, data]) => {
    traverse(data, [], type)
  })

  if (unified) {
    const fmtLabels = (l) => l?.replace(/\$/g, '')

    const groupLabels = Object.values(result.group).flat()?.map(fmtLabels)

    return [...result.user?.map(fmtLabels), ...groupLabels]
  }

  return result
}
