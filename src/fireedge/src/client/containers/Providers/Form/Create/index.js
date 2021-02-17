import React, { useEffect } from 'react'
import { Redirect, useHistory, useParams } from 'react-router'

import { Container, LinearProgress } from '@material-ui/core'
import { useForm, FormProvider } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers'

import FormStepper from 'client/components/FormStepper'
import Steps from 'client/containers/Providers/Form/Create/Steps'

import { useFetch, useProvision, useGeneral } from 'client/hooks'
import * as ProviderTemplateModel from 'client/models/ProviderTemplate'
import { PATH } from 'client/router/provision'

function ProviderCreateForm () {
  const history = useHistory()
  const { id } = useParams()
  const isUpdate = id !== undefined

  const {
    getProvider,
    createProvider,
    updateProvider
  } = useProvision()

  const { data, fetchRequest, loading, error } = useFetch(getProvider)
  const { steps, defaultValues, resolvers } = Steps({ isUpdate })
  const { showError } = useGeneral()

  const methods = useForm({
    mode: 'onSubmit',
    defaultValues,
    resolver: yupResolver(resolvers())
  })

  const redirectWithError = (message = 'Error') => {
    showError({ message })
    history.push(PATH.PROVIDERS.LIST)
  }

  const callCreateProvider = formData => {
    const { template, configuration, connection } = formData

    const templateSelected = template?.[0]
    const { name, description } = configuration

    const isValid = ProviderTemplateModel.isValidProviderTemplate(templateSelected)

    !isValid && redirectWithError(`
      The template selected has a bad format.
      Ask your cloud administrator`
    )

    const { inputs, plain, provider } = templateSelected
    const { location_key: locationKey } = plain

    const { [locationKey]: connectionFixed } = templateSelected.connection

    const formatData = {
      connection: { ...connection, [locationKey]: connectionFixed },
      description,
      inputs,
      name,
      plain,
      provider
    }

    createProvider({ data: formatData })
      .then(() => history.push(PATH.PROVIDERS.LIST))
  }

  const callUpdateProvider = formData => {
    const { configuration, connection: connectionEditable } = formData
    const { description } = configuration

    const {
      PLAIN: { location_key: locationKey } = {},
      PROVISION_BODY: {
        connection: { [locationKey]: connectionFixed },
        registration_time: registrationTime
      }
    } = data?.TEMPLATE

    const formatData = {
      description,
      connection: { ...connectionEditable, [locationKey]: connectionFixed },
      registration_time: registrationTime
    }

    updateProvider({ id, data: formatData })
      .then(() => history.push(PATH.PROVIDERS.LIST))
  }

  const onSubmit = formData => {
    isUpdate ? callUpdateProvider(formData) : callCreateProvider(formData)
  }

  useEffect(() => {
    isUpdate && fetchRequest({ id })
  }, [isUpdate])

  useEffect(() => {
    if (data) {
      const {
        PLAIN: { location_key: locationKey } = {},
        PROVISION_BODY: {
          connection: { [locationKey]: connectionEditable },
          description,
          name
        }
      } = data?.TEMPLATE

      methods.reset({
        connection: connectionEditable,
        configuration: { name, description }
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
