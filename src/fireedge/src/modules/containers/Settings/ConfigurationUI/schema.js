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
import {
  DEFAULT_LANGUAGE,
  DEFAULT_SCHEME,
  INPUT_TYPES,
  LANGUAGES,
  PAGINATION_SIZES,
  SCHEMES,
  T,
} from '@ConstantsModule'
import {
  DARK_MODE,
  LIGHT_MODE,
  SYSTEM_MODE,
} from '@modules/containers/Settings/ConfigurationUI/svgs'
import { arrayToOptions, getObjectSchemaFromFields } from '@UtilsModule'
import { boolean, string } from 'yup'

const SCHEME_FIELD = {
  name: 'SCHEME',
  type: INPUT_TYPES.RADIO,
  optionsOnly: true,
  values: [
    { text: T.Dark, value: SCHEMES.DARK, svg: DARK_MODE },
    { text: T.Light, value: SCHEMES.LIGHT, svg: LIGHT_MODE },
    { text: T.System, value: SCHEMES.SYSTEM, svg: SYSTEM_MODE },
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

const SIDEBAR_FIELD = {
  name: 'SIDEBAR',
  label: T.StuckSidebar,
  type: INPUT_TYPES.SWITCH,
  validation: boolean().default(() => false),
  grid: { md: 12 },
}

const DISABLE_ANIMATIONS_FIELD = {
  name: 'DISABLE_ANIMATIONS',
  label: T.DisableDashboardAnimations,
  type: INPUT_TYPES.SWITCH,
  validation: boolean().default(() => false),
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
  type: INPUT_TYPES.SWITCH,
  validation: boolean().default(() => false),
  grid: { md: 12 },
}

const ROW_STYLE_FIELD = {
  name: 'ROW_STYLE',
  type: INPUT_TYPES.RADIO,
  optionsOnly: true,
  values: [
    { text: T.Card, value: 'card' },
    { text: T.List, value: 'list' },
  ],
  validation: string()
    .trim()
    .required()
    .default(() => 'card'),
  grid: { md: 12 },
}

const ROW_SIZE_FIELD = {
  name: 'ROW_SIZE',
  label: T.NumberPerPage,
  type: INPUT_TYPES.AUTOCOMPLETE,
  optionsOnly: true,
  values: () => PAGINATION_SIZES.map((size) => ({ text: size, value: size })),
  validation: string()
    .trim()
    .required()
    .default(() => PAGINATION_SIZES[1]),
  grid: { md: 12 },
}

export const FIELDS_THEME = [SCHEME_FIELD]

export const FIELDS_DATATABLE = [
  ROW_STYLE_FIELD,
  ROW_SIZE_FIELD,
  FULL_SCREEN_INFO_FIELD,
]

/**
 * Fields of the other settings form.
 *
 * @param {object} props - Props
 * @param {object} props.views - views.
 * @param {string} props.userView - default user view.
 * @param {object[]} props.zones - Redux store.
 * @returns {object[]} fields
 */
export const FIELDS_OTHERS = (props) => [
  LANG_FIELD,
  SIDEBAR_FIELD,
  ZONE_ENDPOINT_FIELD(props),
  VIEW_FIELD(props),
]

export const FIELDS_ANIMATIONS = [DISABLE_ANIMATIONS_FIELD]

/**
 * Field for validation.
 *
 * @param {object} props - Props
 * @param {object} props.views - views.
 * @param {string} props.userView - default user view.
 * @param {object[]} props.zones - Redux store.
 * @returns {object[]} fields
 */
export const FIELDS = (props) => [
  ...FIELDS_THEME,
  ...FIELDS_OTHERS(props),
  ...FIELDS_DATATABLE,
  ...FIELDS_ANIMATIONS,
]

/**
 * @param {object} props - Props
 * @param {object} props.views - views.
 * @param {string} props.userView - default user view.
 * @param {object[]} props.zones - Redux store.
 * @returns {object[]} schema
 */
export const SCHEMA = (props) => getObjectSchemaFromFields(FIELDS(props))
