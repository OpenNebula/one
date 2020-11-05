import React from 'react'
import { useHistory } from 'react-router'

import { useForm, FormProvider } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers'

import useProvision from 'client/hooks/useProvision'
import FormStepper from 'client/components/FormStepper'
import Steps from 'client/containers/Providers/Form/Create/Steps'
import { PATH } from 'client/router/provision'

function ProviderCreateForm () {
  const history = useHistory()
  const { createProvider } = useProvision()
  const { steps, defaultValues, resolvers } = Steps()

  const methods = useForm({
    mode: 'onSubmit',
    defaultValues,
    resolver: yupResolver(resolvers())
  })

  const onSubmit = formData => {
    console.log('formData', formData)
    createProvider({ data: formData })
      .then(() => history.push(PATH.PROVIDERS.LIST))
  }

  return (
    <FormProvider {...methods}>
      <FormStepper steps={steps} schema={resolvers} onSubmit={onSubmit} />
    </FormProvider>
  )
}

ProviderCreateForm.propTypes = {}

ProviderCreateForm.defaultProps = {}

export default ProviderCreateForm
