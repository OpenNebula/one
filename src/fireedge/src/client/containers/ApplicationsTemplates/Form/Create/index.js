/* ------------------------------------------------------------------------- *
 * Copyright 2002-2021, OpenNebula Project, OpenNebula Systems               *
 *                                                                           *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may   *
 * not use this file except in compliance with the License. You may obtain   *
 * a copy of the License at                                                  *
 *                                                                           *
 * http://www.apache.org/licenses/LICENSE-2.0                                *
 *                                                                           *
 * Unless required by applicable law or agreed to in writing, software       *
 * distributed under the License is distributed on an "AS IS" BASIS,         *
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  *
 * See the License for the specific language governing permissions and       *
 * limitations under the License.                                            *
 * ------------------------------------------------------------------------- */
/* eslint-disable jsdoc/require-jsdoc */
import React, { useEffect } from 'react'
import { Redirect, useHistory, useParams } from 'react-router-dom'

import { LinearProgress, Container } from '@material-ui/core'
import { useForm, FormProvider } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers'

import FormStepper from 'client/components/FormStepper'
import Steps from 'client/containers/ApplicationsTemplates/Form/Create/Steps'

import { PATH } from 'client/apps/sunstone/routesFlow'
import { useFetch } from 'client/hooks'
import { useApplicationTemplateApi } from 'client/features/One'
import { parseApplicationToForm, parseFormToApplication } from 'client/utils'

function ApplicationsTemplatesCreateForm () {
  const history = useHistory()
  const { id } = useParams()
  const { steps, defaultValues, resolvers } = Steps()

  const {
    getApplicationTemplate,
    createApplicationTemplate,
    updateApplicationTemplate
  } = useApplicationTemplateApi()

  const { data, fetchRequest, loading, error } = useFetch(
    getApplicationTemplate
  )

  const methods = useForm({
    mode: 'onSubmit',
    defaultValues,
    resolver: yupResolver(resolvers())
  })

  const onSubmit = formData => {
    const application = parseFormToApplication(formData)

    if (id) {
      updateApplicationTemplate(id, application)
        .then(res => res && history.push(PATH.APPLICATIONS_TEMPLATES.LIST))
    } else {
      createApplicationTemplate(application)
        .then(res => res && history.push(PATH.APPLICATIONS_TEMPLATES.LIST))
    }
  }

  useEffect(() => {
    id && fetchRequest({ id })
  }, [id])

  useEffect(() => {
    const formData = data ? parseApplicationToForm(data) : {}

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
