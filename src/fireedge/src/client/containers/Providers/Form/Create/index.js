import React, { useEffect } from 'react'
import { Redirect, useHistory, useParams } from 'react-router'

import { Container, LinearProgress } from '@material-ui/core'
import { useForm, FormProvider } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers'

import FormStepper from 'client/components/FormStepper'
import Steps from 'client/containers/Providers/Form/Create/Steps'

import { PATH } from 'client/router/provision'
import useFetchAll from 'client/hooks/useFetchAll'
import useProvision from 'client/hooks/useProvision'
import useGeneral from 'client/hooks/useGeneral'

function ProviderCreateForm () {
  const history = useHistory()
  const { id } = useParams()
  const { showError } = useGeneral()

  const {
    steps,
    defaultValues,
    resolvers
  } = Steps({ isUpdate: id !== undefined })

  const {
    getProvider,
    getProvidersTemplates,
    createProvider,
    updateProvider,
    providersTemplates
  } = useProvision()

  const { data, fetchRequestAll, loading, error } = useFetchAll()

  const methods = useForm({
    mode: 'onSubmit',
    defaultValues,
    resolver: yupResolver(resolvers())
  })

  const onSubmit = formData => {
    const { provider, location, connection } = formData
    const providerSelected = provider[0]
    const locationSelected = location[0]

    const providerTemplate = providersTemplates
      .find(({ name }) => name === providerSelected) ?? {}

    const formatData = {
      name: `${providerSelected}_${locationSelected}`,
      connection: {
        ...connection,
        [providerTemplate.location_key]: locationSelected
      }
    }

    if (id) {
      updateProvider({ id, data: formatData })
        .then(() => history.push(PATH.PROVIDERS.LIST))
    } else {
      createProvider({ data: formatData })
        .then(() => history.push(PATH.PROVIDERS.LIST))
    }
  }

  useEffect(() => {
    id && fetchRequestAll([getProvider({ id }), getProvidersTemplates()])
  }, [id])

  useEffect(() => {
    if (data) {
      const [provider = {}, templates = []] = data

      const { TEMPLATE: { PROVISION_BODY = {} } } = provider
      const { connection, provider: providerName } = PROVISION_BODY

      const {
        location_key: key
      } = templates?.find(({ name }) => name === providerName) ?? {}

      if (!key) {
        showError(`
          Cannot found provider template (${providerName}),
          ask your cloud administrator`)
        history.push(PATH.PROVIDERS.LIST)
      }

      const { [key]: location, ...connections } = connection

      methods.reset({
        provider: [providerName],
        connection: connections,
        location: [location]
      }, { errors: false })
    }
  }, [data])

  if (error) {
    return <Redirect to={PATH.PROVIDERS.LIST} />
  }

  return (id && !data) || loading ? (
    <LinearProgress />
  ) : (
    <Container style={{ display: 'flex', flexFlow: 'column' }} disableGutters>
      <FormProvider {...methods}>
        <FormStepper steps={steps} schema={resolvers} onSubmit={onSubmit} />
      </FormProvider>
    </Container>
  )
}

export default ProviderCreateForm
