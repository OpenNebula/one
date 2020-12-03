import React, { useState } from 'react'
import { useHistory } from 'react-router'

import { Container } from '@material-ui/core'
import { useForm, FormProvider } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers'

import { useGeneral, useProvision, useSocket } from 'client/hooks'

import FormStepper from 'client/components/FormStepper'
import Steps from 'client/containers/Provisions/Form/Create/Steps'
import DebugLog from 'client/components/DebugLog'
import { PATH } from 'client/router/provision'
import { set, mapUserInputs } from 'client/utils'

function ProvisionCreateForm () {
  const [uuid, setUuid] = useState(undefined)
  const history = useHistory()
  const { showError } = useGeneral()
  const { getProvision } = useSocket()
  const { createProvision, provisionsTemplates } = useProvision()

  const { steps, defaultValues, resolvers } = Steps()

  const methods = useForm({
    mode: 'onSubmit',
    defaultValues,
    resolver: yupResolver(resolvers())
  })

  const onSubmit = formData => {
    const { provision, provider, inputs } = formData
    const provisionSelected = provision[0]
    const providerSelected = provider[0]

    const provisionTemplate = provisionsTemplates
      .find(({ name }) => name === provisionSelected)

    if (!provisionTemplate) {
      showError({
        message: `
          Cannot found provider template (${provisionSelected}),
          ask your cloud administrator`
      })
      history.push(PATH.PROVISIONS.LIST)
    }

    set(provisionTemplate, 'defaults.provision.provider', providerSelected)

    const parseInputs = mapUserInputs(inputs)
    const formatData = {
      ...provisionTemplate,
      inputs: provisionTemplate?.inputs
        ?.map(input => ({ ...input, value: `${parseInputs[input?.name]}` }))
    }

    createProvision({ data: formatData }).then(res => res && setUuid(res))
  }

  if (uuid) {
    return <DebugLog uuid={uuid} socket={getProvision} />
  }

  return (
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
