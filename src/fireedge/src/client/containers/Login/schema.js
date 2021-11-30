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
/* eslint-disable jsdoc/require-jsdoc */
import * as yup from 'yup'

import { useAuth } from 'client/features/Auth'
import { getValidationFromFields, arrayToOptions } from 'client/utils'
import { Tr } from 'client/components/HOC'
import { T, INPUT_TYPES, FILTER_POOL } from 'client/constants'

export const USERNAME = {
  name: 'user',
  label: T.Username,
  type: INPUT_TYPES.TEXT,
  validation: yup
    .string()
    .trim()
    .required('Username is a required field')
    .default(() => ''),
  grid: { md: 12 },
  fieldProps: {
    autoFocus: true,
    required: true,
    autoComplete: 'username',
    size: 'medium',
  },
}

export const PASSWORD = {
  name: 'token',
  label: T.Password,
  type: INPUT_TYPES.PASSWORD,
  validation: yup
    .string()
    .trim()
    .required('Password is a required field')
    .default(() => ''),
  grid: { md: 12 },
  fieldProps: {
    required: true,
    autoComplete: 'current-password',
    size: 'medium',
  },
}

export const REMEMBER = {
  name: 'remember',
  label: T.KeepLoggedIn,
  type: INPUT_TYPES.CHECKBOX,
  validation: yup.boolean().default(() => false),
  grid: { md: 12 },
}

export const TOKEN = {
  name: 'token2fa',
  label: T.Token2FA,
  type: INPUT_TYPES.TEXT,
  validation: yup
    .string()
    .trim()
    .required('Authenticator is a required field')
    .default(() => ''),
  grid: { md: 12 },
  fieldProps: {
    autoFocus: true,
    required: true,
    margin: 'normal',
  },
}

export const GROUP = {
  name: 'group',
  label: T.SelectGroup,
  type: INPUT_TYPES.SELECT,
  values: () => {
    const { user, groups } = useAuth()

    const sortedGroupsById = groups?.sort((a, b) => a.ID - b.ID)

    const formatGroups = arrayToOptions(sortedGroupsById, {
      addEmpty: false,
      getText: ({ ID, NAME }) => {
        const isPrimary = user?.GID === ID ? `(${Tr(T.Primary)})` : ''

        return `${ID} - ${NAME} ${isPrimary}`
      },
      getValue: ({ ID }) => String(ID),
    })

    return [{ text: T.ShowAll, value: FILTER_POOL.ALL_RESOURCES }].concat(
      formatGroups
    )
  },
  validation: yup.string().trim().nullable().default(FILTER_POOL.ALL_RESOURCES),
  grid: { md: 12 },
  fieldProps: {
    margin: 'normal',
  },
}

export const FORM_USER_FIELDS = [USERNAME, PASSWORD, REMEMBER]
export const FORM_2FA_FIELDS = [TOKEN]
export const FORM_GROUP_FIELDS = [GROUP]

export const FORM_USER_SCHEMA = yup.object(
  getValidationFromFields(FORM_USER_FIELDS)
)
export const FORM_2FA_SCHEMA = yup.object(
  getValidationFromFields(FORM_2FA_FIELDS)
)
export const FORM_GROUP_SCHEMA = yup.object(
  getValidationFromFields(FORM_GROUP_FIELDS)
)
