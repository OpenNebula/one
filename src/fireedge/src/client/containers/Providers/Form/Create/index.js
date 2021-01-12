import React, { useEffect } from 'react'
import { Redirect, useHistory, useParams } from 'react-router'

import { Container, LinearProgress } from '@material-ui/core'
import { useForm, FormProvider } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers'

import FormStepper from 'client/components/FormStepper'
import Steps from 'client/containers/Providers/Form/Create/Steps'

import { useFetch, useProvision, useGeneral } from 'client/hooks'
import { PATH } from 'client/router/provision'
import { mapUserInputs } from 'client/utils'

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

  const getTemplate = ({ provision, provider, name } = {}) => {
    const template = provisionsTemplates
      ?.[provision]
      ?.providers?.[provider]
      ?.find(providerSelected => providerSelected.name === name)

    if (!template) {
      showError({
        message: `
          Cannot found provider template (${provider}),
          ask your cloud administrator`
      })
      history.push(PATH.PROVIDERS.LIST)
    } else return template
  }

  const onSubmit = formData => {
    const { template, inputs, connection, registration_time: time } = formData

    const templateSelected = template?.[0]
    const providerTemplate = getTemplate(templateSelected)
    const parseInputs = mapUserInputs(inputs)

    const {
      plain,
      location_key: locationKey,
      connection: { [locationKey]: connectionFixed }
    } = providerTemplate

    const formatData = {
      ...(!isUpdate && templateSelected),
      ...(plain && { plain }),
      connection: {
        ...connection,
        [locationKey]: connectionFixed
      },
      inputs: providerTemplate?.inputs
        ?.map(input => ({ ...input, value: `${parseInputs[input?.name]}` })),
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
        inputs,
        name,
        provider,
        provision,
        registration_time: time
      } = data?.TEMPLATE?.PROVISION_BODY ?? {}

      const templateSelected = { name, provision, provider }
      const providerTemplate = getTemplate(templateSelected)

      const { location_key: locationKey } = providerTemplate
      const { [locationKey]: _, ...connectionEditable } = connection

      const inputsNameValue = inputs?.reduce((res, input) => (
        { ...res, [input.name]: input.value }
      ), {})

      methods.reset({
        connection: connectionEditable,
        inputs: inputsNameValue,
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
