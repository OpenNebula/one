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
import {
  DEFAULT_LANGUAGE,
  DEFAULT_SCHEME,
  INPUT_TYPES,
  LANGUAGES,
  SCHEMES,
  T,
} from 'client/constants'
import { arrayToOptions, getObjectSchemaFromFields } from 'client/utils'
import { boolean, string } from 'yup'

const SCHEME_FIELD = {
  name: 'SCHEME',
  label: T.Schema,
  type: INPUT_TYPES.AUTOCOMPLETE,
  optionsOnly: true,
  values: [
    { text: T.System, value: SCHEMES.SYSTEM },
    { text: T.Dark, value: SCHEMES.DARK },
    { text: T.Light, value: SCHEMES.LIGHT },
  ],
  validation: string()
    .trim()
    .required()
    .default(() => DEFAULT_SCHEME),
  grid: { md: 12 },
}

const LANG_FIELD = {
  name: 'LANG',
  label: T.Language,
  type: INPUT_TYPES.AUTOCOMPLETE,
  optionsOnly: true,
  values: () =>
    arrayToOptions(Object.entries(LANGUAGES), {
      addEmpty: false,
      getText: ([, text]) => text,
      getValue: ([value]) => value,
    }),
  validation: string()
    .trim()
    .required()
    .default(() => DEFAULT_LANGUAGE),
  grid: { md: 12 },
}

const DISABLE_ANIMATIONS_FIELD = {
  name: 'DISABLE_ANIMATIONS',
  label: T.DisableDashboardAnimations,
  type: INPUT_TYPES.CHECKBOX,
  validation: boolean().yesOrNo(),
  grid: { md: 12 },
}

const VIEW_FIELD = ({ views }) => ({
  name: 'DEFAULT_VIEW',
  label: T.View,
  type: INPUT_TYPES.AUTOCOMPLETE,
  optionsOnly: true,
  values: () =>
    arrayToOptions(Object.entries(views), {
      addEmpty: true,
      getText: ([key]) => key,
      getValue: ([key]) => key,
    }),
  validation: string()
    .trim()
    .required()
    .default(() => ''),
  grid: { md: 12 },
})

const ZONE_ENDPOINT_FIELD = ({ zones = [] }) => ({
  name: 'DEFAULT_ZONE_ENDPOINT',
  label: T.DefaultZoneEndpoint,
  type: INPUT_TYPES.AUTOCOMPLETE,
  optionsOnly: true,
  values: () =>
    arrayToOptions(
      zones
        .map((zone) => ({
          name: zone.NAME || '',
          endpoint: zone?.TEMPLATE?.ENDPOINT,
        }))
        .filter((zone) => zone.name || zone.endpoint),
      {
        addEmpty: true,
        getText: ({ name }) => name,
        getValue: ({ endpoint }) => endpoint,
      }
    ),
  validation: string()
    .trim()
    .required()
    .default(() => ''),
  grid: { md: 12 },
})

const FULL_SCREEN_INFO_FIELD = {
  name: 'FULL_SCREEN_INFO',
  label: T.FullScreenInfo,
  type: INPUT_TYPES.CHECKBOX,
  validation: boolean().yesOrNo(),
  grid: { md: 12 },
}

/**
 * @param {object} props - Props
 * @param {object} props.views - views.
 * @param {string} props.userView - default user view.
 * @param {object[]} props.zones - Redux store.
 * @returns {object[]} fields
 */
export const FIELDS = (props) => [
  SCHEME_FIELD,
  LANG_FIELD,
  VIEW_FIELD(props),
  ZONE_ENDPOINT_FIELD(props),
  DISABLE_ANIMATIONS_FIELD,
  FULL_SCREEN_INFO_FIELD,
]

/**
 * @param {object} props - Props
 * @param {object} props.views - views.
 * @param {string} props.userView - default user view.
 * @param {object[]} props.zones - Redux store.
 * @returns {object[]} schema
 */
export const SCHEMA = (props) => getObjectSchemaFromFields(FIELDS(props))
