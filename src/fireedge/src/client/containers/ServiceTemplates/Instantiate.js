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
import { ReactElement } from 'react'
import { useHistory, useLocation } from 'react-router'

import { useGeneralApi } from 'client/features/General'
import {
  useDeployServiceTemplateMutation,
  useGetServiceTemplateQuery,
} from 'client/features/OneApi/serviceTemplate'
import { useGetVMGroupsQuery } from 'client/features/OneApi/vmGroup'
import { useGetHostsQuery } from 'client/features/OneApi/host'
import { useGetImagesQuery } from 'client/features/OneApi/image'
import { useGetUsersQuery } from 'client/features/OneApi/user'
import { useGetDatastoresQuery } from 'client/features/OneApi/datastore'

import {
  DefaultFormStepper,
  SkeletonStepsForm,
} from 'client/components/FormStepper'
import { InstantiateForm } from 'client/components/Forms/ServiceTemplate'
import { PATH } from 'client/apps/sunstone/routesOne'
import { T } from 'client/constants'

const _ = require('lodash')

/**
 * Displays the instantiate form for a Service Template.
 *
 * @returns {ReactElement} Service Template form
 */
function CreateServiceTemplate() {
  const history = useHistory()
  const { state: { ID: templateId, NAME } = {} } = useLocation()

  const { enqueueSuccess } = useGeneralApi()
  const [instantiate] = useDeployServiceTemplateMutation()

  const { data: apiTemplateData } = useGetServiceTemplateQuery({
    id: templateId,
  })

  const dataTemplate = _.cloneDeep(apiTemplateData)

  useGetVMGroupsQuery(undefined, { refetchOnMountOrArgChange: false })
  useGetHostsQuery(undefined, { refetchOnMountOrArgChange: false })
  useGetImagesQuery(undefined, { refetchOnMountOrArgChange: false })
  useGetUsersQuery(undefined, { refetchOnMountOrArgChange: false })
  useGetDatastoresQuery(undefined, { refetchOnMountOrArgChange: false })

  const onSubmit = async (jsonTemplate) => {
    const { instances = 1 } = jsonTemplate

    try {
      await Promise.all(
        Array.from({ length: instances }, async () =>
          instantiate({
            id: templateId,
            template: jsonTemplate,
          }).unwrap()
        )
      )

      history.push(PATH.INSTANCE.SERVICES.LIST)
      enqueueSuccess(T.SuccessServiceTemplateInitiated, [templateId, NAME])
    } catch {}
  }

  return templateId && !dataTemplate ? (
    <SkeletonStepsForm />
  ) : (
    <InstantiateForm
      initialValues={dataTemplate}
      stepProps={{
        dataTemplate,
      }}
      onSubmit={onSubmit}
      fallback={<SkeletonStepsForm />}
    >
      {(config) => <DefaultFormStepper {...config} />}
    </InstantiateForm>
  )
}

export default CreateServiceTemplate
