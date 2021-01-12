import React, { useState, useEffect } from 'react'
import { Redirect, useHistory } from 'react-router'

import { Container, LinearProgress } from '@material-ui/core'
import { useForm, FormProvider } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers'

import FormStepper from 'client/components/FormStepper'
import Steps from 'client/containers/Provisions/Form/Create/Steps'
import DebugLog from 'client/components/DebugLog'

import { useGeneral, useProvision, useSocket, useFetch } from 'client/hooks'
import { PATH } from 'client/router/provision'
import { set, mapUserInputs } from 'client/utils'

function ProvisionCreateForm () {
  const [uuid, setUuid] = useState(undefined)
  const history = useHistory()
  const { showError } = useGeneral()
  const { getProvision } = useSocket()
  const { getProviders, createProvision, provisionsTemplates, providers } = useProvision()
  const { data, fetchRequest, loading, error } = useFetch(getProviders)

  const { steps, defaultValues, resolvers } = Steps()

  const methods = useForm({
    mode: 'onSubmit',
    defaultValues,
    resolver: yupResolver(resolvers())
  })

  const redirectWithError = (name = '') => {
    showError({
      message: `
        Cannot found provision template (${name}),
        ask your cloud administrator`
    })

    history.push(PATH.PROVIDERS.LIST)
  }

  const getProvisionTemplateByDir = ({ provision, provider, name }) =>
    provisionsTemplates
      ?.[provision]
      ?.provisions
      ?.[provider]
      ?.find(provisionTemplate => provisionTemplate.name === name)

  const onSubmit = formData => {
    const { template, provider, inputs } = formData
    const provisionTemplateSelected = template?.[0] ?? {}
    const providerIdSelected = provider?.[0]
    const providerName = providers?.find(({ ID }) => ID === providerIdSelected)?.NAME

    const provisionTemplate = getProvisionTemplateByDir(provisionTemplateSelected)

    if (!provisionTemplate) return redirectWithError(provisionTemplateSelected?.name)

    // update provider name if changed during form
    if (provisionTemplate.defaults?.provision?.provider_name) {
      set(provisionTemplate, 'defaults.provision.provider_name', providerName)
    } else if (provisionTemplate.hosts?.length > 0) {
      provisionTemplate.hosts.forEach(host => {
        set(host, 'provision.provider_name', providerName)
      })
    }

    const parseInputs = mapUserInputs(inputs)
    const formatData = {
      ...provisionTemplate,
      inputs: provisionTemplate?.inputs
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
