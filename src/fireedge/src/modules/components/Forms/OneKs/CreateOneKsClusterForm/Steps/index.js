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
import General from '@modules/components/Forms/OneKs/CreateOneKsClusterForm/Steps/General'
import Public from '@modules/components/Forms/OneKs/CreateOneKsClusterForm/Steps/Public'
import Private from '@modules/components/Forms/OneKs/CreateOneKsClusterForm/Steps/Private'
// import Family from '@modules/components/Forms/OneKs/CreateOneKsClusterForm/Steps/Family'
import Flavours from '@modules/components/Forms/OneKs/CreateOneKsClusterForm/Steps/Flavours'
import UserInputs from '@modules/components/Forms/OneKs/CreateOneKsClusterForm/Steps/UserInputs'
import KubernetesVersion from '@modules/components/Forms/OneKs/CreateOneKsClusterForm/Steps/KubernetesVersion'

import { createSteps, castNumericStrings } from '@UtilsModule'

/**
 * Create steps for Cluster Create Form:
 * 1. General: Name of the cluster
 * 2. Public: Select hosts
 * 3. Private: Select virtual networks
 * 4. Kubernetes Version: Select kubernetes version
 * 5. Flavours: Select oneks flavours
 * 6. User Inputs: Configure user inputs
 */
const Steps = createSteps(
  (formProps) => [
    () => General(),
    () => Public(),
    () => Private(),
    () => KubernetesVersion(formProps),
    () => Flavours(formProps),
    () => UserInputs(formProps),
  ],
  {
    transformBeforeSubmit: (formData) => ({
      name: formData?.general?.NAME,
      description: formData?.general?.DESCRIPTION,
      kubernetes_version: formData?.kubernetes_version?.KUBERNETES_VERSION,
      public_network: formData?.public?.PUBLIC_NETWORK,
      private_network: formData?.private?.PRIVATE_NETWORK,
      spec: {
        name: formData?.general?.NAME,
        description: formData?.general?.DESCRIPTION,
        flavour: formData?.flavours?.FLAVOUR,
        user_inputs_values: castNumericStrings(formData?.user_inputs),
      },
    }),
  }
)

export default Steps
