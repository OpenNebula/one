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

import { T } from '@ConstantsModule'
import { TagList } from '@ComponentsV2Module'
import { cleanLabelPath } from '@UtilsModule'

/* eslint-disable jsdoc/require-jsdoc */
export { cleanLabelPath }

const toArray = (value) =>
  []
    .concat(value ?? [])
    .flat()
    .filter((item) => item !== undefined && item !== null && item !== '')

const hashString = (value = '') =>
  String(value)
    .split('')
    .reduce((hash, char) => (hash * 31 + char.charCodeAt(0)) >>> 0, 0)

export const getSeededLabelColor = (label = '') => {
  const hue = hashString(label) % 360

  return {
    background: `hsl(${hue}, 76%, 92%)`,
    border: `hsl(${hue}, 62%, 70%)`,
    text: `hsl(${hue}, 52%, 28%)`,
  }
}

const addLabelTag = (tags, seen, { scope, group = '', path, status }) => {
  const key = [scope, group, path].join(':')
  if (seen.has(key)) return

  seen.add(key)

  const cleanPath = cleanLabelPath(path)
  const title = group ? `${group}: ${cleanPath}` : cleanPath

  tags.push({ title, status, customColor: getSeededLabelColor(title) })
}

export const getLabelTags = (LABELS = {}) => {
  const tags = []
  const seen = new Set()

  toArray(LABELS?.user).forEach((path) =>
    addLabelTag(tags, seen, {
      scope: 'user',
      path,
      status: 'default',
    })
  )

  Object.entries(LABELS?.group ?? {}).forEach(([group, labels]) => {
    toArray(labels).forEach((path) =>
      addLabelTag(tags, seen, {
        scope: 'group',
        group,
        path,
        status: 'information',
      })
    )
  })

  return tags
}

export const getLabelText = (LABELS = {}) =>
  getLabelTags(LABELS)
    .map(({ title }) => title)
    .join(', ')

export const getLabelSlotLabels = (LABELS = {}) =>
  getLabelTags(LABELS).map(({ title, status, customColor }) => [
    title,
    status,
    { customColor },
  ])

export const createLabelColumn = ({
  header = T.Labels,
  id = 'labels',
  width = null,
  max = 2,
  meta,
  ...column
} = {}) => ({
  header,
  id,
  ...(width !== null && { width }),
  accessorFn: (row) => getLabelText(row?.LABELS),
  filterAccessorFn: (row) =>
    getLabelTags(row?.LABELS).map(({ title }) => title),
  cell: ({ row }) => {
    const tags = getLabelTags(row.original?.LABELS)

    return tags.length ? <TagList tags={tags} max={max} /> : '-'
  },
  ...column,
  meta: {
    ...meta,
    disableCellTooltip: true,
  },
})
