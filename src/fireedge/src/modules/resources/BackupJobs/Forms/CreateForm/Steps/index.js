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
import Datastore, {
  DATASTORE_FIELD,
  STEP_ID as DATASTORE_STEP_ID,
} from './DatastoreTable'
import General, { STEP_ID as GENERAL_STEP_ID } from './General'
import ScheduleActions, { STEP_ID as SCHEDULE_STEP_ID } from './ScheduleActions'
import Vms, { BACKUP_VMS_FIELD, STEP_ID as VMS_STEP_ID } from './VmsTable'

import { createSteps } from '@UtilsModule'

const Steps = createSteps([General, Vms, Datastore, ScheduleActions], {
  transformBeforeSubmit: (formData) => {
    const {
      [GENERAL_STEP_ID]: general = {},
      [VMS_STEP_ID]: { [BACKUP_VMS_FIELD]: BACKUP_VMS } = {},
      [DATASTORE_STEP_ID]: { [DATASTORE_FIELD]: DATASTORE_ID } = {},
      [SCHEDULE_STEP_ID]: scheduleactions = [],
    } = formData ?? {}

    const jsonTemplate = {
      ...general,
      BACKUP_VMS,
      DATASTORE_ID,
    }

    if (scheduleactions.length) {
      jsonTemplate.SCHED_ACTION = scheduleactions
    }

    return jsonTemplate
  },
})

export default Steps
