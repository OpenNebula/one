/* ------------------------------------------------------------------------- *
 * Copyright 2002-2023, OpenNebula Project, OpenNebula Systems               *
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
import { string, boolean, ObjectSchema, lazy } from 'yup'

import {
  Field,
  arrayToOptions,
  filterFieldsByHypervisor,
  getObjectSchemaFromFields,
  disableFields,
} from 'client/utils'
import { T, INPUT_TYPES, HYPERVISORS } from 'client/constants'

const { vcenter, lxc, kvm } = HYPERVISORS
const CUSTOM_KEYMAP_VALUE = 'custom'
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
  sv: T.Swedish,
  th: T.Thai,
  tr: T.Turkish,
  custom: T.Custom,
}

/** @type {Field} Type field */
export const TYPE = {
  name: 'GRAPHICS.TYPE',
  type: INPUT_TYPES.TOGGLE,
  dependOf: ['HYPERVISOR', '$general.HYPERVISOR'],
  values: ([templateHyperv = kvm, hypervisor = templateHyperv] = []) => {
    const types = {
      [vcenter]: [T.Vmrc],
      [lxc]: [T.Vnc],
    }[hypervisor] ?? [T.Vnc, T.Sdl, T.Spice]

    return arrayToOptions(types)
  },
  validation: string()
    .trim()
    .notRequired()
    .uppercase()
    .default(() => undefined),
  grid: { md: 12 },
}

/** @type {Field} Listen field */
export const LISTEN = {
  name: 'GRAPHICS.LISTEN',
  label: T.ListenOnIp,
  type: INPUT_TYPES.TEXT,
  dependOf: TYPE.name,
  htmlType: (noneType) => !noneType && INPUT_TYPES.HIDDEN,
  validation: string()
    .trim()
    .notRequired()
    .default(() => undefined),
  fieldProps: { placeholder: '0.0.0.0' },
  grid: { md: 12 },
}

/** @type {Field} Port field */
export const PORT = {
  name: 'GRAPHICS.PORT',
  label: T.ServerPort,
  tooltip: T.ServerPortConcept,
  type: INPUT_TYPES.TEXT,
  dependOf: TYPE.name,
  htmlType: (noneType) => !noneType && INPUT_TYPES.HIDDEN,
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
  dependOf: TYPE.name,
  values: arrayToOptions(Object.entries(KEYMAP_VALUES), {
    addEmpty: false,
    getText: ([_, label]) => label,
    getValue: ([keymap]) => keymap,
  }),
  htmlType: (noneType) => !noneType && INPUT_TYPES.HIDDEN,
  validation: string()
    .trim()
    .notRequired()
    .transform((value) =>
      value && KEYMAP_VALUES[value] ? value : CUSTOM_KEYMAP_VALUE
    )
    .default(() => undefined)
    .afterSubmit((value, { context }) =>
      value === CUSTOM_KEYMAP_VALUE
        ? context.extra.GRAPHICS.CUSTOM_KEYMAP
        : value
    ),
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
  validation: lazy((_, { context }) =>
    string()
      .trim()
      .when(`$extra.${KEYMAP.name}`, (keymap, schema) =>
        keymap === CUSTOM_KEYMAP_VALUE
          ? schema.required()
          : schema.notRequired()
      )
      .default(() => {
        const keymapFromTemplate = context.extra?.GRAPHICS?.KEYMAP

        return KEYMAP_VALUES[keymapFromTemplate]
          ? undefined
          : keymapFromTemplate
      })
      // Modification type is not required in template
      .afterSubmit(() => undefined)
  ),
  grid: { md: 12 },
}

/** @type {Field} Password random field  */
export const RANDOM_PASSWD = {
  name: 'GRAPHICS.RANDOM_PASSWD',
  label: T.GenerateRandomPassword,
  type: INPUT_TYPES.CHECKBOX,
  dependOf: TYPE.name,
  htmlType: (noneType) => !noneType && INPUT_TYPES.HIDDEN,
  validation: boolean().yesOrNo(),
  grid: { md: 12 },
}

/** @type {Field} Password field */
export const PASSWD = {
  name: 'GRAPHICS.PASSWD',
  label: T.Password,
  type: INPUT_TYPES.PASSWORD,
  dependOf: [TYPE.name, RANDOM_PASSWD.name],
  htmlType: ([noneType, random] = []) =>
    (!noneType || random) && INPUT_TYPES.HIDDEN,
  validation: string()
    .trim()
    .notRequired()
    .default(() => undefined),
  grid: { md: 12 },
}

/** @type {Field} Command field */
export const COMMAND = {
  name: 'GRAPHICS.COMMAND',
  label: T.Command,
  notOnHypervisors: [lxc],
  type: INPUT_TYPES.TEXT,
  dependOf: TYPE.name,
  htmlType: (noneType) => !noneType && INPUT_TYPES.HIDDEN,
  validation: string()
    .trim()
    .notRequired()
    .default(() => undefined),
  grid: { md: 12 },
}

/**
 * @param {string} [hypervisor] - VM hypervisor
 * @param {object} oneConfig - Config of oned.conf
 * @param {boolean} adminGroup - User is admin or not
 * @returns {Field[]} List of Graphics fields
 */
export const GRAPHICS_FIELDS = (hypervisor, oneConfig, adminGroup) =>
  disableFields(
    filterFieldsByHypervisor(
      [
        TYPE,
        LISTEN,
        PORT,
        KEYMAP,
        CUSTOM_KEYMAP,
        PASSWD,
        RANDOM_PASSWD,
        COMMAND,
      ],
      hypervisor
    ),
    'GRAPHICS',
    oneConfig,
    adminGroup
  )

/** @type {ObjectSchema} Graphics schema */
export const GRAPHICS_SCHEMA = (hypervisor) =>
  getObjectSchemaFromFields(GRAPHICS_FIELDS(hypervisor))
