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
import { useEffect, useMemo } from 'react'
import PropTypes from 'prop-types'

import { useForm, FormProvider } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'

import { useFetch } from 'client/hooks'
// import { useUserApi, useVmGroupApi, useVmTemplateApi } from 'client/features/One'
import { useVmTemplateApi, useHostApi, useImageApi, useDatastoreApi } from 'client/features/One'
import FormStepper, { SkeletonStepsForm } from 'client/components/FormStepper'
import Steps from 'client/components/Forms/VmTemplate/CreateForm/Steps'

const CreateForm = ({ template, onSubmit }) => {
  const stepsForm = useMemo(() => Steps(template, template), [])
  const { steps, defaultValues, resolver, transformBeforeSubmit } = stepsForm

  const methods = useForm({
    mode: 'onSubmit',
    defaultValues,
    resolver: yupResolver(resolver?.())
  })

  return (
    <FormProvider {...methods}>
      <FormStepper
        steps={steps}
        schema={resolver}
        onSubmit={data => onSubmit(transformBeforeSubmit?.(data) ?? data)}
      />
    </FormProvider>
  )
}

const PreFetchingForm = ({ templateId, onSubmit }) => {
  // const { getUsers } = useUserApi()
  // const { getVmGroups } = useVmGroupApi()
  const { getHosts } = useHostApi()
  const { getImages } = useImageApi()
  const { getDatastores } = useDatastoreApi()
  const { getVmTemplate } = useVmTemplateApi()
  const { fetchRequest, data } = useFetch(
    () => getVmTemplate(templateId, { extended: true })
  )

  useEffect(() => {
    templateId && fetchRequest()
    getHosts()
    getImages()
    getDatastores()
    // getUsers()
    // getVmGroups()
  }, [])

  return (templateId && !data)
    ? <SkeletonStepsForm />
    : <CreateForm template={data} onSubmit={onSubmit} />
}

PreFetchingForm.propTypes = {
  templateId: PropTypes.string,
  onSubmit: PropTypes.func
}

CreateForm.propTypes = {
  template: PropTypes.object,
  onSubmit: PropTypes.func
}

export default PreFetchingForm
