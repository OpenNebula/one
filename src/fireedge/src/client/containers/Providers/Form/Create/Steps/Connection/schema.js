import * as yup from 'yup'
import { INPUT_TYPES } from 'client/constants'
import { capitalize, getValidationFromFields } from 'client/utils'

export const FORM_FIELDS = connection =>
  Object.entries(connection)?.map(([name, value]) => ({
    name,
    label: capitalize(name),
    type: INPUT_TYPES.TEXT,
    validation: yup
      .string()
      .trim()
      .required(`${name} field is required`)
      .default(value)
  }))

export const STEP_FORM_SCHEMA = connection => yup.object(
  getValidationFromFields(FORM_FIELDS(connection))
)
