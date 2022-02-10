/* ------------------------------------------------------------------------- *
 * Copyright 2002-2021, OpenNebula Project, OpenNebula Systems               *
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

import { useGroup, useUser } from 'client/features/One'
import { T, INPUT_TYPES } from 'client/constants'
import { Field } from 'client/utils'

/** @type {Field} User id field */
export const UID_FIELD = {
  name: 'AS_UID',
  label: T.InstantiateAsUser,
  type: INPUT_TYPES.AUTOCOMPLETE,
  values: () => {
    const users = useUser()

    return users
      .map(({ ID: value, NAME: text }) => ({ text, value }))
      .sort((a, b) => a.value - b.value)
  },
  validation: string().trim().notRequired().default(undefined),
  grid: { md: 12 },
}

/** @type {Field} Group id field */
export const GID_FIELD = {
  name: 'AS_GID',
  label: T.InstantiateAsGroup,
  type: INPUT_TYPES.AUTOCOMPLETE,
  values: () => {
    const groups = useGroup()

    return groups
      .map(({ ID: value, NAME: text }) => ({ text, value }))
      .sort((a, b) => a.value - b.value)
  },
  validation: string().trim().notRequired().default(undefined),
  grid: { md: 12 },
}

/** @type {Field[]} List of ownership fields */
export const FIELDS = [UID_FIELD, GID_FIELD]
