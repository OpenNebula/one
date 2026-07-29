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
import {
  getPeriodicityByTimeInSeconds,
  getScheduleActionDays,
  getTypeScheduleAction,
  timeToSecondsByPeriodicity,
  transformStringToArgsObject,
} from '@ModelsModule'

import { DateTime } from 'luxon'

import { createForm, dateToMilliseconds, isDate } from '@UtilsModule'
import { FormWithSchema } from '@ComponentsV2Module'

import {
  BACKUPJOB_SCHED_FIELDS,
  BACKUPJOB_SCHED_SCHEMA,
  TEMPLATE_SCHED_FIELDS,
  TEMPLATE_SCHED_SCHEMA,
  VM_SCHED_FIELDS,
  VM_SCHED_SCHEMA,
} from '@modules/resources/resources/VirtualMachine/Forms/CreateSchedActionForm/schema'
import { REPEAT_VALUES, SCHEDULE_TYPE, ALL_DAYS } from '@ConstantsModule'

const createSchedActionFormContent = (fields) => {
  const SchedActionFormContent = (props) => (
    <FormWithSchema
      cy="form-sched-action"
      fields={fields(props)}
      rootProps={{
        sx: {
          boxSizing: 'border-box',
          px: 0.5,
          width: '100%',
        },
      }}
      gridContainerSx={{
        m: 0,
        width: '100%',
      }}
      gridItemSx={{
        p: 0,
        width: '100%',
      }}
    />
  )

  return SchedActionFormContent
}

const formatTimeBeforeSubmit = (time) => {
  if (isDate(time)) return dateToMilliseconds(time)
  if (time?.isValid) return dateToMilliseconds(time.toJSDate())

  return time
}

const commonTransformInitialValue = (scheduledAction, schema, typeForm) => {
  const type = getTypeScheduleAction(scheduledAction)

  const dataToCast = {
    ...scheduledAction,
    PERIODIC: type !== '' ? type : undefined,
    ARGS: transformStringToArgsObject(scheduledAction),
  }

  if (type === SCHEDULE_TYPE.RELATIVE) {
    const periodicity = getPeriodicityByTimeInSeconds(scheduledAction.TIME)

    dataToCast.RELATIVE_TIME = periodicity?.time ?? scheduledAction.TIME
    dataToCast.PERIOD = periodicity?.period
    delete dataToCast.TIME
  } else {
    dataToCast.TIME = DateTime.fromSeconds(+scheduledAction.TIME)

    // If DAYS are all the days of a week, change to REPEAT = -1 that means Daily
    if (scheduledAction.DAYS === ALL_DAYS) {
      dataToCast.REPEAT = REPEAT_VALUES.DAILY
    } else {
      switch (scheduledAction?.REPEAT) {
        case REPEAT_VALUES.WEEKLY:
          dataToCast.WEEKLY = getScheduleActionDays(
            scheduledAction?.DAYS ?? scheduledAction?.WEEKLY
          )
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
  }

  const castSchema = schema.cast(dataToCast, {
    context: scheduledAction,
    stripUnknown: true,
  })

  return castSchema
}

const commonTransformBeforeSubmit = (formData) => {
  const {
    ACTION,
    TIME,
    PERIODIC,
    PERIOD,
    ARGS,
    RELATIVE_TIME,
    REPEAT,
    END_TYPE,
    END_VALUE,
    WEEKLY,
    MONTHLY,
    YEARLY,
    HOURLY,
  } = formData

  const scheduleAction = {
    ACTION,
    TIME: `${formatTimeBeforeSubmit(TIME)}`,
  }

  // transform action arguments to string
  const argValues =
    typeof ARGS === 'string'
      ? [ARGS].filter(Boolean)
      : Object.values(ARGS ?? {})?.filter(Boolean)

  argValues.length && (scheduleAction.ARGS = argValues.join(','))

  if (PERIODIC === SCHEDULE_TYPE.RELATIVE) {
    scheduleAction.TIME = `+${timeToSecondsByPeriodicity(
      PERIOD,
      RELATIVE_TIME
    )}`
  } else {
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
  }

  return scheduleAction
}

const CreateSchedActionForm = createForm(VM_SCHED_SCHEMA, VM_SCHED_FIELDS, {
  ContentForm: createSchedActionFormContent(VM_SCHED_FIELDS),
  transformInitialValue: commonTransformInitialValue,
  transformBeforeSubmit: commonTransformBeforeSubmit,
})

const RelativeForm = createForm(TEMPLATE_SCHED_SCHEMA, TEMPLATE_SCHED_FIELDS, {
  ContentForm: createSchedActionFormContent(TEMPLATE_SCHED_FIELDS),
  transformInitialValue: commonTransformInitialValue,
  transformBeforeSubmit: commonTransformBeforeSubmit,
})

const BackupJobForm = createForm(
  BACKUPJOB_SCHED_SCHEMA,
  BACKUPJOB_SCHED_FIELDS,
  {
    ContentForm: createSchedActionFormContent(BACKUPJOB_SCHED_FIELDS),
    transformInitialValue: commonTransformInitialValue,
    transformBeforeSubmit: commonTransformBeforeSubmit,
  }
)

export { BackupJobForm, RelativeForm }

export default CreateSchedActionForm
