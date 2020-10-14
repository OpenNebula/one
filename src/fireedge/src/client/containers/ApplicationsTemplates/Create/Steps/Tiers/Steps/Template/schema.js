import * as yup from 'yup'
import { getValidationFromFields } from 'client/utils/helpers'

export const FORM_FIELDS = [
  {
    name: 'id',
    validation: yup.number().min(0, 'Invalid template')
  },
  {
    name: 'app',
    validation: yup.number().min(0, 'Invalid market app template')
  },
  {
    name: 'docker',
    validation: yup.string().trim()
  }
]

export const STEP_FORM_SCHEMA = yup
  .object(getValidationFromFields(FORM_FIELDS))
  .required('Template is required')
  .default(undefined)
