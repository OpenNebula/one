import * as React from 'react'

import { VerifiedBadge as SelectIcon } from 'iconoir-react'
import * as yup from 'yup'

import { useAuth } from 'client/features/Auth'
import { getValidationFromFields } from 'client/utils'
import { T, INPUT_TYPES, FILTER_POOL } from 'client/constants'

export const USERNAME = {
  name: 'user',
  label: T.Username,
  type: INPUT_TYPES.TEXT,
  validation: yup
    .string()
    .trim()
    .required('Username is a required field')
    .default(null),
  grid: { md: 12 },
  fieldProps: {
    autoFocus: true,
    required: true,
    autoComplete: 'username',
    variant: 'outlined'
  }
}

export const PASSWORD = {
  name: 'token',
  label: T.Password,
  type: INPUT_TYPES.PASSWORD,
  validation: yup
    .string()
    .trim()
    .required('Password is a required field')
    .default(null),
  grid: { md: 12 },
  fieldProps: {
    required: true,
    autoComplete: 'current-password',
    variant: 'outlined'
  }
}

export const REMEMBER = {
  name: 'remember',
  label: T.KeepLoggedIn,
  type: INPUT_TYPES.CHECKBOX,
  validation: yup
    .boolean()
    .default(false),
  grid: { md: 12 }
}

export const TOKEN = {
  name: 'token2fa',
  label: T.Token2FA,
  type: INPUT_TYPES.TEXT,
  validation: yup
    .string()
    .trim()
    .required('Authenticator is a required field')
    .default(null),
  grid: { md: 12 },
  fieldProps: {
    autoFocus: true,
    required: true,
    variant: 'outlined'
  }
}

export const GROUP = {
  name: 'group',
  label: T.SelectGroup,
  type: INPUT_TYPES.SELECT,
  values: () => {
    const { user, groups } = useAuth()

    const sortedGroupsById = groups?.sort((a, b) => a.ID - b.ID)

    const formatGroups = sortedGroupsById.map(({ ID, NAME }) => {
      const markAsPrimary = user?.GID === ID ? (
        <span style={{ marginLeft: 16 }}>
          <SelectIcon size='1rem' />
        </span>
      ) : null

      return {
        text: <>{`${ID} - ${String(NAME)}`}{markAsPrimary}</>,
        value: String(ID)
      }
    })

    return [{ text: T.ShowAll, value: FILTER_POOL.ALL_RESOURCES }]
      .concat(formatGroups)
  },
  validation: yup
    .string()
    .trim()
    .nullable()
    .default(FILTER_POOL.ALL_RESOURCES),
  grid: { md: 12 },
  fieldProps: { variant: 'outlined' }
}

export const FORM_USER_FIELDS = [USERNAME, PASSWORD, REMEMBER]
export const FORM_2FA_FIELDS = [TOKEN]
export const FORM_GROUP_FIELDS = [GROUP]

export const FORM_USER_SCHEMA = yup.object(getValidationFromFields(FORM_USER_FIELDS))
export const FORM_2FA_SCHEMA = yup.object(getValidationFromFields(FORM_2FA_FIELDS))
export const FORM_GROUP_SCHEMA = yup.object(getValidationFromFields(FORM_GROUP_FIELDS))
