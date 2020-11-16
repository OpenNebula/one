import * as yup from 'yup'

export const STEP_FORM_SCHEMA = yup
  .array(yup.string().trim())
  .min(1, 'Select provision template')
  .max(1, 'Max. one template selected')
  .required('Provision template field is required')
  .default([])
