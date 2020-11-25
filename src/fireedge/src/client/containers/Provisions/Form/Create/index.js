import React from 'react'
import { useHistory } from 'react-router'

import { Container } from '@material-ui/core'
import { useForm, FormProvider } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers'

import FormStepper from 'client/components/FormStepper'
import Steps from 'client/containers/Provisions/Form/Create/Steps'

import { PATH } from 'client/router/provision'
import useProvision from 'client/hooks/useProvision'
import useGeneral from 'client/hooks/useGeneral'

function ProvisionCreateForm () {
  const history = useHistory()
  const { showError } = useGeneral()
  const { createProvision, provisionsTemplates } = useProvision()
  const { steps, defaultValues, resolvers } = Steps()

  const methods = useForm({
    mode: 'onSubmit',
    defaultValues,
    resolver: yupResolver(resolvers())
  })

  const onSubmit = formData => {
    const { provision, inputs } = formData
    const provisionSelected = provision[0]

    const provisionTemplate = provisionsTemplates
      .find(({ name }) => name === provisionSelected)

    if (!provisionTemplate) {
      showError(`
          Cannot found provider template (${provisionSelected}),
          ask your cloud administrator`)
      history.push(PATH.PROVISIONS.LIST)
    }

    const formatData = {
      ...provisionTemplate,
      inputs: provisionTemplate?.inputs
        ?.map(input => ({ ...input, value: `${inputs[input?.name]}` }))
    }

    createProvision({ data: formatData })
      .then(() => history.push(PATH.PROVISIONS.LIST))
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
