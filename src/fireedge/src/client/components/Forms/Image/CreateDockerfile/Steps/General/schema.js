/* ------------------------------------------------------------------------- *
 * Copyright 2002-2022, OpenNebula Project, OpenNebula Systems               *
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
import { string, boolean, number, object, ObjectSchema } from 'yup'
import { Field, getValidationFromFields } from 'client/utils'
import { T, INPUT_TYPES } from 'client/constants'

export const IMAGE_LOCATION_TYPES = {
  PATH: 'path',
  UPLOAD: 'upload',
  EMPTY: 'empty',
}

/** @type {Field} Name field */
export const NAME = {
  name: 'NAME',
  label: T.Name,
  type: INPUT_TYPES.TEXT,
  validation: string().trim().required(),
  grid: { xs: 12, md: 6 },
}

/** @type {Field} Context field */
export const CONTEXT = {
  name: 'CONTEXT',
  label: T.Context,
  type: INPUT_TYPES.SWITCH,
  validation: boolean().yesOrNo(),
  grid: { xs: 12, md: 6 },
}

/** @type {Field} Size field */
export const SIZE = {
  name: 'SIZE',
  htmlType: 'number',
  label: T.Size,
  type: INPUT_TYPES.TEXT,
  tooltip: T.ImageSize,
  validation: number().positive().required(),
  grid: { md: 12 },
}

/**
 * @returns {Field[]} Fields
 */
export const FIELDS = [NAME, CONTEXT, SIZE]

/**
 * @param {object} [stepProps] - Step props
 * @returns {ObjectSchema} Schema
 */
export const SCHEMA = object(getValidationFromFields(FIELDS))
