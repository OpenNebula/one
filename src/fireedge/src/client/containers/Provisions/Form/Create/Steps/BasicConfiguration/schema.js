import * as yup from 'yup'
import { INPUT_TYPES } from 'client/constants'
import { getValidationFromFields } from 'client/utils'

const NAME = {
  name: 'name',
  label: 'Name',
  type: INPUT_TYPES.TEXT,
  validation: yup
    .string()
    .min(1, 'Name field is required')
    .trim()
    .required('Name field is required')
    .default('')
}

const DESCRIPTION = {
  name: 'description',
  label: 'Description',
  type: INPUT_TYPES.TEXT,
  multiline: true,
  validation: yup
    .string()
    .trim()
    .default('')
}

export const FORM_FIELDS = [NAME, DESCRIPTION]

export const STEP_FORM_SCHEMA = yup.object(
  getValidationFromFields(FORM_FIELDS)
)
