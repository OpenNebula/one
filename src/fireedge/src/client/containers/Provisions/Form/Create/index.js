import React, { useState, useEffect } from 'react'
import { Redirect, useHistory } from 'react-router'

import { Container, IconButton, LinearProgress } from '@material-ui/core'
import ArrowBackIcon from '@material-ui/icons/ChevronLeftRounded'
import { useForm, FormProvider } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers'

import FormStepper from 'client/components/FormStepper'
import Steps from 'client/containers/Provisions/Form/Create/Steps'
import formCreateStyles from 'client/containers/Provisions/Form/Create/styles'
import DebugLog from 'client/components/DebugLog'

import { useProvision, useSocket, useFetch } from 'client/hooks'
import { PATH } from 'client/router/provision'
import { set, mapUserInputs } from 'client/utils'

import { Translate } from 'client/components/HOC'
import { T } from 'client/constants'

function ProvisionCreateForm () {
  const classes = formCreateStyles()
  const history = useHistory()

  const [uuid, setUuid] = useState(undefined)
  const { getProvision } = useSocket()

  const { getProviders, createProvision } = useProvision()

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
    const provisionTemplateSelected = JSON.parse(JSON.stringify(template?.[0] ?? {}))

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
    return (
      <DebugLog
        uuid={uuid}
        socket={getProvision}
        title={(
          <div className={classes.titleWrapper}>
            <IconButton aria-label='back-to-list' size='medium'
              onClick={() => history.push(PATH.PROVISIONS.LIST)}
            >
              <ArrowBackIcon fontSize='large' />
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
