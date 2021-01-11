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

  const onSubmit = formData => {
    const {
      template: templateSelected,
      inputs,
      connection,
      registration_time: time
    } = formData

    const { name, provision, provider } = templateSelected?.[0]

    const providerTemplate = provisionsTemplates
      ?.[provision]
      ?.providers?.[provider]
      ?.find(providerSelected => providerSelected.name === name)

    if (!providerTemplate) {
      showError({
        message: `
          Cannot found provider template (${name}),
          ask your cloud administrator`
      })
      history.push(PATH.PROVISIONS.LIST)
    }

    const {
      plain,
      location_key: locationKey,
      connection: { [locationKey]: connectionFixed }
    } = providerTemplate
    const parseInputs = mapUserInputs(inputs)

    const formatData = {
      ...(!isUpdate && { name, provision, provider }),
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
      const [provider = {}, templates = []] = data

      const {
        connection, provider: providerName, registration_time: time
      } = provider?.TEMPLATE?.PROVISION_BODY ?? {}

      const {
        location_key: key
      } = templates?.find(({ name }) => name === providerName) ?? {}

      if (!key) {
        showError({
          message: `
            Cannot found provider template (${providerName}),
            ask your cloud administrator`
        })
        history.push(PATH.PROVIDERS.LIST)
      }

      const { [key]: location, ...connections } = connection

      methods.reset({
        provider: [providerName],
        registration_time: time,
        connection: connections,
        location: [location]
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
