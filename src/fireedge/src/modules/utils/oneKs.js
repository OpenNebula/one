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
import { schemaOdsUserInputField } from '@modules/utils/ods'
import { isPlainObject, mapValues, isArray } from 'lodash'
import { DateTime } from 'luxon'
import { formatDateTime } from '@modules/utils/modeling'

/**
 * Create a list of fields to use in the schema and in forms from the list of ODS User Inputs.
 *
 * @param {Array} families - List of drivers.
 * @returns {Array} - List of fields.
 */
const createFieldsFromOneKsOdsUserInputs = (families = []) => {
  const groupedFamilyValues = families.map((family) => ({
    ...family,
    fields: {},
  }))

  groupedFamilyValues.forEach(
    ({ flavours, user_inputs: userInputs, fields }) => {
      flavours.forEach(
        ({ name, defaults, override_defaults: overrideDefaults }) => {
          if (!fields[name]) fields[name] = []

          userInputs.forEach((userInput) => {
            const defaultValue = defaults?.[userInput.name]

            const odsParams = {
              ...userInput,
            }

            if (defaultValue) {
              odsParams.default = defaultValue
              if (!overrideDefaults) {
                odsParams.disable = true
              }
            }

            fields[name].push(schemaOdsUserInputField(odsParams))
          })
        }
      )
    }
  )

  return groupedFamilyValues
}

/**
 * Recursively casts numeric strings in an object to numbers.
 *
 * @param {any} data - The data to cast numeric strings to numbers.
 * @returns {any} - The data with numeric strings cast to numbers.
 */
const castNumericStrings = (data) => {
  if (isArray(data)) {
    return data.map((item) => castNumericStrings(item))
  }

  if (isPlainObject(data)) {
    return mapValues(data, (value) => castNumericStrings(value))
  }

  if (typeof data === 'string' && data.trim() !== '') {
    const parsed = Number(data)

    return isNaN(parsed) ? data : parsed
  }

  return data
}

/**
 * Checks that a OneKE-related resource ID can be used in route generation.
 *
 * @param {string|number} id - Resource ID
 * @returns {boolean} True when the ID is non-empty and numeric
 */
const isValidOneKsResourceId = (id) => {
  const stringId = String(id ?? '').trim()

  return stringId !== '' && !Number.isNaN(Number(stringId))
}

const ONEKS_EVENT_LEVEL_MARKS = {
  debug: 'D',
  info: 'I',
  warn: 'W',
  error: 'E',
}

const safeOneKsEventText = (value) => String(value ?? '').trim()

const getOneKsEventLevel = (event = {}) => {
  const sourceLevel = safeOneKsEventText(
    event?.level ?? event?.severity
  ).toLowerCase()
  const sourceText = [
    sourceLevel,
    event?.action,
    event?.description,
    event?.message,
  ]
    .map(safeOneKsEventText)
    .join(' ')
    .toLowerCase()

  if (sourceLevel === 'debug' || /\bdebug\b/.test(sourceText)) return 'debug'
  if (
    sourceLevel === 'error' ||
    /\b(error|failed|failure|fatal)\b/.test(sourceText)
  ) {
    return 'error'
  }
  if (sourceLevel === 'warn' || /\b(warn|warning)\b/.test(sourceText)) {
    return 'warn'
  }

  return 'info'
}

const formatOneKsEventTime = (time) => {
  const timestamp = Number(time)

  return Number.isFinite(timestamp) && timestamp > 0
    ? formatDateTime(DateTime.fromSeconds(timestamp))
    : '-'
}

/**
 * Converts OneKE historic events to the shared LogsViewer data shape.
 *
 * @param {object[]} events - OneKE historic events
 * @returns {{lines: object[]}} LogsViewer-compatible log data
 */
const oneKsEventsToLogs = (events = []) => ({
  lines: []
    .concat(events ?? [])
    .filter(Boolean)
    .map((event) => {
      const level = getOneKsEventLevel(event)
      const action = safeOneKsEventText(event?.action)
      const description = safeOneKsEventText(
        event?.description ?? event?.message
      )
      const message = [action, description].filter(Boolean).join(': ') || '-'
      const time = formatOneKsEventTime(event?.time ?? event?.timestamp)
      const levelMark = ONEKS_EVENT_LEVEL_MARKS[level]

      return {
        ...event,
        level,
        text: `${time} [${levelMark}] ${message}`,
      }
    }),
})

export {
  createFieldsFromOneKsOdsUserInputs,
  castNumericStrings,
  isValidOneKsResourceId,
  oneKsEventsToLogs,
}
