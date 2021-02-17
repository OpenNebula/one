import * as yup from 'yup'

export const STEP_FORM_SCHEMA = yup
  .array(yup.object())
  .min(1, 'Select provider')
  .max(1, 'Max. one provider selected')
  .required('Provider field is required')
  .default([])
