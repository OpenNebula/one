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
import Rules, {
  STEP_ID as RULES_ID,
} from 'client/components/Forms/SecurityGroups/CreateForm/Steps/Rules'

import General, {
  STEP_ID as GENERAL_ID,
} from 'client/components/Forms/SecurityGroups/CreateForm/Steps/General'

import { createSteps } from 'client/utils'

const Steps = createSteps([General, Rules], {
  transformInitialValue: ({ TEMPLATE, ...secGroup } = {}, schema) =>
    schema.cast(
      {
        [GENERAL_ID]: { ...TEMPLATE, ...secGroup },
        [RULES_ID]: {
          RULES: Array.isArray(TEMPLATE.RULE) ? TEMPLATE.RULE : [TEMPLATE.RULE],
        },
      },
      { stripUnknown: true, context: secGroup }
    ),
  transformBeforeSubmit: (formData) => {
    const { [GENERAL_ID]: general = {}, [RULES_ID]: rules = {} } =
      formData ?? {}

    const rtn = {
      template: {
        ...general,
      },
    }

    if (rules?.RULES) rtn.template.RULE = rules.RULES

    return rtn
  },
})

export default Steps
