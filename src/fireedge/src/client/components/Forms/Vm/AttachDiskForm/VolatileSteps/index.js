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
import BasicConfiguration, {
  STEP_ID as BASIC_ID,
} from 'client/components/Forms/Vm/AttachDiskForm/VolatileSteps/BasicConfiguration'
import AdvancedOptions, {
  STEP_ID as ADVANCED_ID,
} from 'client/components/Forms/Vm/AttachDiskForm/VolatileSteps/AdvancedOptions'
import { mapUserInputs, createSteps, convertToMB } from 'client/utils'

const Steps = createSteps([BasicConfiguration, AdvancedOptions], {
  transformInitialValue: (disk = {}, schema) => ({
    ...schema.cast(
      {
        [BASIC_ID]: disk,
        [ADVANCED_ID]: disk,
      },
      { stripUnknown: true }
    ),
  }),
  transformBeforeSubmit: (formData) => {
    const { [BASIC_ID]: configuration = {}, [ADVANCED_ID]: advanced = {} } =
      formData ?? {}

    // ISSUE#6136: Convert size to MB (because XML API uses only MB) and delete sizeunit field (no needed on XML API)
    configuration.SIZE = convertToMB(configuration.SIZE, configuration.SIZEUNIT)
    delete configuration.SIZEUNIT

    return { ...mapUserInputs(advanced), ...mapUserInputs(configuration) }
  },
})

export default Steps
