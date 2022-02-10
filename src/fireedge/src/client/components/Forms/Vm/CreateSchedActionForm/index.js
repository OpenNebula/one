/* ------------------------------------------------------------------------- *
 * Copyright 2002-2021, OpenNebula Project, OpenNebula Systems               *
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
  timeToSecondsByPeriodicity,
  transformStringToArgsObject,
} from 'client/models/Scheduler'
import { createForm } from 'client/utils'

import {
  SCHED_SCHEMA,
  SCHED_FIELDS,
  RELATIVE_SCHED_SCHEMA,
  RELATIVE_SCHED_FIELDS,
} from 'client/components/Forms/Vm/CreateSchedActionForm/schema'

const commonTransformInitialValue = (scheduledAction, schema) => {
  const dataToCast = {
    ...scheduledAction,
    // get action arguments from ARGS
    ARGS: transformStringToArgsObject(scheduledAction),
  }

  return schema.cast(dataToCast, { context: scheduledAction })
}

const commonTransformBeforeSubmit = (formData) => {
  const { WEEKLY, MONTHLY, YEARLY, HOURLY, PERIODIC, ARGS, ...filteredData } =
    formData

  // transform action arguments to string
  const argValues = Object.values(ARGS ?? {})?.filter(Boolean)
  argValues.length && (filteredData.ARGS = argValues.join(','))

  return filteredData
}

const CreateSchedActionForm = createForm(SCHED_SCHEMA, SCHED_FIELDS, {
  transformInitialValue: commonTransformInitialValue,
  transformBeforeSubmit: commonTransformBeforeSubmit,
})

const RelativeForm = createForm(RELATIVE_SCHED_SCHEMA, RELATIVE_SCHED_FIELDS, {
  transformInitialValue: commonTransformInitialValue,
  transformBeforeSubmit: (formData) => {
    const { PERIOD, TIME, ...restData } = commonTransformBeforeSubmit(formData)

    return {
      ...restData,
      TIME: `+${timeToSecondsByPeriodicity(PERIOD, TIME)}`,
    }
  },
})

export { RelativeForm }

export default CreateSchedActionForm
