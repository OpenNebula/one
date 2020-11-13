import React from 'react'
import { useHistory } from 'react-router'

import { Container } from '@material-ui/core'
import { useForm, FormProvider } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers'

import useProvision from 'client/hooks/useProvision'
import FormStepper from 'client/components/FormStepper'
import Steps from 'client/containers/Providers/Form/Create/Steps'
import { PATH } from 'client/router/provision'

function ProviderCreateForm () {
  const history = useHistory()
  const { createProvider, providersTemplates } = useProvision()
  const { steps, defaultValues, resolvers } = Steps()

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
        [providerTemplate.location_key]: locationSelected,
        [`${providerTemplate.location_key}_extra`]:
          providerTemplate.locations[locationSelected]
      }
    }

    createProvider({ data: formatData })
      .then(() => history.push(PATH.PROVIDERS.LIST))
  }

  return (
    <Container style={{ display: 'flex', flexFlow: 'column' }} disableGutters>
      <FormProvider {...methods}>
        <FormStepper steps={steps} schema={resolvers} onSubmit={onSubmit} />
      </FormProvider>
    </Container>
  )
}

export default ProviderCreateForm
