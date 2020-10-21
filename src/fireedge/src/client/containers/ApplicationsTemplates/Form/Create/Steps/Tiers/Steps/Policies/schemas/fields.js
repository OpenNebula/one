import * as yup from 'yup'
import { v4 as uuidv4 } from 'uuid'

import { TYPE_INPUT } from 'client/constants'
import { TYPES_POLICY, TIME_FORMATS, hasMinValue, isDateFormat } from './types'

const CRON_REG = /(@(annually|yearly|monthly|weekly|daily|hourly|reboot))|(@every (\d+(ns|us|µs|ms|s|m|h))+)|((((\d+,)+\d+|(\d+(\/|-)\d+)|\d+|\*) ?){5,7})/g

export const ID = {
  name: 'id',
  label: 'ID',
  type: TYPE_INPUT.TEXT,
  htmlType: 'hidden',
  validation: yup
    .string()
    .trim()
    .uuid()
    .required()
    .default(uuidv4)
}

// --------------------------------------------
// Auto-scaling Types
// --------------------------------------------

export const TYPE = {
  name: 'type',
  label: 'Type of adjustment',
  type: TYPE_INPUT.SELECT,
  values: TYPES_POLICY,
  tooltip: `
    CHANGE: Add/subtract the given number of VMs
    CARDINALITY: Set the cardinality to the given number
    PERCENTAGE_CHANGE: Add/subtract the given percentage to the current cardinality`,
  validation: yup
    .string()
    .trim()
    .oneOf(TYPES_POLICY.map(({ value }) => value))
    .required('Type field is required')
    .default(TYPES_POLICY[0].value)
}

export const ADJUST = {
  name: 'adjust',
  label: 'Adjust value',
  type: TYPE_INPUT.TEXT,
  htmlType: 'number',
  tooltip: `
    CHANGE: -2, will subtract 2 VMs from the tier
    CARDINALITY: 9, will set cardinality to 8
    PERCENTAGE_CHANGE: 20, will increment cardinality by 20%`,
  validation: yup
    .number()
    .typeError('Adjust value must be a number')
    .required('Adjust field is required')
    .default(undefined)
}

export const MIN_ADJUST_STEP = {
  name: 'min_adjust_step',
  label: 'Min adjust step',
  type: TYPE_INPUT.TEXT,
  dependOf: TYPE.name,
  tooltip: `
    If present, the policy will change the cardinality by
    at least the number of VMs set in this attribute`,
  htmlType: dependValue => hasMinValue(dependValue) ? TYPE_INPUT.HIDDEN : 'number',
  validation: yup
    .number()
    .typeError('Min. adjust step must be a number')
    .min(1, 'Min. adjust step minimum is 1')
    .when(TYPE.name, (type, schema) =>
      hasMinValue(type) ? schema.strip() : schema
    )
    .notRequired()
    .default(undefined)
}

// --------------------------------------------
// Auto-scaling Based on Metrics
// --------------------------------------------

export const EXPRESSION = {
  name: 'expression',
  label: 'Expression',
  type: TYPE_INPUT.TEXT,
  validation: yup
    .string()
    .trim()
    .required('Expression field is required')
    .default(undefined)
}

export const PERIOD_NUMBER = {
  name: 'period_number',
  label: 'Period number',
  type: TYPE_INPUT.TEXT,
  htmlType: 'number',
  tooltip:
    'Number of periods that the expression must be true before the elasticity is triggered',
  validation: yup
    .number()
    .typeError('Period must be a number')
    .min(0, 'Period number minimum is 0')
    .notRequired()
    .default(undefined)
}

export const PERIOD = {
  name: 'period',
  label: 'Period',
  type: TYPE_INPUT.TEXT,
  htmlType: 'number',
  tooltip: 'Duration, in seconds, of each period in period_number',
  validation: yup
    .number()
    .typeError('Period must be a number')
    .min(0, 'Period minimum is 0')
    .when(PERIOD_NUMBER.name, (value, schema) =>
      value ? schema.strip() : schema
    )
    .notRequired()
    .default(undefined)
}

export const COOLDOWN = {
  name: 'cooldown',
  label: 'Cooldown',
  type: TYPE_INPUT.TEXT,
  htmlType: 'number',
  tooltip: `
    Cooldown period duration after a scale operation, in seconds.
    If it is not set, the one set for the Tier will be used
  `,
  validation: yup
    .number()
    .typeError('Cooldown must be a number')
    .notRequired()
    .default(undefined)
}

// --------------------------------------------
// Auto-scaling Based on a Schedule
// --------------------------------------------

export const TIME_FORMAT = {
  name: 'time_format',
  label: 'Time format',
  type: TYPE_INPUT.SELECT,
  values: TIME_FORMATS,
  tooltip: `
    START TIME: Exact time for the adjustment
    RECURRENCE: Time for recurring adjustments.
      Time is specified with the Unix cron syntax`,
  validation: yup
    .string()
    .trim()
    .notRequired()
    .oneOf(TIME_FORMATS.map(({ value }) => value))
    .default(TIME_FORMATS[0].value)
}

export const TIME_EXPRESSION = {
  name: 'time_expression',
  label: 'Time expression',
  type: TYPE_INPUT.TEXT,
  dependOf: TIME_FORMAT.name,
  htmlType: dependValue => isDateFormat(dependValue)
    ? 'datetime-local' : TYPE_INPUT.TEXT,
  validation: yup
    .string()
    .trim()
    .notRequired()
    .when(TIME_FORMAT.name, (value, schema) =>
      isDateFormat(value)
        ? schema
        : schema.matches(CRON_REG, { message: 'Invalid chars' })
    )
    .default(undefined)
}
