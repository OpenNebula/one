import * as yup from 'yup'

export const STEP_FORM_SCHEMA = yup
  .array(yup.object())
  .min(1, 'Select provider template')
  .max(1, 'Max. one template selected')
  .required('Provider template field is required')
  .default([])
