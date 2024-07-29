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
import { INPUT_TYPES, T, MARKET_TYPES } from 'client/constants'
import { string, array } from 'yup'
import { Field } from 'client/utils'

/** @type {Field} PUBLIC_DIR field */
const PUBLIC_DIR = {
  name: 'PUBLIC_DIR',
  label: T['marketplace.form.configuration.http.path'],
  tooltip: T['marketplace.form.configuration.http.path.tooltip'],
  type: INPUT_TYPES.TEXT,
  dependOf: '$general.MARKET_MAD',
  htmlType: (type) => type !== MARKET_TYPES.HTTP.value && INPUT_TYPES.HIDDEN,
  validation: string()
    .trim()
    .when('$general.MARKET_MAD', (type, schema) => {
      if (type)
        return type !== MARKET_TYPES.HTTP.value
          ? schema.strip()
          : schema.required()
    })
    .default(() => undefined),
  grid: { md: 12 },
  fieldProps: { placeholder: '/var/local/market-http' },
}

/** @type {Field} BRIDGE_LIST field */
const BRIDGE_LIST = {
  name: 'BRIDGE_LIST',
  label: T['marketplace.form.configuration.http.bridge'],
  tooltip: [T.PressKeysToAddAValue, ['ENTER']],
  type: INPUT_TYPES.AUTOCOMPLETE,
  multiple: true,
  dependOf: '$general.MARKET_MAD',
  htmlType: (type) => type !== MARKET_TYPES.HTTP.value && INPUT_TYPES.HIDDEN,
  validation: array(string().trim())
    .notRequired()
    .default(() => undefined)
    .afterSubmit((value, { context }) =>
      context?.general?.MARKET_MAD === MARKET_TYPES.HTTP.value && value
        ? value.join(' ')
        : undefined
    ),
  grid: { md: 12 },
  fieldProps: { freeSolo: true },
}

const FIELDS = [PUBLIC_DIR, BRIDGE_LIST]

export { FIELDS }
