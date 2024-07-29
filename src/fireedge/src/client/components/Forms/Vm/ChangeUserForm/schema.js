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

import { UsersTable } from 'client/components/Tables'
import { getValidationFromFields } from 'client/utils'
import { T, INPUT_TYPES } from 'client/constants'

const USER = {
  name: 'user',
  label: T.SelectTheNewOwner,
  type: INPUT_TYPES.TABLE,
  Table: () => UsersTable,
  validation: string()
    .trim()
    .required()
    .default(() => undefined),
  grid: { md: 12 },
}

export const FIELDS = [USER]

export const SCHEMA = object(getValidationFromFields(FIELDS))
