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
import Datastore, { STEP_ID as DATASTORE_ID } from './DatastoreTable'
import General, { STEP_ID as GENERAL_ID } from './General'
import ScheduleActions, { STEP_ID as SCHEDULE_ID } from './ScheduleActions'
import Vms, { STEP_ID as VMS_ID } from './VmsTable'

import { createSteps, extractIDValues } from 'client/utils'

const Steps = createSteps([General, Vms, Datastore, ScheduleActions], {
  transformBeforeSubmit: (formData) => {
    const {
      [GENERAL_ID]: general = {},
      [VMS_ID]: { BACKUP_VMS } = {},
      [DATASTORE_ID]: datastores = [],
      [SCHEDULE_ID]: scheduleactions = [],
    } = formData ?? {}

    const jsonTemplate = {
      ...general,
      BACKUP_VMS,
      DATASTORE_ID: extractIDValues(datastores),
    }

    if (scheduleactions.length) {
      jsonTemplate.SCHED_ACTION = scheduleactions
    }

    return jsonTemplate
  },
})

export default Steps
