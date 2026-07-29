/* ------------------------------------------------------------------------- *
 * Copyright 2002-2026, OpenNebula Project, OpenNebula Systems               *
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
import { ObjectSchema } from 'yup'

import {
  DAYS_FIELD,
  END_TYPE_FIELD,
  END_VALUE_FIELD,
  HOURLY_FIELD,
  MONTHLY_FIELD,
  PERIODIC_FIELD,
  PERIOD_TEXT_FIELD,
  REPEAT_FIELD,
  TIME_FIELD,
  WEEKLY_FIELD,
  YEARLY_FIELD,
} from '@modules/resources/resources/BackupJobs/Forms/SchedActionForm/fields'
import { Field, getObjectSchemaFromFields } from '@UtilsModule'

const BACKUPJOB_SCHED_FORM_FIELDS = [
  PERIODIC_FIELD,
  TIME_FIELD,
  REPEAT_FIELD,
  WEEKLY_FIELD,
  MONTHLY_FIELD,
  YEARLY_FIELD,
  HOURLY_FIELD,
  END_TYPE_FIELD,
  END_VALUE_FIELD,
]

/** @type {Field[]} Fields for BackupJob scheduled actions */
export const BACKUPJOB_SCHED_FIELDS = [
  ...BACKUPJOB_SCHED_FORM_FIELDS,
  PERIOD_TEXT_FIELD,
]

/** @type {ObjectSchema} Schema */
export const BACKUPJOB_SCHED_SCHEMA = getObjectSchemaFromFields([
  ...BACKUPJOB_SCHED_FORM_FIELDS,
  DAYS_FIELD,
])
