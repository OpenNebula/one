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
import VmTemplatesTable, { STEP_ID as TEMPLATE_ID } from 'client/components/Forms/VmTemplate/InstantiateForm/Steps/VmTemplatesTable'
import BasicConfiguration, { STEP_ID as BASIC_ID } from 'client/components/Forms/VmTemplate/InstantiateForm/Steps/BasicConfiguration'
import ExtraConfiguration, { STEP_ID as EXTRA_ID } from 'client/components/Forms/VmTemplate/InstantiateForm/Steps/ExtraConfiguration'
import { jsonToXml } from 'client/models/Helper'
import { createSteps } from 'client/utils'

const Steps = createSteps(() => {
  // const { [STEP_ID]: initialTemplate } = initialValues ?? {}

  return [
    VmTemplatesTable,
    BasicConfiguration,
    ExtraConfiguration
  ]
}, {
  transformBeforeSubmit: formData => {
    const {
      [TEMPLATE_ID]: [templateSelected] = [],
      [BASIC_ID]: { name, instances, hold, persistent, ...restOfConfig } = {},
      [EXTRA_ID]: extraTemplate = {}
    } = formData ?? {}

    const templates = [...new Array(instances)]
      .map((_, idx) => {
        const replacedName = name?.replace(/%idx/gi, idx)

        const template = jsonToXml({ TEMPLATE: { ...extraTemplate, ...restOfConfig } })
        const data = { name: replacedName, instances, hold, persistent, template }

        return data
      })

    return [templateSelected, templates]
  }
})

export default Steps
