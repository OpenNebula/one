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
export const TYPES_POLICY = [
  { text: 'Change', value: 'CHANGE', min: false },
  { text: 'Cardinality', value: 'CARDINALITY', min: false },
  { text: 'Percentege change', value: 'PERCENTAGE_CHANGE' },
]

export const TIME_FORMATS = [
  { text: 'Recurrence', value: 'recurrence' },
  { text: 'Start time', value: 'start_time', date: true },
]

export const hasMinValue = (type) =>
  TYPES_POLICY.some(({ value, min }) => value === type && min === false)

export const isDateFormat = (format) =>
  TIME_FORMATS.some(({ value, date }) => value === format && date === true)
