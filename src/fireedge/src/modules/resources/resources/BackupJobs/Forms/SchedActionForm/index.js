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
import { DateTime } from 'luxon'

import { ALL_DAYS, REPEAT_VALUES, SCHEDULE_TYPE } from '@ConstantsModule'
import { getTypeScheduleAction } from '@ModelsModule'
import { createForm } from '@UtilsModule'

import {
  BACKUPJOB_SCHED_FIELDS,
  BACKUPJOB_SCHED_SCHEMA,
} from '@modules/resources/resources/BackupJobs/Forms/SchedActionForm/schema'

const transformInitialValue = (scheduledAction, schema) => {
  const type = getTypeScheduleAction(scheduledAction)
  const isRelative = type === SCHEDULE_TYPE.RELATIVE

  const dataToCast = {
    ...scheduledAction,
    PERIODIC: isRelative ? SCHEDULE_TYPE.ONETIME : type || undefined,
  }

  if (scheduledAction?.TIME) {
    dataToCast.TIME = DateTime.fromSeconds(+scheduledAction.TIME)
  }

  if (scheduledAction?.DAYS === ALL_DAYS) {
    dataToCast.REPEAT = REPEAT_VALUES.DAILY
  } else {
    switch (scheduledAction?.REPEAT) {
      case REPEAT_VALUES.WEEKLY:
        dataToCast.WEEKLY = scheduledAction?.DAYS?.split?.(',') ?? []
        break
      case REPEAT_VALUES.MONTHLY:
        dataToCast.MONTHLY = scheduledAction?.DAYS
        break
      case REPEAT_VALUES.YEARLY:
        dataToCast.YEARLY = scheduledAction?.DAYS
        break
      case REPEAT_VALUES.HOURLY:
        dataToCast.HOURLY = scheduledAction?.DAYS
        break
      default:
        break
    }
  }

  return schema.cast(dataToCast, {
    context: scheduledAction,
    stripUnknown: true,
  })
}

const transformBeforeSubmit = (formData) => {
  const {
    TIME,
    PERIODIC,
    REPEAT,
    END_TYPE,
    END_VALUE,
    WEEKLY,
    MONTHLY,
    YEARLY,
    HOURLY,
  } = formData

  const scheduleAction = {
    TIME: `${TIME}`,
  }

  if (PERIODIC === SCHEDULE_TYPE.PERIODIC) {
    scheduleAction.END_TYPE = END_TYPE
    scheduleAction.END_VALUE = END_VALUE
    scheduleAction.REPEAT = REPEAT

    switch (REPEAT) {
      case REPEAT_VALUES.DAILY:
        scheduleAction.REPEAT = REPEAT_VALUES.WEEKLY
        scheduleAction.DAYS = ALL_DAYS
        break
      case REPEAT_VALUES.WEEKLY:
        scheduleAction.DAYS = [].concat(WEEKLY ?? []).join(',')
        break
      case REPEAT_VALUES.MONTHLY:
        scheduleAction.DAYS = MONTHLY
        break
      case REPEAT_VALUES.YEARLY:
        scheduleAction.DAYS = YEARLY
        break
      default:
        scheduleAction.DAYS = `${HOURLY}`
        break
    }
  }

  return scheduleAction
}

const BackupJobForm = createForm(
  BACKUPJOB_SCHED_SCHEMA,
  BACKUPJOB_SCHED_FIELDS,
  {
    transformInitialValue,
    transformBeforeSubmit,
  }
)

export { BackupJobForm }

export default BackupJobForm
