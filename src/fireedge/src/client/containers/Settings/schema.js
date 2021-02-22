import * as yup from 'yup'
import { T, INPUT_TYPES, SCHEMES, DEFAULT_SCHEME, DEFAULT_LANGUAGE } from 'client/constants'
import { getValidationFromFields } from 'client/utils'

const SCHEME_VALUES = [
  { text: T.System, value: SCHEMES.SYSTEM },
  { text: T.Dark, value: SCHEMES.DARK },
  { text: T.Light, value: SCHEMES.LIGHT }
]

const LANGUAGE_VALUES =
  window?.langs?.map(({ key, value }) => ({ text: value, value: key })) ?? []

const SCHEME = {
  name: 'scheme',
  label: T.Schema,
  type: INPUT_TYPES.SELECT,
  values: SCHEME_VALUES,
  validation: yup
    .string()
    .trim()
    .required('Scheme field is required')
    .default(DEFAULT_SCHEME),
  grid: { md: 12 },
  fieldProps: { variant: 'outlined' }
}

const LANGUAGES = {
  name: 'lang',
  label: T.Language,
  type: INPUT_TYPES.SELECT,
  values: LANGUAGE_VALUES,
  validation: yup
    .string()
    .trim()
    .required('Language field is required')
    .default(DEFAULT_LANGUAGE),
  grid: { md: 12 },
  native: true,
  fieldProps: { variant: 'outlined' }
}

export const FORM_FIELDS = [SCHEME, LANGUAGES]

export const FORM_SCHEMA = yup.object(
  getValidationFromFields(FORM_FIELDS)
)
