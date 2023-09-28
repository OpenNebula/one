/* ------------------------------------------------------------------------- *
 * Copyright 2002-2023, OpenNebula Project, OpenNebula Systems               *
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
  getTypeScheduleAction,
  timeToSecondsByPeriodicity,
  transformStringToArgsObject,
} from 'client/models/Scheduler'

import { DateTime } from 'luxon'

import { createForm } from 'client/utils'

import {
  TEMPLATE_SCHED_FIELDS,
  TEMPLATE_SCHED_SCHEMA,
  VM_SCHED_FIELDS,
  VM_SCHED_SCHEMA,
} from 'client/components/Forms/Vm/CreateSchedActionForm/schema'
import { REPEAT_VALUES, SCHEDULE_TYPE } from 'client/constants'

const commonTransformInitialValue = (scheduledAction, schema, typeForm) => {
  const type = getTypeScheduleAction(scheduledAction)

  const dataToCast = {
    ...scheduledAction,
    PERIODIC: type !== '' ? type : undefined,
    ARGS: transformStringToArgsObject(scheduledAction),
  }

  if (type === SCHEDULE_TYPE.RELATIVE) {
    dataToCast.RELATIVE_TIME = scheduledAction.TIME
  } else {
    dataToCast.TIME = DateTime.fromSeconds(+scheduledAction.TIME)
    if (scheduledAction.WEEKLY) {
      dataToCast.WEEKLY = scheduledAction?.WEEKLY?.split?.(',') ?? []
    }
  }

  const castSchema = schema.cast(dataToCast, {
    context: scheduledAction,
    stripUnknown: true,
  })

  // #6154: Add temportal id for restricted attributes
  castSchema.TEMP_ID = scheduledAction.TEMP_ID

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
    TIME: `${TIME}`,
    ARGS,
  }

  // transform action arguments to string
  const argValues = Object.values(ARGS ?? {})?.filter(Boolean)
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
        case REPEAT_VALUES.WEEKLY:
          scheduleAction.DAYS = WEEKLY
          break
        case REPEAT_VALUES.MONTHLY:
          scheduleAction.DAYS = MONTHLY
          break
        case REPEAT_VALUES.YEARLY:
          scheduleAction.DAYS = YEARLY
          break
        default:
          scheduleAction.DAYS = HOURLY
          break
      }
    }
  }

  return scheduleAction
}

const CreateSchedActionForm = createForm(VM_SCHED_SCHEMA, VM_SCHED_FIELDS, {
  transformInitialValue: commonTransformInitialValue,
  transformBeforeSubmit: commonTransformBeforeSubmit,
})

const RelativeForm = createForm(TEMPLATE_SCHED_SCHEMA, TEMPLATE_SCHED_FIELDS, {
  transformInitialValue: commonTransformInitialValue,
  transformBeforeSubmit: commonTransformBeforeSubmit,
})

export { RelativeForm }

export default CreateSchedActionForm
