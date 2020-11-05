import * as yup from 'yup'
import { INPUT_TYPES } from 'client/constants'
import { getValidationFromFields } from 'client/utils'

export const FORM_FIELDS = connection =>
  Object.entries(connection)?.map(([name, label]) => ({
    name,
    label,
    type: INPUT_TYPES.TEXT,
    validation: yup
      .string()
      .trim()
      .required(`${label} field is required`)
      .default('')
  }))

export const STEP_FORM_SCHEMA = connection => yup.object(
  getValidationFromFields(FORM_FIELDS(connection))
)
