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
import General from '@modules/resources/Forms/OneKs/CreateOneKsClusterForm/Steps/General'
import Cluster from '@modules/resources/Forms/OneKs/CreateOneKsClusterForm/Steps/Cluster'
import Public from '@modules/resources/Forms/OneKs/CreateOneKsClusterForm/Steps/Public'
import Private from '@modules/resources/Forms/OneKs/CreateOneKsClusterForm/Steps/Private'
// import Family from '@modules/resources/Forms/OneKs/CreateOneKsClusterForm/Steps/Family'
import Flavours from '@modules/resources/Forms/OneKs/CreateOneKsClusterForm/Steps/Flavours'
import UserInputs from '@modules/resources/Forms/OneKs/CreateOneKsClusterForm/Steps/UserInputs'
import KubernetesVersion from '@modules/resources/Forms/OneKs/CreateOneKsClusterForm/Steps/KubernetesVersion'

import { createSteps, castNumericStrings } from '@UtilsModule'

const toId = (value) => {
  if (value === undefined || value === null || value === '') {
    return undefined
  }

  const numberValue = Number(value)

  return Number.isNaN(numberValue) ? undefined : numberValue
}

/**
 * Create steps for Cluster Create Form:
 * 1. General: Name of the cluster
 * 2. Cluster: Select OpenNebula cluster
 * 3. Public: Select public network
 * 4. Private: Select private network
 * 5. Kubernetes Version: Select kubernetes version
 * 6. Flavours: Select oneks flavours
 * 7. User Inputs: Configure user inputs
 */
const Steps = createSteps(
  (formProps) => [
    () => General(),
    () => Cluster(),
    () => Public(),
    () => Private(),
    () => KubernetesVersion(formProps),
    () => Flavours(formProps),
    () => UserInputs(formProps),
  ],
  {
    transformBeforeSubmit: (formData, _, stepProps) => {
      const clusterId = formData?.cluster?.cluster ?? stepProps?.clusterId

      return {
        name: formData?.general?.NAME,
        description: formData?.general?.DESCRIPTION,
        kubernetes_version: formData?.kubernetes_version?.KUBERNETES_VERSION,
        deployment: {
          cluster: {
            id: toId(clusterId),
          },
          networks: {
            public: {
              id: toId(formData?.public?.PUBLIC_NETWORK),
            },
            private: {
              id: toId(formData?.private?.PRIVATE_NETWORK),
            },
          },
        },
        spec: {
          name: formData?.general?.NAME,
          description: formData?.general?.DESCRIPTION,
          flavour: formData?.flavours?.FLAVOUR,
          user_inputs_values: castNumericStrings(formData?.user_inputs),
        },
      }
    },
  }
)

export default Steps
