import * as yup from 'yup'

export const STEP_FORM_SCHEMA = yup
  .array(yup.string().trim())
  .min(1, 'Select cluster')
  .max(1, 'Max. one cluster selected')
  .required('Cluster field is required')
  .default([])
