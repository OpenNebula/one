import React, { useState, useEffect } from 'react'
import { Redirect } from 'react-router'

import { Container, LinearProgress } from '@material-ui/core'
import { useForm, FormProvider } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers'

import FormStepper from 'client/components/FormStepper'
import Steps from 'client/containers/Provisions/Form/Create/Steps'
import DebugLog from 'client/components/DebugLog'

import { useProvision, useSocket, useFetch } from 'client/hooks'
import { PATH } from 'client/router/provision'
import { set, mapUserInputs } from 'client/utils'

function ProvisionCreateForm () {
  const [uuid, setUuid] = useState(undefined)
  const { getProvision } = useSocket()

  const { getProviders, createProvision, providers } = useProvision()

  const { data, fetchRequest, loading, error } = useFetch(getProviders)

  const { steps, defaultValues, resolvers } = Steps()

  const methods = useForm({
    mode: 'onSubmit',
    defaultValues,
    resolver: yupResolver(resolvers())
  })

  const onSubmit = formData => {
    const { template, provider, configuration, inputs } = formData
    const { name, description } = configuration
    const provisionTemplateSelected = template?.[0] ?? {}
    const providerName = provider?.[0]?.NAME

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

    createProvision({ data: formatData }).then(res => res && setUuid(res))
  }

  useEffect(() => { fetchRequest() }, [])

  if (uuid) {
    return <DebugLog uuid={uuid} socket={getProvision} />
  }

  if (error) {
    return <Redirect to={PATH.PROVIDERS.LIST} />
  }

  return (!data) || loading ? (
    <LinearProgress color='secondary' />
  ) : (
    <Container style={{ display: 'flex', flexFlow: 'column' }} disableGutters>
      <FormProvider {...methods}>
        <FormStepper steps={steps} schema={resolvers} onSubmit={onSubmit} />
      </FormProvider>
    </Container>
  )
}

ProvisionCreateForm.propTypes = {}

ProvisionCreateForm.defaultProps = {}

export default ProvisionCreateForm
