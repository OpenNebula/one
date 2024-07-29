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

import { useGetUsersQuery } from 'client/features/OneApi/user'
import { useGetGroupsQuery } from 'client/features/OneApi/group'
import { OPTION_SORTERS, Field, arrayToOptions } from 'client/utils'
import { T, INPUT_TYPES } from 'client/constants'

/** @type {Field} User id field */
export const UID_FIELD = {
  name: 'AS_UID',
  label: T.InstantiateAsUser,
  type: INPUT_TYPES.AUTOCOMPLETE,
  values: () => {
    const { data: users = [] } = useGetUsersQuery()

    return arrayToOptions(users, {
      addEmpty: false,
      getText: ({ ID, NAME }) => `#${ID} ${NAME}`,
      getValue: ({ ID }) => ID,
      sorter: OPTION_SORTERS.numeric,
    })
  },
  validation: string()
    .trim()
    .notRequired()
    .default(() => undefined),
  grid: { md: 6 },
}

/** @type {Field} Group id field */
export const GID_FIELD = {
  name: 'AS_GID',
  label: T.InstantiateAsGroup,
  type: INPUT_TYPES.AUTOCOMPLETE,
  values: () => {
    const { data: groups = [] } = useGetGroupsQuery()

    return arrayToOptions(groups, {
      addEmpty: false,
      getText: ({ ID, NAME }) => `#${ID} ${NAME}`,
      getValue: ({ ID }) => ID,
      sorter: OPTION_SORTERS.numeric,
    })
  },
  validation: string()
    .trim()
    .notRequired()
    .default(() => undefined),
  grid: { md: 6 },
}

/** @type {Field[]} List of ownership fields */
export const FIELDS = [UID_FIELD, GID_FIELD]
