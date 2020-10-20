import * as yup from 'yup'

import { getValidationFromFields } from 'client/utils/helpers'

import {
  ID,
  TYPE,
  ADJUST,
  MIN_ADJUST_STEP,
  EXPRESSION,
  PERIOD_NUMBER,
  PERIOD,
  COOLDOWN
} from './fields'

export const TAB_ID = 'elasticity'

export const ELASTICITY_FORM_FIELDS = [
  // Auto-scaling Types
  ID,
  TYPE,
  ADJUST,
  MIN_ADJUST_STEP,
  // Auto-scaling Based on Metrics
  EXPRESSION,
  PERIOD_NUMBER,
  PERIOD,
  COOLDOWN
]

export const ELASTICITY_FORM_SCHEMA = yup
  .object(getValidationFromFields(ELASTICITY_FORM_FIELDS))

export const ELASTICITY_TAB_SCHEMA = yup
  .array(ELASTICITY_FORM_SCHEMA)
  .ensure()
  .default([])
