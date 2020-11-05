import * as yup from 'yup'

export const STEP_FORM_SCHEMA = yup
  .array(yup.string().trim())
  .min(1, 'Select location')
  .max(1, 'Max. one location selected')
  .required('Location field is required')
  .default([])
