import * as yup from 'yup'
import { T, INPUT_TYPES, SCHEMES, DEFAULT_SCHEME, DEFAULT_LANGUAGE } from 'client/constants'
import { getValidationFromFields } from 'client/utils'

const SCHEME = {
  name: 'scheme',
  label: T.Schema,
  type: INPUT_TYPES.SELECT,
  values: [
    { text: T.System, value: SCHEMES.SYSTEM },
    { text: T.Dark, value: SCHEMES.DARK },
    { text: T.Light, value: SCHEMES.LIGHT }
  ],
  validation: yup
    .string()
    .trim()
    .required('Scheme field is required')
    .default(DEFAULT_SCHEME),
  grid: { md: 12 },
  native: true,
  fieldProps: { variant: 'outlined' }
}

const LANGUAGES = {
  name: 'lang',
  label: T.Language,
  type: INPUT_TYPES.SELECT,
  values: () =>
    window?.langs?.map(({ key, value }) => ({ text: value, value: key })) ?? [],
  validation: yup
    .string()
    .trim()
    .required('Language field is required')
    .default(DEFAULT_LANGUAGE),
  grid: { md: 12 },
  native: true,
  fieldProps: { variant: 'outlined' }
}

const DISABLE_ANIMATIONS = {
  name: 'disableanimations',
  label: T.DisableDashboardAnimations,
  type: INPUT_TYPES.CHECKBOX,
  validation: yup
    .boolean()
    .transform(value => {
      if (typeof value === 'boolean') return value

      return String(value).toUpperCase() === 'YES'
    })
    .default(false),
  grid: { md: 12 }
}

export const FORM_FIELDS = [SCHEME, LANGUAGES, DISABLE_ANIMATIONS]

export const FORM_SCHEMA = yup.object(
  getValidationFromFields(FORM_FIELDS)
)
