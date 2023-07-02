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
import { string, object, ObjectSchema } from 'yup'
import { Field, arrayToOptions, getValidationFromFields } from 'client/utils'
import { T, INPUT_TYPES } from 'client/constants'
import {
  IMAGE_LOCATION_TYPES,
  IMAGE_LOCATION_FIELD,
} from 'client/components/Forms/Image/CreateForm/Steps/General/schema'
import { useGetSunstoneConfigQuery } from 'client/features/OneApi/system'

export const BUS_TYPES = {
  VD: T.Vd,
  SD: T.Sd,
  HD: T.Hd,
  CUSTOM: T.Custom,
}

const FORMAT_TYPES = {
  RAW: 'raw',
  QCOW2: 'qcow2',
  CUSTOM: 'custom',
}

const htmlType = (opt) => (value) => value !== opt && INPUT_TYPES.HIDDEN

/** @type {Field} Bus field */
export const DEV_PREFIX = {
  name: 'DEV_PREFIX',
  label: T.Bus,
  type: INPUT_TYPES.SELECT,
  values: arrayToOptions(Object.entries(BUS_TYPES), {
    addEmpty: true,
    getText: ([_, name]) => name,
    getValue: ([key]) => key,
  }),
  validation: string()
    .trim()
    .default(() => undefined)
    .afterSubmit((value, { context }) => {
      const notEmptyString = value === '' ? undefined : value

      return BUS_TYPES.CUSTOM === value
        ? context?.advanced?.CUSTOM_DEV_PREFIX
        : notEmptyString
    }),
  grid: { md: 6 },
}

/** @type {Field} Dev Prefix field */
export const CUSTOM_DEV_PREFIX = {
  name: 'CUSTOM_DEV_PREFIX',
  dependOf: DEV_PREFIX.name,
  htmlType: htmlType(BUS_TYPES.CUSTOM),
  label: T.CustomBus,
  type: INPUT_TYPES.TEXT,
  validation: string()
    .trim()
    .when(DEV_PREFIX.name, {
      is: (location) => location === BUS_TYPES.CUSTOM,
      then: (schema) => schema.required(),
      otherwise: (schema) => schema.strip(),
    })
    .default(() => undefined),
  grid: { md: 12 },
}

/** @type {Field} Device field */
export const DEVICE = {
  name: 'DEVICE',
  label: T.TargetDevice,
  type: INPUT_TYPES.TEXT,
  validation: string()
    .trim()
    .default(() => undefined),
  grid: { md: 6 },
}

/** @type {Field} Format field */
export const FORMAT_FIELD = {
  name: 'FORMAT',
  dependOf: `$general.${IMAGE_LOCATION_FIELD.name}`,
  htmlType: htmlType(IMAGE_LOCATION_TYPES.EMPTY),
  label: T.Format,
  type: INPUT_TYPES.SELECT,
  values: arrayToOptions(Object.values(FORMAT_TYPES), {
    addEmpty: true,
    getText: (type) => type.toUpperCase(),
    getValue: (type) => type,
  }),
  validation: string()
    .trim()
    .afterSubmit((value, { context }) => {
      const notEmptyString = value === '' ? undefined : value

      return FORMAT_TYPES.CUSTOM === value
        ? context?.advanced?.CUSTOM_FORMAT
        : notEmptyString
    }),
  grid: { md: 6 },
}

/** @type {Field} Custom format field */
export const CUSTOM_FORMAT = {
  name: 'CUSTOM_FORMAT',
  dependOf: [`$general.${IMAGE_LOCATION_FIELD.name}`, FORMAT_FIELD.name],
  htmlType: ([imageLocation, formatField] = []) =>
    (imageLocation !== IMAGE_LOCATION_TYPES.EMPTY ||
      formatField !== FORMAT_TYPES.CUSTOM) &&
    INPUT_TYPES.HIDDEN,
  label: T.CustomFormat,
  type: INPUT_TYPES.TEXT,
  validation: string()
    .trim()
    .when(FORMAT_FIELD.name, {
      is: (format) => format === FORMAT_TYPES.CUSTOM,
      then: (schema) => schema.required(),
      otherwise: (schema) => schema.strip(),
    }),
  grid: { md: 12 },
}

/** @type {Field} FS field */
export const FS = {
  name: 'FS',
  dependOf: `$general.${IMAGE_LOCATION_FIELD.name}`,
  htmlType: htmlType(IMAGE_LOCATION_TYPES.EMPTY),
  label: T.Fs,
  type: INPUT_TYPES.SELECT,
  values: () => {
    const { data: sunstoneConfig = {} } = useGetSunstoneConfigQuery()

    return arrayToOptions(sunstoneConfig?.supported_fs || [], {
      addEmpty: true,
      getText: (fs) => fs.toUpperCase(),
      getValue: (fs) => fs,
    })
  },
  validation: string()
    .trim()
    .afterSubmit((value) => (value === '' ? undefined : value)),
  grid: { md: 6 },
}

/**
 * @returns {Field[]} Fields
 */
export const FIELDS = [
  DEV_PREFIX,
  DEVICE,
  CUSTOM_DEV_PREFIX,
  FORMAT_FIELD,
  FS,
  CUSTOM_FORMAT,
]

/**
 * @returns {ObjectSchema} Schema
 */
export const SCHEMA = object(getValidationFromFields(FIELDS))
