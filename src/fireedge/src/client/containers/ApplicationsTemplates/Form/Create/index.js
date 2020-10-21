import React, { useEffect } from 'react'
import { Redirect, useHistory, useParams } from 'react-router-dom'

import { LinearProgress } from '@material-ui/core'
import { useForm, FormProvider } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers'

import FormStepper from 'client/components/FormStepper'
import Steps from 'client/containers/ApplicationsTemplates/Form/Create/Steps'

import { PATH } from 'client/router/endpoints'
import useFetch from 'client/hooks/useFetch'
import useApplication from 'client/hooks/useApplication'
import mapApplicationToForm from 'client/utils/parser/toApplicationForm'
import mapFormToApplication from 'client/utils/parser/toApplicationTemplate'

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
    resolver: yupResolver(resolvers)
  })

  const onSubmit = formData => {
    const application = mapFormToApplication(formData)

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
    const formData = data ? mapApplicationToForm(data) : {}
    methods.reset(resolvers.cast(formData), { errors: false })
  }, [data])

  if (error) {
    return <Redirect to={PATH.DASHBOARD} />
  }

  return (id && !data) || loading ? (
    <LinearProgress />
  ) : (
    <FormProvider {...methods}>
      <FormStepper steps={steps} schema={resolvers} onSubmit={onSubmit} />
    </FormProvider>
  )
}

ApplicationsTemplatesCreateForm.propTypes = {}

ApplicationsTemplatesCreateForm.defaultProps = {}

export default ApplicationsTemplatesCreateForm
