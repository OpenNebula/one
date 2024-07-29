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
import { string, boolean, object } from 'yup'

import { useAuth } from 'client/features/Auth'
import { getValidationFromFields, arrayToOptions } from 'client/utils'
import { Tr } from 'client/components/HOC'
import { T, INPUT_TYPES, FILTER_POOL, SERVER_CONFIG } from 'client/constants'

const USERNAME = {
  name: 'user',
  label: T.Username,
  type: INPUT_TYPES.TEXT,
  validation: string()
    .trim()
    .required()
    .default(() => ''),
  grid: { md: 12 },
  fieldProps: {
    autoFocus: true,
    required: true,
    autoComplete: 'username',
    size: 'medium',
  },
}

const PASSWORD = {
  name: 'token',
  label: T.Password,
  type: INPUT_TYPES.PASSWORD,
  validation: string()
    .trim()
    .required()
    .default(() => ''),
  grid: { md: 12 },
  fieldProps: {
    required: true,
    autoComplete: 'current-password',
    size: 'medium',
  },
}

const REMEMBER = {
  name: 'remember',
  label: T.KeepLoggedIn,
  type: INPUT_TYPES.CHECKBOX,
  validation: boolean().default(() => false),
  grid: { md: 12 },
}

const TOKEN = {
  name: 'token2fa',
  label: T.Token2FA,
  type: INPUT_TYPES.TEXT,
  validation: string()
    .trim()
    .required()
    .default(() => ''),
  grid: { md: 12 },
  fieldProps: {
    autoFocus: true,
    required: true,
    margin: 'normal',
  },
}

const GROUP = {
  name: 'group',
  label: T.SelectYourActiveGroup,
  type: INPUT_TYPES.AUTOCOMPLETE,
  optionsOnly: true,
  values: () => {
    const { user, groups } = useAuth()
    const primaryText = Tr(T.Primary)

    const formatGroups = arrayToOptions(groups, {
      addEmpty: false,
      getText: ({ ID, NAME }) => {
        const isPrimary = user?.GID === ID ? `(${primaryText})` : ''

        return `${ID} - ${NAME} ${isPrimary}`
      },
      getValue: ({ ID }) => String(ID),
      sorter: (a, b) => a.ID - b.ID,
    })

    return [{ text: T.ShowAll, value: FILTER_POOL.ALL_RESOURCES }].concat(
      formatGroups
    )
  },
  validation: string().trim().nullable().default(FILTER_POOL.ALL_RESOURCES),
  grid: { md: 12 },
  fieldProps: {
    margin: 'normal',
  },
}

const FORM_USER_FIELDS = [
  USERNAME,
  PASSWORD,
  `${SERVER_CONFIG?.keep_me_logged}` === 'true' && REMEMBER,
].filter(Boolean)

const FORM_2FA_FIELDS = [TOKEN]

const FORM_GROUP_FIELDS = [GROUP]

const FORM_USER_SCHEMA = object(getValidationFromFields(FORM_USER_FIELDS))

const FORM_2FA_SCHEMA = object(getValidationFromFields(FORM_2FA_FIELDS))

const FORM_GROUP_SCHEMA = object(getValidationFromFields(FORM_GROUP_FIELDS))

export {
  FORM_USER_FIELDS,
  FORM_2FA_FIELDS,
  FORM_GROUP_FIELDS,
  FORM_USER_SCHEMA,
  FORM_2FA_SCHEMA,
  FORM_GROUP_SCHEMA,
}
