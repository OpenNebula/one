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
import General, { STEP_ID as GENERAL_ID } from 'client/components/Forms/VmTemplate/CreateForm/Steps/General'
import ExtraConfiguration, { STEP_ID as EXTRA_ID } from 'client/components/Forms/VmTemplate/CreateForm/Steps/ExtraConfiguration'
import { jsonToXml } from 'client/models/Helper'
import { createSteps } from 'client/utils'

const Steps = createSteps(
  [General, ExtraConfiguration],
  {
    // transformInitialValue: (vmTemplate, schema) =>,
    transformBeforeSubmit: formData => {
      const {
        [GENERAL_ID]: general = {},
        [EXTRA_ID]: extraTemplate = {}
      } = formData ?? {}

      const templateXML = jsonToXml({ ...general, ...extraTemplate })
      return { template: templateXML }
    }
  }
)

export default Steps
