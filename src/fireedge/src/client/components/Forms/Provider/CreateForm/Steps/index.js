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
import Template, {
  STEP_ID as TEMPLATE_ID,
} from 'client/components/Forms/Provider/CreateForm/Steps/Template'
import BasicConfiguration, {
  STEP_ID as BASIC_ID,
} from 'client/components/Forms/Provider/CreateForm/Steps/BasicConfiguration'
import Connection, {
  STEP_ID as CONNECTION_ID,
} from 'client/components/Forms/Provider/CreateForm/Steps/Connection'
import { createSteps } from 'client/utils'

const Steps = createSteps(
  ({ isUpdate } = {}) =>
    [!isUpdate && Template, BasicConfiguration, Connection].filter(Boolean),
  {
    transformInitialValue: ({ template, connection } = {}) => ({
      [TEMPLATE_ID]: [template],
      [CONNECTION_ID]: connection,
      [BASIC_ID]: { description: template.description },
    }),
    transformBeforeSubmit: (formData) => {
      const {
        [TEMPLATE_ID]: [templateSelected] = [],
        [CONNECTION_ID]: connection = {},
        [BASIC_ID]: configuration = {},
      } = formData ?? {}

      return { template: templateSelected, connection, configuration }
    },
  }
)

export default Steps
