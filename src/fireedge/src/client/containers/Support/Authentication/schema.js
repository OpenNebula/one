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
import { string, object } from 'yup'

import { getValidationFromFields } from 'client/utils'
import { T, INPUT_TYPES } from 'client/constants'

const EMAIL = {
  name: 'user',
  label: T.Email,
  type: INPUT_TYPES.TEXT,
  validation: string()
    .trim()
    .required()
    .email()
    .default(() => ''),
  grid: { md: 12 },
  fieldProps: {
    size: 'medium',
  },
}

const PASSWORD = {
  name: 'pass',
  label: T.Password,
  type: INPUT_TYPES.PASSWORD,
  validation: string()
    .trim()
    .required()
    .default(() => ''),
  grid: { md: 12 },
  fieldProps: {
    size: 'medium',
  },
}

const FORM_USER_FIELDS = [EMAIL, PASSWORD].filter(Boolean)

const FORM_USER_SCHEMA = object(getValidationFromFields(FORM_USER_FIELDS))

export { FORM_USER_FIELDS, FORM_USER_SCHEMA }
