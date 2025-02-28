/* ------------------------------------------------------------------------- *
 * Copyright 2002-2025, OpenNebula Project, OpenNebula Systems               *
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

import {
  useGeneralApi,
  ServiceTemplateAPI,
  VmGroupAPI,
  HostAPI,
  ImageAPI,
  UserAPI,
  DatastoreAPI,
} from '@FeaturesModule'

import {
  DefaultFormStepper,
  Form,
  PATH,
  SkeletonStepsForm,
  TranslateProvider,
} from '@ComponentsModule'
import { T } from '@ConstantsModule'
const _ = require('lodash')
const { Vr } = Form

/**
 * Displays the creation or modification form for a VM Template.
 *
 * @returns {ReactElement} VM Template form
 */
export function CreateVirtualRouterTemplate() {
  const history = useHistory()
  const { state: { ID: templateId, NAME } = {} } = useLocation()

  const { enqueueSuccess } = useGeneralApi()
  const [update] = ServiceTemplateAPI.useUpdateServiceTemplateMutation()
  const [allocate] = ServiceTemplateAPI.useCreateServiceTemplateMutation()

  const { data: apiTemplateData } =
    ServiceTemplateAPI.useGetServiceTemplateQuery({
      id: templateId,
    })

  const dataTemplate = _.cloneDeep(apiTemplateData)

  VmGroupAPI.useGetVMGroupsQuery(undefined, {
    refetchOnMountOrArgChange: false,
  })
  HostAPI.useGetHostsQuery(undefined, { refetchOnMountOrArgChange: false })
  ImageAPI.useGetImagesQuery(undefined, { refetchOnMountOrArgChange: false })
  UserAPI.useGetUsersQuery(undefined, { refetchOnMountOrArgChange: false })
  DatastoreAPI.useGetDatastoresQuery(undefined, {
    refetchOnMountOrArgChange: false,
  })

  const onSubmit = async (jsonTemplate) => {
    try {
      if (!templateId) {
        const newTemplateId = await allocate({
          template: jsonTemplate,
        }).unwrap()
        history.push(PATH.TEMPLATE.SERVICES.LIST)
        enqueueSuccess(T.SuccessServiceTemplateCreated, [newTemplateId, NAME])
      } else {
        await update({
          id: templateId,
          template: jsonTemplate,
          merge: false,
        }).unwrap()
        history.push(PATH.TEMPLATE.SERVICES.LIST)
        enqueueSuccess(T.SuccessServiceTemplateUpdated, [templateId, NAME])
      }
    } catch {}
  }

  return (
    <TranslateProvider>
      {templateId && !dataTemplate ? (
        <SkeletonStepsForm />
      ) : (
        <Vr.CreateForm
          initialValues={dataTemplate}
          stepProps={{
            dataTemplate,
          }}
          onSubmit={onSubmit}
          fallback={<SkeletonStepsForm />}
        >
          {(config) => <DefaultFormStepper {...config} />}
        </Vr.CreateForm>
      )}
    </TranslateProvider>
  )
}
