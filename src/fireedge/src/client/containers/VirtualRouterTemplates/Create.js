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
import { ReactElement, useEffect } from 'react'
import { useStore } from 'react-redux'
import { useHistory, useLocation } from 'react-router'

import { STEP_ID as GENERAL_ID } from 'client/components/Forms/VmTemplate/CreateForm/Steps/General'
import { STEP_ID as EXTRA_ID } from 'client/components/Forms/VmTemplate/CreateForm/Steps/ExtraConfiguration'
import { STEP_ID as CUSTOM_ID } from 'client/components/Forms/VmTemplate/CreateForm/Steps/CustomVariables'

import { useGeneralApi } from 'client/features/General'
import {
  useUpdateTemplateMutation,
  useAllocateTemplateMutation,
  useGetTemplateQuery,
} from 'client/features/OneApi/vmTemplate'
import { useGetVMGroupsQuery } from 'client/features/OneApi/vmGroup'
import { useGetHostsQuery } from 'client/features/OneApi/host'
import { useGetImagesQuery } from 'client/features/OneApi/image'
import { useGetUsersQuery } from 'client/features/OneApi/user'
import { useGetDatastoresQuery } from 'client/features/OneApi/datastore'

import {
  DefaultFormStepper,
  SkeletonStepsForm,
} from 'client/components/FormStepper'
import { CreateForm } from 'client/components/Forms/VmTemplate'
import { PATH } from 'client/apps/sunstone/routesOne'

import { jsonToXml } from 'client/models/Helper'

import { useSystemData } from 'client/features/Auth'
import { T } from 'client/constants'

const _ = require('lodash')

/**
 * Displays the creation or modification form to a VM Template.
 *
 * @returns {ReactElement} VM Template form
 */
function CreateVRTemplate() {
  // Reset modified fields + path on mount
  useEffect(() => {
    resetFieldPath()
    resetModifiedFields()
  }, [])

  const store = useStore()

  const history = useHistory()
  const { state: { ID: templateId, NAME } = {} } = useLocation()

  const { enqueueSuccess, resetFieldPath, resetModifiedFields } =
    useGeneralApi()
  const [update] = useUpdateTemplateMutation()
  const [allocate] = useAllocateTemplateMutation()

  const { adminGroup, oneConfig } = useSystemData()

  const { data: apiTemplateDataExtended } = useGetTemplateQuery(
    { id: templateId, extended: true },
    { skip: templateId === undefined }
  )

  const { data: apiTemplateData } = useGetTemplateQuery(
    { id: templateId, extended: false },
    { skip: templateId === undefined }
  )

  useGetVMGroupsQuery(undefined, { refetchOnMountOrArgChange: false })
  useGetHostsQuery(undefined, { refetchOnMountOrArgChange: false })
  useGetImagesQuery(undefined, { refetchOnMountOrArgChange: false })
  useGetUsersQuery(undefined, { refetchOnMountOrArgChange: false })
  useGetDatastoresQuery(undefined, { refetchOnMountOrArgChange: false })

  const onSubmit = async (rawTemplate) => {
    try {
      const {
        [GENERAL_ID]: general = {},
        [CUSTOM_ID]: customVariables = {},
        [EXTRA_ID]: extraTemplate = {},
      } = rawTemplate ?? {}

      const xmlTemplate = jsonToXml({
        ...general,
        ...extraTemplate,
        ...customVariables,
      })

      if (!templateId) {
        const newTemplateId = await allocate({
          template: xmlTemplate,
        }).unwrap()
        resetFieldPath()
        resetModifiedFields()
        history.push(PATH.TEMPLATE.VROUTERS.LIST)
        enqueueSuccess(T.SuccessVrTemplateCreated, newTemplateId)
      } else {
        await update({ id: templateId, template: xmlTemplate }).unwrap()
        resetFieldPath()
        resetModifiedFields()
        history.push(PATH.TEMPLATE.VROUTERS.LIST)
        enqueueSuccess(T.SuccessVrTemplateUpdated, [templateId, NAME])
      }
    } catch {}
  }

  return templateId &&
    (!apiTemplateDataExtended || !apiTemplateData || _.isEmpty(oneConfig)) ? (
    <SkeletonStepsForm />
  ) : (
    <CreateForm
      initialValues={apiTemplateDataExtended}
      stepProps={{
        apiTemplateDataExtended,
        oneConfig,
        adminGroup,
        store,
        isVrouter: true,
      }}
      onSubmit={onSubmit}
      fallback={<SkeletonStepsForm />}
    >
      {(config) => <DefaultFormStepper {...config} />}
    </CreateForm>
  )
}

export default CreateVRTemplate
