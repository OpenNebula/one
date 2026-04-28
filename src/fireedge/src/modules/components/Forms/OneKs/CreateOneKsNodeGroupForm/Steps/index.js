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
import General from '@modules/components/Forms/OneKs/CreateOneKsNodeGroupForm/Steps/General'
// import Family from '@modules/components/Forms/OneKs/CreateOneKsClusterForm/Steps/Family'
import Flavours from '@modules/components/Forms/OneKs/CreateOneKsClusterForm/Steps/Flavours'
import UserInputs from '@modules/components/Forms/OneKs/CreateOneKsClusterForm/Steps/UserInputs'

import { createSteps, castNumericStrings } from '@UtilsModule'

/**
 * Create steps for NodeGroup Create Form:
 * 1. General: Name of the node group
 * 2. Flavours: Select oneks flavours
 * 3. User Inputs: Configure user inputs
 */
const Steps = createSteps(
  (formProps) => [
    () => General(),
    () => Flavours(formProps, 'nodegroup'),
    () => UserInputs(formProps, 'nodegroup'),
  ],
  {
    transformBeforeSubmit: (formData) => ({
      name: formData?.general?.NAME,
      description: formData?.general?.DESCRIPTION,
      flavour: formData?.flavours?.FLAVOUR,
      user_inputs_values: castNumericStrings(formData?.user_inputs),
    }),
  }
)

export default Steps
