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
import { ObjectSchema, boolean, lazy, string } from 'yup'

import { HYPERVISORS, INPUT_TYPES, T } from '@ConstantsModule'
import {
  Field,
  OPTION_SORTERS,
  arrayToOptions,
  disableFields,
  filterFieldsByHypervisor,
  getObjectSchemaFromFields,
} from '@UtilsModule'

const { lxc } = HYPERVISORS
const CUSTOM_KEYMAP_VALUE = 'custom'
export const GRAPHICS_TYPES = {
  VNC: 'VNC',
  SPICE: 'SPICE',
}

/**
 * @param {*} type - Graphics type
 * @returns {string|undefined} Normalized supported graphics type
 */
export const normalizeGraphicsType = (type) => {
  const normalizedType = typeof type === 'string' ? type.toUpperCase() : type

  return Object.values(GRAPHICS_TYPES).includes(normalizedType)
    ? normalizedType
    : undefined
}

/**
 * @param {object} context - Form schema context
 * @returns {object} Graphics values from a template or VM form
 */
const getGraphicsFromContext = (context = {}) =>
  context?.extra?.GRAPHICS ?? context?.GRAPHICS ?? {}

/**
 * Normalizes graphics values before submitting the form.
 *
 * @param {object} graphics - Graphics values
 * @returns {object|undefined} Graphics values ready to submit
 */
export const sanitizeGraphics = (graphics = {}) => {
  const type = normalizeGraphicsType(graphics?.TYPE)

  if (!type) return undefined

  return { ...graphics, TYPE: type.toLowerCase() }
}

const KEYMAP_VALUES = {
  ar: T.Arabic,
  hr: T.Croatian,
  cz: T.Czech,
  da: T.Danish,
  nl: T.Dutch,
  'en-gb': T.EnglishGB,
  'en-us': T.EnglishUS,
  et: T.Estonian,
  fo: T.Faroese,
  fi: T.Finnish,
  fr: T.French,
  'fr-be': T.FrenchBe,
  'fr-ca': T.FrenchCa,
  bepo: T.FrenchBEPO,
  'fr-ch': T.FrenchSw,
  de: T.German,
  'de-ch': T.GermanSw,
  hu: T.Hungarian,
  is: T.Icelandic,
  it: T.Italian,
  ja: T.Japanese,
  lv: T.Latvian,
  lt: T.Lithuanian,
  mk: T.Macedonian,
  no: T.Norwegian,
  pl: T.Polish,
  pt: T.Portuguese,
  'pt-br': T.PortugueseBr,
  ru: T.Russian,
  sl: T.Slovenian,
  es: T.SpanishEs,
  'ca-es': T.SpanishCatalan,
  sv: T.Swedish,
  th: T.Thai,
  tr: T.Turkish,
  custom: T.Custom,
}

/** @type {Field} Type field */
export const TYPE = (isUpdate) => ({
  name: 'GRAPHICS.TYPE',
  type: INPUT_TYPES.AUTOCOMPLETE,
  optionsOnly: true,
  label: T.Type,
  dependOf: ['HYPERVISOR', '$general.HYPERVISOR'],
  values: arrayToOptions(Object.values(GRAPHICS_TYPES), {
    addEmpty: false,
    sorter: OPTION_SORTERS.unsort,
  }),
  validation: string()
    .trim()
    .nullable()
    .notRequired()
    .transform((value) => normalizeGraphicsType(value) ?? value)
    .oneOf(Object.values(GRAPHICS_TYPES))
    .default(() => (isUpdate ? undefined : GRAPHICS_TYPES.VNC)),

  grid: { md: 12 },
})

/** @type {Field} Listen field */
export const LISTEN = (isUpdate) => ({
  name: 'GRAPHICS.LISTEN',
  label: T.ListenOnIp,
  type: INPUT_TYPES.TEXT,
  validation: string()
    .trim()
    .notRequired()
    .default(() => (isUpdate ? undefined : '0.0.0.0')),
  fieldProps: { placeholder: '0.0.0.0' },
  grid: { md: 12 },
})

/** @type {Field} Port field */
export const PORT = {
  name: 'GRAPHICS.PORT',
  label: T.ServerPort,
  tooltip: T.ServerPortConcept,
  type: INPUT_TYPES.TEXT,
  validation: string()
    .trim()
    .notRequired()
    .default(() => undefined),
}

/** @type {Field} Keymap field */
export const KEYMAP = {
  name: 'GRAPHICS.KEYMAP',
  label: T.Keymap,
  type: INPUT_TYPES.AUTOCOMPLETE,
  values: arrayToOptions(Object.entries(KEYMAP_VALUES), {
    addEmpty: false,
    getText: ([_, label]) => label,
    getValue: ([keymap]) => keymap,
  }),
  validation: string()
    .trim()
    .nullable(true)
    .notRequired()
    .transform((value) =>
      value && KEYMAP_VALUES[value] ? value : CUSTOM_KEYMAP_VALUE
    )
    .default(() => undefined)
    .afterSubmit((value, { context }) => {
      const graphics = getGraphicsFromContext(context)

      return value === CUSTOM_KEYMAP_VALUE ? graphics.CUSTOM_KEYMAP : value
    }),
  grid: { md: 12 },
}

/** @type {Field} Custom keymap field */
export const CUSTOM_KEYMAP = {
  name: 'GRAPHICS.CUSTOM_KEYMAP',
  label: T.Keymap,
  type: INPUT_TYPES.TEXT,
  dependOf: KEYMAP.name,
  htmlType: (selectedKeymap) =>
    (!selectedKeymap ||
      selectedKeymap?.toLowerCase() !== CUSTOM_KEYMAP_VALUE) &&
    INPUT_TYPES.HIDDEN,
  validation: lazy((_, { context }) => {
    const graphics = getGraphicsFromContext(context)
    const customKeymapRequired = graphics.KEYMAP === CUSTOM_KEYMAP_VALUE
    const schema = string().trim()
    const validation = customKeymapRequired
      ? schema.required()
      : schema.notRequired().nullable(true)

    return (
      validation
        .default(() => {
          const keymapFromTemplate = graphics.KEYMAP

          return KEYMAP_VALUES[keymapFromTemplate]
            ? undefined
            : keymapFromTemplate
        })
        // Modification type is not required in template
        .afterSubmit(() => undefined)
    )
  }),
  grid: { md: 12 },
}

/** @type {Field} Password random field  */
export const RANDOM_PASSWD = {
  name: 'GRAPHICS.RANDOM_PASSWD',
  label: T.GenerateRandomPassword,
  type: INPUT_TYPES.CHECKBOX,
  validation: boolean().yesOrNo(),
  grid: { md: 12 },
}

/** @type {Field} Password field */
export const PASSWD = {
  name: 'GRAPHICS.PASSWD',
  label: T.Password,
  type: INPUT_TYPES.PASSWORD,
  dependOf: RANDOM_PASSWD.name,
  htmlType: (random) => random && INPUT_TYPES.HIDDEN,
  validation: string()
    .trim()
    .notRequired()
    .default(() => undefined),
  grid: { md: 12 },
}

/**
 * @param {boolean} isUpdate - The form is being updated
 * @returns {Field} Command field
 */
export const COMMAND = (isUpdate) => ({
  name: 'GRAPHICS.COMMAND',
  label: T.Command,
  notOnHypervisors: [lxc],
  type: INPUT_TYPES.TEXT,
  dependOf: 'GRAPHICS.TYPE',
  htmlType: (type) =>
    (isUpdate || normalizeGraphicsType(type) === GRAPHICS_TYPES.SPICE) &&
    INPUT_TYPES.HIDDEN,
  validation: string()
    .trim()
    .notRequired()
    .default(() => undefined)
    .afterSubmit((value, { context }) => {
      const graphics = getGraphicsFromContext(context)

      return isUpdate ||
        normalizeGraphicsType(graphics.TYPE) === GRAPHICS_TYPES.SPICE
        ? undefined
        : value
    }),
  grid: { md: 12 },
})

/**
 * @param {string} [hypervisor] - VM hypervisor
 * @param {object} oneConfig - Config of oned.conf
 * @param {boolean} adminGroup - User is admin or not
 * @param {boolean} isUpdate - The form is being updated
 * @returns {Field[]} List of Graphics fields
 */
export const GRAPHICS_FIELDS = (hypervisor, oneConfig, adminGroup, isUpdate) =>
  disableFields(
    filterFieldsByHypervisor(
      [
        TYPE(isUpdate),
        LISTEN(isUpdate),
        PORT,
        KEYMAP,
        CUSTOM_KEYMAP,
        PASSWD,
        RANDOM_PASSWD,
        COMMAND(isUpdate),
      ],
      hypervisor
    ),
    'GRAPHICS',
    oneConfig,
    adminGroup
  )

/** @type {ObjectSchema} Graphics schema */
export const GRAPHICS_SCHEMA = (hypervisor, oneConfig, adminGroup, isUpdate) =>
  getObjectSchemaFromFields(
    GRAPHICS_FIELDS(hypervisor, oneConfig, adminGroup, isUpdate)
  ).afterSubmit(sanitizeGraphics)
