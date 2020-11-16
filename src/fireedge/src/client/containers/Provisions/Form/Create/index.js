import React from 'react'
import { useHistory } from 'react-router'

import { Container } from '@material-ui/core'
import { useForm, FormProvider } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers'

import useProvision from 'client/hooks/useProvision'
import FormStepper from 'client/components/FormStepper'
import Steps from 'client/containers/Provisions/Form/Create/Steps'
import { PATH } from 'client/router/provision'

function ProvisionCreateForm () {
  const history = useHistory()
  const { createProvision } = useProvision()
  const { steps, defaultValues, resolvers } = Steps()

  const methods = useForm({
    mode: 'onSubmit',
    defaultValues,
    resolver: yupResolver(resolvers())
  })

  const onSubmit = data => {
    createProvision({ data })
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
