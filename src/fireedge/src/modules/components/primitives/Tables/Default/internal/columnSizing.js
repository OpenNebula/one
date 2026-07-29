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

const DEFAULT_MIN_WIDTH = 48

const clamp = (value, min, max) => Math.min(Math.max(value, min), max)

/**
 * Equally distributes extra width between automatic columns while respecting
 * their maximum widths.
 *
 * @param {Array<object>} columns - Automatic column constraints
 * @param {object} widths - Current width by column id
 * @param {number} extraWidth - Width left after fitting rendered content
 */
const distributeExtraWidth = (columns, widths, extraWidth) => {
  let remainingWidth = extraWidth
  let growableColumns = columns.filter(
    ({ id, maxWidth }) => widths[id] < maxWidth
  )

  while (remainingWidth > 0 && growableColumns.length) {
    const equalExtraWidth = remainingWidth / growableColumns.length
    let distributedWidth = 0

    growableColumns.forEach(({ id, maxWidth }) => {
      const nextWidth = Math.min(widths[id] + equalExtraWidth, maxWidth)

      distributedWidth += nextWidth - widths[id]
      widths[id] = nextWidth
    })

    if (distributedWidth <= 0) break

    remainingWidth -= distributedWidth
    growableColumns = growableColumns.filter(
      ({ id, maxWidth }) => widths[id] < maxWidth
    )
  }
}

/**
 * Calculates final column widths.
 *
 * An explicit `width` takes priority. Automatic columns start at their maximum
 * observed rendered width and share any remaining table width equally. A
 * truncated automatic column uses the default maximum unless it defines its
 * own `maxWidth`. All widths honor `minWidth` and explicit `maxWidth` values.
 * If the fitted widths do not fit, their sum becomes the table width so the
 * existing horizontal overflow is preserved.
 *
 * @param {Array<object>} columns - Visible TanStack columns
 * @param {object} observedWidths - Maximum observed content width by column id
 * @param {number} availableWidth - Table viewport width
 * @param {Function} resolveLength - Converts a column CSS length to pixels
 * @param {number} defaultMaxWidth - Default maximum for truncated columns
 * @returns {{ tableWidth: number, widths: object }} Calculated layout
 */
export const calculateColumnLayout = (
  columns,
  observedWidths,
  availableWidth,
  resolveLength,
  defaultMaxWidth = Number.POSITIVE_INFINITY
) => {
  const widths = {}
  const automaticColumns = []

  columns.forEach((column) => {
    const {
      width,
      minWidth,
      maxWidth,
      truncate = false,
      grow = true,
    } = column.columnDef
    const resolvedMinWidth = resolveLength(minWidth) ?? DEFAULT_MIN_WIDTH
    const explicitWidth =
      width !== undefined && width !== null ? resolveLength(width) : undefined
    const definedMaxWidth = resolveLength(maxWidth)
    const resolvedMaxWidth = Math.max(
      resolvedMinWidth,
      definedMaxWidth ??
        (explicitWidth === undefined && truncate
          ? defaultMaxWidth
          : Number.POSITIVE_INFINITY)
    )

    widths[column.id] = clamp(
      explicitWidth ?? observedWidths[column.id] ?? resolvedMinWidth,
      resolvedMinWidth,
      resolvedMaxWidth
    )

    if (explicitWidth === undefined && grow) {
      automaticColumns.push({
        id: column.id,
        maxWidth: resolvedMaxWidth,
      })
    }
  })

  const fittedWidth = Object.values(widths).reduce(
    (total, width) => total + width,
    0
  )
  distributeExtraWidth(
    automaticColumns,
    widths,
    Math.max(availableWidth - fittedWidth, 0)
  )

  return {
    tableWidth: Object.values(widths).reduce(
      (total, width) => total + width,
      0
    ),
    widths,
  }
}
