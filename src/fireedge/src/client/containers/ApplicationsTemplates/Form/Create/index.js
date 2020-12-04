import React, { useEffect } from 'react'
import { Redirect, useHistory, useParams } from 'react-router-dom'

import { LinearProgress, Container } from '@material-ui/core'
import { useForm, FormProvider } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers'

import FormStepper from 'client/components/FormStepper'
import Steps from 'client/containers/ApplicationsTemplates/Form/Create/Steps'

import { PATH } from 'client/router/flow'
import { useApplication, useFetch } from 'client/hooks'
import { parseApplicationToForm, parseFormToApplication } from 'client/utils'

function ApplicationsTemplatesCreateForm () {
  const history = useHistory()
  const { id } = useParams()
  const { steps, defaultValues, resolvers } = Steps()
  const {
    getApplicationTemplate,
    createApplicationTemplate,
    updateApplicationTemplate
  } = useApplication()
  const { data, fetchRequest, loading, error } = useFetch(
    getApplicationTemplate
  )

  const methods = useForm({
    mode: 'onSubmit',
    defaultValues,
    resolver: yupResolver(resolvers())
  })

  const onSubmit = formData => {
    const application = parseApplicationToForm(formData)

    if (id) {
      updateApplicationTemplate({ id, data: application }).then(
        res => res && history.push(PATH.APPLICATIONS_TEMPLATES.LIST)
      )
    } else {
      createApplicationTemplate({ data: application }).then(
        res => res && history.push(PATH.APPLICATIONS_TEMPLATES.LIST)
      )
    }
  }

  useEffect(() => {
    id && fetchRequest({ id })
  }, [id])

  useEffect(() => {
    const formData = data ? parseFormToApplication(data) : {}
    methods.reset(resolvers().cast(formData), { errors: false })
  }, [data])

  if (error) {
    return <Redirect to={PATH.DASHBOARD} />
  }

  return (id && !data) || loading ? (
    <LinearProgress color='secondary' />
  ) : (
    <Container
      disableGutters
      style={{ display: 'flex', flexFlow: 'column', height: '100%' }}
    >
      <FormProvider {...methods}>
        <FormStepper steps={steps} schema={resolvers} onSubmit={onSubmit} />
      </FormProvider>
    </Container>
  )
}

ApplicationsTemplatesCreateForm.propTypes = {}

ApplicationsTemplatesCreateForm.defaultProps = {}

export default ApplicationsTemplatesCreateForm
