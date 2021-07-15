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
import { useHistory } from 'react-router'

import { useForm, FormProvider } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers'

import FormStepper from 'client/components/FormStepper'
import Steps from 'client/containers/Providers/Form/ProviderForm/Steps'

import { useProviderApi } from 'client/features/One'
import { useGeneralApi } from 'client/features/General'
import * as ProviderTemplateModel from 'client/models/ProviderTemplate'
import { PATH } from 'client/apps/provision/routes'

const ProviderCreateForm = ({ id, preloadedData, initialValues }) => {
  const history = useHistory()
  const isUpdate = id !== undefined

  const { createProvider, updateProvider } = useProviderApi()
  const { enqueueError, enqueueSuccess, changeLoading } = useGeneralApi()

  const { steps, defaultValues, resolvers } = Steps({ isUpdate })

  const methods = useForm({
    mode: 'onSubmit',
    defaultValues: initialValues ?? defaultValues,
    resolver: yupResolver(resolvers())
  })

  const redirectWithError = (message = 'Error') => {
    enqueueError(message)
    history.push(PATH.PROVIDERS.LIST)
  }

  const callCreateProvider = async formData => {
    const { template, configuration, connection } = formData

    const templateSelected = template?.[0]

    const isValid = ProviderTemplateModel.isValidProviderTemplate(templateSelected)

    !isValid && redirectWithError(`
      The template selected has a bad format.
      Ask your cloud administrator`
    )

    const { name, description } = configuration
    const connectionFixed = ProviderTemplateModel.getConnectionFixed(templateSelected)

    const formatData = {
      ...templateSelected,
      connection: { ...connection, ...connectionFixed },
      description,
      name
    }

    createProvider(formatData)
      .then(id => enqueueSuccess(`Provider created - ID: ${id}`))
      .then(() => history.push(PATH.PROVIDERS.LIST))
  }

  const callUpdateProvider = formData => {
    const { configuration, connection: connectionEditable } = formData
    const { description } = configuration
    const [provider = {}, connection = []] = preloadedData

    const { PROVISION_BODY: currentBodyTemplate } = provider?.TEMPLATE

    const formatData = {
      ...currentBodyTemplate,
      description,
      connection: { ...connection, ...connectionEditable }
    }

    updateProvider(id, formatData)
      .then(() => enqueueSuccess(`Provider updated - ID: ${id}`))
      .then(() => history.push(PATH.PROVIDERS.LIST))
  }

  const onSubmit = formData => {
    changeLoading(true)
    isUpdate ? callUpdateProvider(formData) : callCreateProvider(formData)
  }

  return (
    <FormProvider {...methods}>
      <FormStepper steps={steps} schema={resolvers} onSubmit={onSubmit} />
    </FormProvider>
  )
}

ProviderCreateForm.propTypes = {
  id: PropTypes.string,
  preloadedData: PropTypes.object,
  initialValues: PropTypes.object
}

export default ProviderCreateForm
