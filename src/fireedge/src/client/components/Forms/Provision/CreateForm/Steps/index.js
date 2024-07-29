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
/* eslint-disable jsdoc/require-jsdoc */
import Template from 'client/components/Forms/Provision/CreateForm/Steps/Template'
import Provider from 'client/components/Forms/Provision/CreateForm/Steps/Provider'
import BasicConfiguration from 'client/components/Forms/Provision/CreateForm/Steps/BasicConfiguration'
import Inputs from 'client/components/Forms/Provision/CreateForm/Steps/Inputs'
import { set, createSteps, cloneObject } from 'client/utils'

const Steps = createSteps([Template, Provider, BasicConfiguration, Inputs], {
  transformBeforeSubmit: (formData) => {
    const { template, provider, configuration, inputs } = formData
    const { name, description } = configuration
    const providerName = provider?.[0]?.NAME

    // clone object from redux store
    const provisionTemplateSelected = cloneObject(template?.[0] ?? {})

    // update provider name if changed during form
    if (provisionTemplateSelected.defaults?.provision?.provider_name) {
      set(
        provisionTemplateSelected,
        'defaults.provision.provider_name',
        providerName
      )
    } else if (provisionTemplateSelected.hosts?.length > 0) {
      provisionTemplateSelected.hosts.forEach((host) => {
        set(host, 'provision.provider_name', providerName)
      })
    }

    const resolvedInputs = provisionTemplateSelected?.inputs?.map((input) => ({
      ...input,
      value: `${inputs[input?.name] ?? ';'}`,
    }))

    return {
      ...provisionTemplateSelected,
      name,
      description,
      inputs: resolvedInputs,
    }
  },
})

export default Steps
