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

import { useGetUsersQuery } from 'client/features/OneApi/user'
import { useGetGroupsQuery } from 'client/features/OneApi/group'
import { useLazyGetTemplateQuery } from 'client/features/OneApi/vmTemplate'
import FormStepper, { SkeletonStepsForm } from 'client/components/FormStepper'
import Steps from 'client/components/Forms/VmTemplate/InstantiateForm/Steps'

const InstantiateForm = ({ template, onSubmit }) => {
  const stepsForm = useMemo(() => Steps(template, template), [])
  const { steps, defaultValues, resolver, transformBeforeSubmit } = stepsForm

  const methods = useForm({
    mode: 'onSubmit',
    defaultValues,
    resolver: yupResolver(resolver?.()),
  })

  return (
    <FormProvider {...methods}>
      <FormStepper
        steps={steps}
        schema={resolver}
        onSubmit={(data) =>
          onSubmit(transformBeforeSubmit?.(data, template) ?? data)
        }
      />
    </FormProvider>
  )
}

const PreFetchingForm = ({ templateId, onSubmit }) => {
  useGetUsersQuery()
  useGetGroupsQuery()
  const [getTemplate, { data }] = useLazyGetTemplateQuery()

  useEffect(() => {
    templateId && getTemplate({ id: templateId, extended: true })
  }, [])

  return templateId && !data ? (
    <SkeletonStepsForm />
  ) : (
    <InstantiateForm template={data} onSubmit={onSubmit} />
  )
}

PreFetchingForm.propTypes = {
  templateId: PropTypes.string,
  onSubmit: PropTypes.func,
}

InstantiateForm.propTypes = {
  template: PropTypes.object,
  onSubmit: PropTypes.func,
}

export default PreFetchingForm
