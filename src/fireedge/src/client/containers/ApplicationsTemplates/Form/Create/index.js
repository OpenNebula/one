/* ------------------------------------------------------------------------- *
 * Copyright 2002-2024, OpenNebula Project, OpenNebula Systems               *
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
/* import { useEffect } from 'react'
import { Redirect, useHistory, useParams } from 'react-router-dom'

import { LinearProgress, Container } from '@mui/material'
import { useForm, FormProvider } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'

import FormStepper from 'client/components/FormStepper'
import Steps from 'client/containers/ApplicationsTemplates/Form/Create/Steps'

import { PATH } from 'client/apps/sunstone/routesFlow'
import { useGetServiceTemplateQuery } from 'client/features/OneApi/serviceTemplate'
import { parseApplicationToForm, parseFormToApplication } from 'client/utils' */

function ApplicationsTemplatesCreateForm() {
  /* const history = useHistory()
  const { id } = useParams()
  const { steps, defaultValues, resolvers } = Steps()

  const {
    getApplicationTemplate,
    createApplicationTemplate,
    updateApplicationTemplate,
  } = useApplicationTemplateApi()

  const { data, fetchRequest, loading, error } = useFetch(
    getApplicationTemplate
  )

  const methods = useForm({
    mode: 'onSubmit',
    defaultValues,
    resolver: yupResolver(resolvers()),
  })

  const onSubmit = (formData) => {
    const application = parseFormToApplication(formData)

    if (id) {
      updateApplicationTemplate(id, application).then(
        (res) => res && history.push(PATH.APPLICATIONS_TEMPLATES.LIST)
      )
    } else {
      createApplicationTemplate(application).then(
        (res) => res && history.push(PATH.APPLICATIONS_TEMPLATES.LIST)
      )
    }
  }

  useEffect(() => {
    id && fetchRequest({ id })
  }, [id])

  useEffect(() => {
    const formData = data ? parseApplicationToForm(data) : {}

    methods.reset(resolvers().cast(formData), { keepErrors: false })
  }, [data])

  if (error) {
    return <Redirect to={PATH.DASHBOARD} />
  }

  return (id && !data) || loading ? (
    <LinearProgress color="secondary" />
  ) : (
    <Container
      disableGutters
      sx={{ display: 'flex', flexFlow: 'column', height: '100%' }}
    >
      <FormProvider {...methods}>
        <FormStepper steps={steps} schema={resolvers} onSubmit={onSubmit} />
      </FormProvider>
    </Container>
  ) */
  return <>{'Create service template form WIP'}</>
}

export default ApplicationsTemplatesCreateForm
