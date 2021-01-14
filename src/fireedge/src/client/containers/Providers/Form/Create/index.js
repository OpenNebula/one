import React, { useEffect } from 'react'
import { Redirect, useHistory, useParams } from 'react-router'

import { Container, LinearProgress } from '@material-ui/core'
import { useForm, FormProvider } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers'

import FormStepper from 'client/components/FormStepper'
import Steps from 'client/containers/Providers/Form/Create/Steps'

import { useFetch, useProvision, useGeneral } from 'client/hooks'
import { PATH } from 'client/router/provision'

function ProviderCreateForm () {
  const history = useHistory()
  const { id } = useParams()
  const isUpdate = id !== undefined

  const {
    getProvider,
    createProvider,
    updateProvider,
    provisionsTemplates
  } = useProvision()

  const { data, fetchRequest, loading, error } = useFetch(getProvider)
  const { steps, defaultValues, resolvers } = Steps({ isUpdate })
  const { showError } = useGeneral()

  const methods = useForm({
    mode: 'onSubmit',
    defaultValues,
    resolver: yupResolver(resolvers())
  })

  const redirectWithError = (name = '') => {
    showError({
      message: `
        Cannot found provider template (${name}),
        ask your cloud administrator`
    })

    history.push(PATH.PROVIDERS.LIST)
  }

  const getProviderTemplateByDir = ({ provision, provider, name }) =>
    provisionsTemplates
      ?.[provision]
      ?.providers
      ?.[provider]
      ?.find(providerSelected => providerSelected.name === name)

  const onSubmit = formData => {
    const { template, configuration, connection, registration_time: time } = formData
    const { name, description } = configuration

    const templateSelected = template?.[0]
    const providerTemplate = getProviderTemplateByDir(templateSelected)

    if (!providerTemplate) return redirectWithError(templateSelected?.name)

    const {
      inputs,
      name: templateName,
      plain,
      provider,
      location_key: locationKey,
      connection: { [locationKey]: connectionFixed }
    } = providerTemplate

    const formatData = {
      ...(!isUpdate && {
        name,
        plain,
        provider,
        inputs,
        template: templateName
      }),
      description,
      connection: { ...connection, [locationKey]: connectionFixed },
      registration_time: time
    }

    if (isUpdate) {
      updateProvider({ id, data: formatData })
        .then(() => history.push(PATH.PROVIDERS.LIST))
    } else {
      createProvider({ data: formatData })
        .then(() => history.push(PATH.PROVIDERS.LIST))
    }
  }

  useEffect(() => {
    isUpdate && fetchRequest({ id })
  }, [isUpdate])

  useEffect(() => {
    if (data) {
      const {
        connection,
        description,
        name,
        provider,
        template: templateName,
        registration_time: time
      } = data?.TEMPLATE?.PROVISION_BODY ?? {}

      const { provision_type: provisionType } = data?.TEMPLATE?.PLAIN ?? {}

      const templateSelected = { name: templateName, provision: provisionType, provider }
      const template = getProviderTemplateByDir(templateSelected)

      if (!template) return redirectWithError(templateName)

      const { location_key: locationKey } = template
      const { [locationKey]: _, ...connectionEditable } = connection

      methods.reset({
        connection: connectionEditable,
        configuration: { name, description },
        template: [templateSelected],
        registration_time: time
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
