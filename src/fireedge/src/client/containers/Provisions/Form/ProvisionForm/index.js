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
/* eslint-disable jsdoc/require-jsdoc */
import * as React from 'react'
import PropTypes from 'prop-types'

import { useForm, FormProvider } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers'

import FormStepper from 'client/components/FormStepper'
import Steps from 'client/containers/Provisions/Form/ProvisionForm/Steps'

import { useProvisionApi } from 'client/features/One'
import { useGeneralApi } from 'client/features/General'
import { set, cloneObject, mapUserInputs } from 'client/utils'

const ProvisionForm = ({ handleAfterCreate }) => {
  const { createProvision } = useProvisionApi()
  const { enqueueInfo } = useGeneralApi()

  const { steps, defaultValues, resolvers } = Steps()

  const methods = useForm({
    mode: 'onSubmit',
    defaultValues,
    resolver: yupResolver(resolvers())
  })

  const onSubmit = async formData => {
    const { template, provider, configuration, inputs } = formData
    const { name, description } = configuration
    const providerName = provider?.[0]?.NAME

    // clone object from redux store
    const provisionTemplateSelected = cloneObject(template?.[0] ?? {})

    // update provider name if changed during form
    if (provisionTemplateSelected.defaults?.provision?.provider_name) {
      set(provisionTemplateSelected, 'defaults.provision.provider_name', providerName)
    } else if (provisionTemplateSelected.hosts?.length > 0) {
      provisionTemplateSelected.hosts.forEach(host => {
        set(host, 'provision.provider_name', providerName)
      })
    }

    const parseInputs = mapUserInputs(inputs)

    const formatData = {
      ...provisionTemplateSelected,
      name,
      description,
      inputs: provisionTemplateSelected?.inputs
        ?.map(input => ({ ...input, value: `${parseInputs[input?.name]}` }))
    }

    const response = await createProvision(formatData)
    enqueueInfo('Creating provision')

    handleAfterCreate?.(response)
  }

  return (
    <FormProvider {...methods}>
      <FormStepper steps={steps} schema={resolvers} onSubmit={onSubmit} />
    </FormProvider>
  )
}

ProvisionForm.propTypes = {
  handleAfterCreate: PropTypes.func
}

export default ProvisionForm
