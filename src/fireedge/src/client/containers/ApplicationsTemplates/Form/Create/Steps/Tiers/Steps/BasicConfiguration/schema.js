import * as yup from 'yup'
import { INPUT_TYPES } from 'client/constants'
import { getValidationFromFields } from 'client/utils'

const SHUTDOWN_ACTIONS = [
  { text: 'None', value: 'none' },
  { text: 'Shutdown', value: 'shutdown' },
  { text: 'Shutdown hard', value: 'shutdown-hard' }
]

const NAME = {
  name: 'name',
  label: 'Name',
  type: INPUT_TYPES.TEXT,
  validation: yup
    .string()
    .trim()
    .matches(/^\w+$/g, { message: 'Invalid characters' })
    .required('Name field is required')
    .default('')
}

const CARDINALITY = {
  name: 'cardinality',
  label: 'Cardinality',
  type: INPUT_TYPES.TEXT,
  htmlType: 'number',
  validation: yup
    .number()
    .min(1, 'Cardinality field is required')
    .required('Cardinality field is required')
    .default(1)
}

const SHUTDOWN_ACTION = {
  name: 'shutdown_action',
  label: 'Select a VM shutdown action',
  type: INPUT_TYPES.SELECT,
  values: SHUTDOWN_ACTIONS,
  validation: yup
    .string()
    .notRequired()
    .oneOf(SHUTDOWN_ACTIONS.map(({ value }) => value))
    .default(SHUTDOWN_ACTIONS[0].value)
}

export const FORM_FIELDS = [
  NAME,
  CARDINALITY,
  SHUTDOWN_ACTION
]

export const STEP_FORM_SCHEMA = yup.object(
  getValidationFromFields(FORM_FIELDS)
)
