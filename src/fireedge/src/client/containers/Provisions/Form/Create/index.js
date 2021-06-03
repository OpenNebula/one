import React, { useState, useEffect } from 'react'
import { Redirect, useHistory } from 'react-router'

import { Container, IconButton, LinearProgress } from '@material-ui/core'
import { NavArrowLeft as ArrowBackIcon } from 'iconoir-react'

import { useForm, FormProvider } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers'

import FormStepper from 'client/components/FormStepper'
import Steps from 'client/containers/Provisions/Form/Create/Steps'
import formCreateStyles from 'client/containers/Provisions/Form/Create/styles'
import DebugLog from 'client/components/DebugLog'

import { useSocket, useFetch } from 'client/hooks'
import { useProviderApi, useProvisionApi } from 'client/features/One'
import { useGeneralApi } from 'client/features/General'
import { PATH } from 'client/apps/provision/routes'
import { set, cloneObject, mapUserInputs } from 'client/utils'

import { Translate } from 'client/components/HOC'
import { T } from 'client/constants'

function ProvisionCreateForm () {
  const classes = formCreateStyles()
  const history = useHistory()

  const [uuid, setUuid] = useState(undefined)

  const { getProvision } = useSocket()
  const { getProviders } = useProviderApi()
  const { createProvision } = useProvisionApi()
  const { enqueueInfo } = useGeneralApi()

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
    const providerName = provider?.[0]?.NAME

    // clone object from redux store
    const provisionTemplateSelected = cloneObject(template?.[0] ?? {})

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

    createProvision(formatData)
      .then(res => res && setUuid(res))
      .then(() => enqueueInfo('Creating provision'))
  }

  useEffect(() => { fetchRequest() }, [])

  if (uuid) {
    return (
      <DebugLog
        uuid={uuid}
        socket={getProvision}
        title={(
          <div className={classes.titleWrapper}>
            <IconButton aria-label='back-to-list' size='medium'
              onClick={() => history.push(PATH.PROVISIONS.LIST)}
            >
              <ArrowBackIcon />
            </IconButton>
            <span className={classes.titleText}>
              <Translate word={T.BackToList} values={T.Provisions} />
            </span>
          </div>
        )}
      />
    )
  }

  if (error) {
    return <Redirect to={PATH.PROVISIONS.LIST} />
  }

  return (!data) || loading ? (
    <LinearProgress color='secondary' />
  ) : (
    <Container className={classes.root} disableGutters>
      <FormProvider {...methods}>
        <FormStepper steps={steps} schema={resolvers} onSubmit={onSubmit} />
      </FormProvider>
    </Container>
  )
}

ProvisionCreateForm.propTypes = {}

ProvisionCreateForm.defaultProps = {}

export default ProvisionCreateForm
