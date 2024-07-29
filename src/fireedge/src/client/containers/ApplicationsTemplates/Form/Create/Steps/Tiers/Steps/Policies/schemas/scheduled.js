/* ------------------------------------------------------------------------- *
 * Copyright 2002-2024, OpenNebula Project, OpenNebula Systems               *
 *                                                                           *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may   *
 * not use this file except in compliance with the License. You may obtain   *
 * a copy of the License at                                                  *
 *                                                                           *
 * http://www.apache.org/licenses/LICENSE-2.0                                *
 *                                                                           *
 * Unless required by applicable law or agreed to in writing, software       *
 * distributed under the License is distributed on an "AS IS" BASIS,         *
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  *
 * See the License for the specific language governing permissions and       *
 * limitations under the License.                                            *
 * ------------------------------------------------------------------------- */
import * as yup from 'yup'

import { getValidationFromFields } from 'client/utils'
import {
  ID,
  TYPE,
  ADJUST,
  MIN_ADJUST_STEP,
  TIME_FORMAT,
  TIME_EXPRESSION,
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
  TIME_EXPRESSION,
]

export const SCHEDULED_FORM_SCHEMA = yup.object(
  getValidationFromFields(SCHEDULED_FORM_FIELDS)
)

export const SCHEDULED_TAB_SCHEMA = yup
  .array(SCHEDULED_FORM_SCHEMA)
  .ensure()
  .default([])
