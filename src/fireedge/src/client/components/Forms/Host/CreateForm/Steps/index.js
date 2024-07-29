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
import ClustersTable, {
  STEP_ID as CLUSTER_ID,
} from 'client/components/Forms/Host/CreateForm/Steps/ClustersTable'
import General, {
  STEP_ID as GENERAL_ID,
} from 'client/components/Forms/Host/CreateForm/Steps/General'
import { createSteps } from 'client/utils'

const Steps = createSteps([General, ClustersTable], {
  transformBeforeSubmit: (formData) => {
    const { [GENERAL_ID]: general, [CLUSTER_ID]: [cluster] = [] } = formData

    return {
      hostname: general.hostname,
      vmmMad: general.customVmm || general.customVmmMad || general.vmmMad,
      imMad: general.customIm || general.customImMad || general.vmmMad,
      cluster: cluster.ID,
    }
  },
})

export default Steps
