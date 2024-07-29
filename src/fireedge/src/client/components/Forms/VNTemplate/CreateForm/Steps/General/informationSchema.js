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
import { string } from 'yup'

import { INPUT_TYPES, T } from 'client/constants'
import { Field } from 'client/utils'

/**
 * @param {boolean} isUpdate - If `true`, the form is being updated
 * @returns {Field} Name field
 */
export const NAME_FIELD = (isUpdate = false) => ({
  name: 'NAME',
  label: T.Name,
  type: INPUT_TYPES.TEXT,
  validation: string()
    .trim()
    .required()
    .default(() => undefined)
    // if the form is updating then display the name but not change it
    .afterSubmit((name) => (isUpdate ? undefined : name)),
  grid: { md: 12 },
  fieldProps: { disabled: isUpdate },
})

/** @type {Field} Description field */
export const DESCRIPTION_FIELD = {
  name: 'DESCRIPTION',
  label: T.Description,
  type: INPUT_TYPES.TEXT,
  multiline: true,
  validation: string()
    .trim()
    .notRequired()
    .default(() => undefined)
    .afterSubmit((description) => description),
  grid: { md: 12 },
}

/**
 * @param {boolean} isUpdate - If `true`, the form is being updated
 * @returns {Field[]} List of information fields
 */
export const FIELDS = (isUpdate) =>
  [NAME_FIELD(isUpdate), DESCRIPTION_FIELD].filter(Boolean)
