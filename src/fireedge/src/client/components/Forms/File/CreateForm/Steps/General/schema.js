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
import { string, object, ObjectSchema, mixed } from 'yup'
import {
  Field,
  arrayToOptions,
  getValidationFromFields,
  upperCaseFirst,
} from 'client/utils'
import {
  T,
  INPUT_TYPES,
  IMAGE_TYPES_STR,
  IMAGE_TYPES_FOR_FILES,
} from 'client/constants'

export const IMAGE_LOCATION_TYPES = {
  PATH: 'path',
  UPLOAD: 'upload',
}

const IMAGE_LOCATION = {
  [IMAGE_LOCATION_TYPES.PATH]: T.Path,
  [IMAGE_LOCATION_TYPES.UPLOAD]: T.Upload,
}

const htmlType = (opt, inputNumber) => (location) => {
  if (location === opt && inputNumber) {
    return 'number'
  }

  return location !== opt && INPUT_TYPES.HIDDEN
}

/** @type {Field} name field */
export const NAME = {
  name: 'NAME',
  label: T.Name,
  type: INPUT_TYPES.TEXT,
  validation: string().trim().required(),
  grid: { xs: 12, md: 6 },
}

/** @type {Field} Description field */
export const DESCRIPTION = {
  name: 'DESCRIPTION',
  label: T.Description,
  type: INPUT_TYPES.TEXT,
  multiline: true,
  validation: string().trim(),
  grid: { xs: 12, md: 6 },
}

/** @type {Field} Type field */
export const TYPE = {
  name: 'TYPE',
  label: T.Type,
  type: INPUT_TYPES.AUTOCOMPLETE,
  optionsOnly: true,
  values: arrayToOptions(Object.values(IMAGE_TYPES_FOR_FILES), {
    addEmpty: false,
    getText: (type) => {
      switch (type) {
        case IMAGE_TYPES_STR.OS:
          return T.Os
        case IMAGE_TYPES_STR.CDROM:
          return T.Cdrom
        case IMAGE_TYPES_STR.DATABLOCK:
          return T.Datablock
        default:
          return upperCaseFirst(type.toLowerCase())
      }
    },
    getValue: (type) => type,
  }),
  validation: string()
    .trim()
    .default(() => IMAGE_TYPES_STR.OS),
  grid: { md: 12 },
}

/** @type {Field} Toggle select type image */
export const IMAGE_LOCATION_FIELD = {
  name: 'IMAGE_LOCATION',
  type: INPUT_TYPES.TOGGLE,
  values: arrayToOptions(Object.entries(IMAGE_LOCATION), {
    addEmpty: false,
    getText: ([_, name]) => name,
    getValue: ([image]) => image,
  }),
  validation: string()
    .trim()
    .required()
    .default(() => IMAGE_LOCATION_TYPES.PATH),
  grid: { md: 12 },
  notNull: true,
}

/** @type {Field} path field */
export const PATH_FIELD = {
  name: 'PATH',
  dependOf: IMAGE_LOCATION_FIELD.name,
  htmlType: htmlType(IMAGE_LOCATION_TYPES.PATH),
  label: T.ImagePath,
  type: INPUT_TYPES.TEXT,
  validation: string()
    .trim()
    .when(IMAGE_LOCATION_FIELD.name, {
      is: (location) => location === IMAGE_LOCATION_TYPES.PATH,
      then: (schema) => schema.required(),
      otherwise: (schema) => schema.strip(),
    }),
  grid: { md: 12 },
}

/** @type {Field} upload field */
export const UPLOAD_FIELD = {
  name: 'UPLOAD',
  dependOf: IMAGE_LOCATION_FIELD.name,
  htmlType: htmlType(IMAGE_LOCATION_TYPES.UPLOAD),
  label: T.Upload,
  type: INPUT_TYPES.FILE,
  validation: mixed().when(IMAGE_LOCATION_FIELD.name, {
    is: (location) => location === IMAGE_LOCATION_TYPES.UPLOAD,
    then: (schema) => schema.required(),
    otherwise: (schema) => schema.strip(),
  }),
  grid: { md: 12 },
}

/**
 * @returns {Field[]} Fields
 */
export const FIELDS = [
  NAME,
  DESCRIPTION,
  TYPE,
  IMAGE_LOCATION_FIELD,
  PATH_FIELD,
  UPLOAD_FIELD,
]

/**
 * @param {object} [stepProps] - Step props
 * @returns {ObjectSchema} Schema
 */
export const SCHEMA = object(getValidationFromFields(FIELDS))
