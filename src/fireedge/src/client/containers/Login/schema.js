import React from 'react'

import SelectedIcon from '@material-ui/icons/FilterVintage'
import * as yup from 'yup'

import useAuth from 'client/hooks/useAuth'
import useOpennebula from 'client/hooks/useOpennebula'
import { INPUT_TYPES, FILTER_POOL } from 'client/constants'
import { getValidationFromFields } from 'client/utils/helpers'
import {
  Username,
  Password,
  KeepLoggedIn,
  Token2FA,
  SelectGroup,
  ShowAll
} from 'client/constants/translates'

export const USERNAME = {
  name: 'user',
  label: Username,
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
  label: Password,
  type: INPUT_TYPES.TEXT,
  htmlType: 'password',
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
  label: KeepLoggedIn,
  type: INPUT_TYPES.CHECKBOX,
  validation: yup
    .boolean()
    .default(false),
  grid: { md: 12 }
}

export const TOKEN = {
  name: 'token2fa',
  label: Token2FA,
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
  label: SelectGroup,
  type: INPUT_TYPES.SELECT,
  values: () => {
    const { authUser } = useAuth()
    const { groups } = useOpennebula()

    return [{ text: ShowAll, value: FILTER_POOL.ALL_RESOURCES }]
      .concat(groups
        .sort((a, b) => a.ID - b.ID)
        .map(({ ID, NAME }) => ({
          text: (
            <>
              {`${ID} - ${String(NAME)}`}
              {authUser?.GID === ID && (
                <SelectedIcon style={{ fontSize: '1rem', marginLeft: 16 }} />
              )}
            </>
          ),
          value: String(ID)
        }))
      )
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
