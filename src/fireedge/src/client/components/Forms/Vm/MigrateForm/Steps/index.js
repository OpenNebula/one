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
import HostsTable, {
  STEP_ID as HOST_ID,
} from 'client/components/Forms/Vm/MigrateForm/Steps/HostsTable'
import AdvancedOptions, {
  STEP_ID as ADVANCED_ID,
} from 'client/components/Forms/Vm/MigrateForm/Steps/AdvancedOptions'
import { createSteps } from 'client/utils'

const Steps = createSteps([HostsTable, AdvancedOptions], {
  transformBeforeSubmit: (formData) => {
    const { [HOST_ID]: [host] = [], [ADVANCED_ID]: advanced } = formData

    return { host: host?.ID, ...advanced }
  },
})

export default Steps
