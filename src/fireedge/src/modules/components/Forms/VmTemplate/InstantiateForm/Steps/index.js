/* ------------------------------------------------------------------------- *
 * Copyright 2002-2025, OpenNebula Project, OpenNebula Systems               *
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
import {
  getUserInputParams,
  parseRangeToArray,
  userInputsToArray,
} from '@ModelsModule'
import { createSteps } from '@UtilsModule'
import { groupUserInputs } from '@modules/components/Forms/UserInputs'
import BasicConfiguration, {
  STEP_ID as BASIC_ID,
} from '@modules/components/Forms/VmTemplate/InstantiateForm/Steps/BasicConfiguration'
import ExtraConfiguration, {
  STEP_ID as EXTRA_ID,
} from '@modules/components/Forms/VmTemplate/InstantiateForm/Steps/ExtraConfiguration'
import UserInputs from '@modules/components/Forms/VmTemplate/InstantiateForm/Steps/UserInputs'

const Steps = createSteps(
  ({ dataTemplateExtended = {}, ...rest }) => {
    // Get and order user inputs
    const userInputs = userInputsToArray(
      dataTemplateExtended?.TEMPLATE?.USER_INPUTS,
      {
        order: dataTemplateExtended?.TEMPLATE?.INPUTS_ORDER,
      }
    )

    // Get user inputs metadata
    const userInputsMetadata = dataTemplateExtended?.TEMPLATE
      ?.USER_INPUTS_METADATA
      ? Array.isArray(dataTemplateExtended?.TEMPLATE?.USER_INPUTS_METADATA)
        ? dataTemplateExtended?.TEMPLATE?.USER_INPUTS_METADATA
        : [dataTemplateExtended?.TEMPLATE?.USER_INPUTS_METADATA]
      : undefined

    // Group user inputs
    const userInputsLayout = groupUserInputs(userInputs, userInputsMetadata)

    return [
      () => BasicConfiguration({ vmTemplate: dataTemplateExtended, ...rest }),
      userInputs?.length > 0 &&
        (() => UserInputs(userInputs, userInputsLayout)),
      (props) =>
        ExtraConfiguration({ vmTemplate: dataTemplateExtended, ...props }),
    ].filter(Boolean)
  },
  {
    transformInitialValue: (vmTemplate, schema) => {
      // this delete values that are representated in USER_INPUTS
      if (vmTemplate?.TEMPLATE?.USER_INPUTS) {
        ;['MEMORY', 'CPU', 'VCPU'].forEach((element) => {
          if (vmTemplate?.TEMPLATE?.USER_INPUTS?.[element]) {
            const valuesOfUserInput = getUserInputParams(
              vmTemplate.TEMPLATE.USER_INPUTS[element]
            )
            if (valuesOfUserInput?.default) {
              let options = valuesOfUserInput?.options
              valuesOfUserInput?.type === 'range' &&
                (options = parseRangeToArray(options[0], options[1]))

              if (!options.includes(valuesOfUserInput.default)) {
                delete vmTemplate?.TEMPLATE?.USER_INPUTS?.[element]
              } else {
                vmTemplate?.TEMPLATE?.[element] &&
                  delete vmTemplate?.TEMPLATE?.[element]
              }
            } else {
              vmTemplate?.TEMPLATE?.[element] &&
                delete vmTemplate?.TEMPLATE?.[element]
            }
          }
        })
      }

      return schema.cast(
        {
          [BASIC_ID]: vmTemplate?.TEMPLATE,
          [EXTRA_ID]: vmTemplate?.TEMPLATE,
        },
        { stripUnknown: true }
      )
    },
    transformBeforeSubmit: (formData, vmTemplate) => {
      const { [BASIC_ID]: { name, instances, hold, persistent } = {} } =
        formData ?? {}

      const templates = [...new Array(instances)].map((__, idx) => ({
        id: vmTemplate.ID,
        name: name?.replace(/%idx/gi, idx),
        instances: instances,
        hold: hold,
        persistent: persistent,
        ...formData,
      }))

      return templates
    },
  }
)

export default Steps
