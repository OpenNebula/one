import * as yup from 'yup'

import { getValidationFromFields } from 'client/utils/helpers'
import {
  ID,
  TYPE,
  ADJUST,
  MIN_ADJUST_STEP,
  TIME_FORMAT,
  TIME_EXPRESSION
} from './fields'

export const TAB_ID = 'scheduled'

export const SCHEDULED_FORM_FIELDS = [
  // Auto-scaling Types
  ID,
  TYPE,
  ADJUST,
  MIN_ADJUST_STEP,
  // Auto-scaling Based on Schedule
  TIME_FORMAT,
  TIME_EXPRESSION
]

export const SCHEDULED_FORM_SCHEMA = yup
  .object(getValidationFromFields(SCHEDULED_FORM_FIELDS))

export const SCHEDULED_TAB_SCHEMA = yup
  .array(SCHEDULED_FORM_SCHEMA)
  .ensure()
  .default([])
