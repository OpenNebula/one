import * as yup from 'yup'

import { INPUT_TYPES } from 'client/constants'
import { getValidationFromFields } from 'client/utils'

const NAME = {
  name: 'name',
  label: 'Application name',
  type: INPUT_TYPES.TEXT,
  validation: yup
    .string()
    .trim()
    .default(() => undefined)
}

const INSTANCES = {
  name: 'instances',
  label: 'Number of instances',
  type: INPUT_TYPES.TEXT,
  htmlType: 'number',
  validation: yup
    .number()
    .min(1, 'Instances minimum is 1')
    .integer('Instances should be an integer number')
    .required('Instances field is required')
    .default(1)
}

export const FORM_FIELDS = [NAME, INSTANCES]

export const STEP_FORM_SCHEMA = yup.object(
  getValidationFromFields(FORM_FIELDS)
)
