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
import { string, boolean, number, object, ObjectSchema, mixed, lazy } from 'yup'
import {
  Field,
  arrayToOptions,
  getValidationFromFields,
  upperCaseFirst,
  disableFields,
} from '@UtilsModule'
import {
  T,
  INPUT_TYPES,
  IMAGE_TYPES_STR,
  IMAGE_TYPES_FOR_IMAGES,
  RESTRICTED_ATTRIBUTES_TYPE,
} from '@ConstantsModule'

export const IMAGE_LOCATION_TYPES = {
  PATH: 'path',
  UPLOAD: 'upload',
  EMPTY: 'empty',
}

const IMAGE_LOCATION = {
  [IMAGE_LOCATION_TYPES.PATH]: T.Path,
  [IMAGE_LOCATION_TYPES.UPLOAD]: T.Upload,
  [IMAGE_LOCATION_TYPES.EMPTY]: T.EmptyDisk,
}

/**
 * @param {Array|string} opts - Allowed values to show the field
 * @param {boolean} inputNumber - If the field is number or not
 * @param {string} conditionType - Type of condition to check the values (AND, OR)
 * @returns {function(string|Array): string} - Function to set the html type of the field
 */
export const htmlType =
  (opts, inputNumber, conditionType = 'OR') =>
  (location) => {
    const currentValues = Array.isArray(location) ? location : [location]

    let hasMatch = false

    if (conditionType.toUpperCase() === 'AND') {
      hasMatch = currentValues.every((val, index) => {
        const allowedForPosition = Array.isArray(opts[index])
          ? opts[index]
          : [opts[index]]

        return allowedForPosition.includes(val)
      })
    } else {
      const flatOpts = opts.flat()
      hasMatch = currentValues.some((val) => flatOpts.includes(val))
    }

    if (hasMatch && inputNumber) {
      return 'number'
    }

    return !hasMatch && INPUT_TYPES.HIDDEN
  }

/** @type {Field} name field */
export const NAME = {
  name: 'NAME',
  label: T.Name,
  type: INPUT_TYPES.TEXT,
  validation: string().trim().required(),
  grid: { md: 12 },
}

/** @type {Field} Description field */
export const DESCRIPTION = {
  name: 'DESCRIPTION',
  label: T.Description,
  type: INPUT_TYPES.TEXT,
  multiline: true,
  validation: string().trim(),
  grid: { md: 12 },
}

/** @type {Field} Type field */
export const TYPE = {
  name: 'TYPE',
  label: T.Type,
  type: INPUT_TYPES.AUTOCOMPLETE,
  optionsOnly: true,
  values: arrayToOptions(Object.values(IMAGE_TYPES_FOR_IMAGES), {
    addEmpty: false,
    getText: (type) => {
      switch (type) {
        case IMAGE_TYPES_STR.OS:
          return T.Os
        case IMAGE_TYPES_STR.CDROM:
          return T.Cdrom
        case IMAGE_TYPES_STR.DATABLOCK:
          return T.Datablock
        case IMAGE_TYPES_STR.FILESYSTEM:
          return T.Filesystem
        default:
          return upperCaseFirst(type.toLowerCase())
      }
    },
    getValue: (type) => type,
  }),
  validation: string()
    .trim()
    .default(() => IMAGE_TYPES_STR.OS),
  grid: { xs: 12, md: 6 },
}

/** @type {Field} Persistent field */
export const PERSISTENT = {
  name: 'PERSISTENT',
  label: T.MakePersistent,
  type: INPUT_TYPES.SWITCH,
  validation: boolean().yesOrNo(),
  grid: { xs: 12, md: 6 },
}

/** @type {Field} Toggle select type image */
export const IMAGE_LOCATION_FIELD = {
  name: 'IMAGE_LOCATION',
  type: INPUT_TYPES.TOGGLE,
  dependOf: TYPE.name,
  htmlType: htmlType([
    IMAGE_TYPES_STR.OS,
    IMAGE_TYPES_STR.CDROM,
    IMAGE_TYPES_STR.DATABLOCK,
  ]),
  values: arrayToOptions(Object.entries(IMAGE_LOCATION), {
    addEmpty: false,
    getText: ([_, name]) => name,
    getValue: ([image]) => image,
  }),
  validation: lazy((value, { context }) =>
    string()
      .trim()
      .when(TYPE.name, (typeInput, schema) =>
        typeInput === IMAGE_TYPES_STR.FILESYSTEM
          ? schema.strip()
          : schema.required()
      )
      .default(() =>
        context.general.TYPE !== IMAGE_TYPES_STR.FILESYSTEM
          ? IMAGE_LOCATION_TYPES.PATH
          : undefined
      )
  ),
  grid: { md: 12 },
  notNull: true,
}

/** @type {Field} path field */
export const PATH_FIELD = {
  name: 'PATH',
  dependOf: [IMAGE_LOCATION_FIELD.name, TYPE.name],
  htmlType: htmlType([
    [IMAGE_LOCATION_TYPES.PATH, undefined],
    [IMAGE_TYPES_STR.FILESYSTEM],
  ]),
  label: T.ImagePath,
  type: INPUT_TYPES.TEXT,
  validation: string()
    .trim()
    .when([IMAGE_LOCATION_FIELD.name, TYPE.name], {
      is: (location, type) =>
        location === IMAGE_LOCATION_TYPES.PATH ||
        type === IMAGE_TYPES_STR.FILESYSTEM,
      then: (schema) => schema.required(),
      otherwise: (schema) => schema.strip(),
    }),
  grid: { md: 12 },
}

/** @type {Field} upload field */
export const UPLOAD_FIELD = {
  name: 'UPLOAD',
  dependOf: [IMAGE_LOCATION_FIELD.name, TYPE.name],
  htmlType: htmlType(
    [
      [IMAGE_LOCATION_TYPES.UPLOAD],
      [IMAGE_TYPES_STR.OS, IMAGE_TYPES_STR.CDROM, IMAGE_TYPES_STR.DATABLOCK],
    ],
    false,
    'AND'
  ),
  label: T.Upload,
  type: INPUT_TYPES.FILE,
  validation: mixed().when([IMAGE_LOCATION_FIELD.name, TYPE.name], {
    is: (location, type) =>
      location === IMAGE_LOCATION_TYPES.UPLOAD &&
      type !== IMAGE_TYPES_STR.FILESYSTEM,
    then: (schema) => schema.required(),
    otherwise: (schema) => schema.strip(),
  }),
  grid: { md: 12 },
}

/** @type {Field} size field */
export const SIZE = {
  name: 'SIZE',
  dependOf: [IMAGE_LOCATION_FIELD.name, TYPE.name],
  htmlType: htmlType(
    [
      [IMAGE_LOCATION_TYPES.EMPTY],
      [IMAGE_TYPES_STR.OS, IMAGE_TYPES_STR.CDROM, IMAGE_TYPES_STR.DATABLOCK],
    ],
    true,
    'AND'
  ),
  label: T.Size,
  type: INPUT_TYPES.UNITS,
  tooltip: T.ImageSizeUnit,
  validation: number()
    .positive()
    .default(() => undefined)
    .when([IMAGE_LOCATION_FIELD.name, TYPE.name], {
      is: (location, type) =>
        location === IMAGE_LOCATION_TYPES.EMPTY &&
        type !== IMAGE_TYPES_STR.FILESYSTEM,
      then: (schema) => schema.required(),
      otherwise: (schema) => schema.strip(),
    }),
  grid: { md: 12 },
}

/**
 * @param {object} oneConfig - Open Nebula configuration
 * @param {boolean} adminGroup - If the user belongs to oneadmin group
 * @returns {Field[]} Fields
 */
export const FIELDS = (oneConfig, adminGroup) =>
  disableFields(
    [
      NAME,
      DESCRIPTION,
      TYPE,
      PERSISTENT,
      IMAGE_LOCATION_FIELD,
      PATH_FIELD,
      UPLOAD_FIELD,
      SIZE,
    ],
    '',
    oneConfig,
    adminGroup,
    RESTRICTED_ATTRIBUTES_TYPE.IMAGE
  )

/**
 * @param {object} oneConfig - Open Nebula configuration
 * @param {boolean} adminGroup - If the user belongs to oneadmin group
 * @returns {ObjectSchema} Schema
 */
export const SCHEMA = (oneConfig, adminGroup) =>
  object(getValidationFromFields(FIELDS(oneConfig, adminGroup)))
