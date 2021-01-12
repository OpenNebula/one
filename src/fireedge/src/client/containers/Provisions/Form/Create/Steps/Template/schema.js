import * as yup from 'yup'
import { getValidationFromFields } from 'client/utils'

const NAME = {
  name: 'name',
  validation: yup
    .string()
    .trim()
    .required('Template field is required')
    .default(undefined)
}

const PROVISION = {
  name: 'provision',
  validation: yup
    .string()
    .trim()
    .required('Provision type field is required')
    .default(undefined)
}

const PROVIDER = {
  name: 'provider',
  validation: yup
    .string()
    .trim()
    .required('Provider type field is required')
    .default(undefined)
}

export const PROVIDER_TEMPLATE_SCHEMA = yup.object(
  getValidationFromFields([NAME, PROVISION, PROVIDER])
)

export const STEP_FORM_SCHEMA = yup
  .array(PROVIDER_TEMPLATE_SCHEMA)
  .min(1, 'Select provision template')
  .max(1, 'Max. one template selected')
  .required('Provision template field is required')
  .default([])
