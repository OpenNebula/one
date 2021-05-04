import React, { useEffect } from 'react'
import { Redirect, useHistory, useParams } from 'react-router'

import { Container, LinearProgress } from '@material-ui/core'
import { useForm, FormProvider } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers'

import FormStepper from 'client/components/FormStepper'
import Steps from 'client/containers/Providers/Form/Create/Steps'

import { useFetchAll, useGeneral, useProvision } from 'client/hooks'
import * as ProviderTemplateModel from 'client/models/ProviderTemplate'
import { PATH } from 'client/router/provision'

function ProviderCreateForm () {
  const history = useHistory()
  const { id } = useParams()
  const isUpdate = id !== undefined

  const {
    getProvider,
    getProviderConnection,
    createProvider,
    updateProvider
  } = useProvision()

  const { data, fetchRequestAll, loading, error } = useFetchAll()
  const { steps, defaultValues, resolvers } = Steps({ isUpdate })
  const { showError, changeLoading } = useGeneral()

  const methods = useForm({
    mode: 'onSubmit',
    defaultValues,
    resolver: yupResolver(resolvers())
  })

  const redirectWithError = (message = 'Error') => {
    showError({ message })
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

    createProvider({ data: formatData })
      .then(() => history.push(PATH.PROVIDERS.LIST))
  }

  const callUpdateProvider = formData => {
    const { configuration, connection: connectionEditable } = formData
    const { description } = configuration
    const [provider = {}, connection = []] = data

    const { PROVISION_BODY: currentBodyTemplate } = provider?.TEMPLATE

    const formatData = {
      ...currentBodyTemplate,
      description,
      connection: { ...connection, ...connectionEditable }
    }

    updateProvider({ id, data: formatData })
      .then(() => history.push(PATH.PROVIDERS.LIST))
  }

  const onSubmit = formData => {
    changeLoading(true)
    isUpdate ? callUpdateProvider(formData) : callCreateProvider(formData)
  }

  useEffect(() => {
    isUpdate && fetchRequestAll([
      getProvider({ id }),
      getProviderConnection({ id })
    ])
  }, [isUpdate])

  useEffect(() => {
    if (data) {
      const [provider = {}, connection = []] = data

      const {
        PLAIN = {},
        PROVISION_BODY: { description, ...currentBodyTemplate }
      } = provider?.TEMPLATE

      const connectionEditable = ProviderTemplateModel
        .getConnectionEditable({ plain: PLAIN, connection })

      methods.reset({
        template: [currentBodyTemplate],
        connection: connectionEditable,
        configuration: { description }
      }, { errors: false })
    }
  }, [data])

  if (error) {
    return <Redirect to={PATH.PROVIDERS.LIST} />
  }

  return (isUpdate && !data) || loading ? (
    <LinearProgress color='secondary' />
  ) : (
    <Container style={{ display: 'flex', flexFlow: 'column' }} disableGutters>
      <FormProvider {...methods}>
        <FormStepper steps={steps} schema={resolvers} onSubmit={onSubmit} />
      </FormProvider>
    </Container>
  )
}

export default ProviderCreateForm
