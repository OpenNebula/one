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
import { INPUT_TYPES, T } from 'client/constants'
import { boolean, mixed, object, string } from 'yup'
// eslint-disable-next-line no-unused-vars
import { Field, ObjectSchema, getValidationFromFields } from 'client/utils'

/** @type {Field} Body message field */
export const BODY = {
  name: 'BODY',
  label: `${T.Description} (${T.WeSupportMarkdown})`,
  type: INPUT_TYPES.TEXT,
  multiline: true,
  validation: string().trim().required(),
  grid: { xs: 12, md: 12 },
}

/** @type {Field} Solved field */
export const SOLVED = {
  name: 'SOLVED',
  label: T.MarkAsclosed,
  type: INPUT_TYPES.CHECKBOX,
  validation: boolean().default(() => false),
  grid: { xs: 12, md: 12 },
}

/** @type {Field} Attachment field */
export const ATTACHMENTS = {
  name: 'ATTACHMENTS',
  label: T.Upload,
  type: INPUT_TYPES.FILE,
  validation: mixed()
    .notRequired()
    .test('fileSize', T.FileTooLarge, (value) =>
      value?.size ? value.size <= 50 * 1024 ** 2 : true
    ),
  grid: { xs: 12, md: 12 },
}

/**
 * @returns {Field[]} Fields
 */
export const FIELDS = [BODY, SOLVED, ATTACHMENTS]

/**
 * @param {object} [stepProps] - Step props
 * @returns {ObjectSchema} Schema
 */
export const SCHEMA = object(getValidationFromFields(FIELDS))
