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

import {
  DefaultFormStepper,
  SkeletonStepsForm,
  PATH,
  TranslateProvider,
  Form,
} from '@ComponentsModule'

import {
  useSystemData,
  useGeneralApi,
  VmTemplateAPI,
  VmGroupAPI,
  HostAPI,
  ImageAPI,
  UserAPI,
  DatastoreAPI,
} from '@FeaturesModule'

import { jsonToXml } from '@ModelsModule'

import { T } from '@ConstantsModule'

const { VrTemplate } = Form

// Should match ComponentsModules' VmTemplate form
const CUSTOM_ID = 'custom-variables'
const EXTRA_ID = 'extra'
const GENERAL_ID = 'general'

const _ = require('lodash')

/**
 * Displays the creation or modification form to a VM Template.
 *
 * @returns {ReactElement} VM Template form
 */
export function CreateVrTemplate() {
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
  const [update] = VmTemplateAPI.useUpdateTemplateMutation()
  const [allocate] = VmTemplateAPI.useAllocateTemplateMutation()

  const { adminGroup, oneConfig } = useSystemData()

  const { data: apiTemplateDataExtended } = VmTemplateAPI.useGetTemplateQuery(
    { id: templateId, extended: true },
    { skip: templateId === undefined }
  )

  const { data: apiTemplateData } = VmTemplateAPI.useGetTemplateQuery(
    { id: templateId, extended: false },
    { skip: templateId === undefined }
  )

  VmGroupAPI.useGetVMGroupsQuery(undefined, {
    refetchOnMountOrArgChange: false,
  })
  HostAPI.useGetHostsQuery(undefined, { refetchOnMountOrArgChange: false })
  ImageAPI.useGetImagesQuery(undefined, { refetchOnMountOrArgChange: false })
  UserAPI.useGetUsersQuery(undefined, { refetchOnMountOrArgChange: false })
  DatastoreAPI.useGetDatastoresQuery(undefined, {
    refetchOnMountOrArgChange: false,
  })

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

  return (
    <TranslateProvider>
      {templateId &&
      (!apiTemplateDataExtended || !apiTemplateData || _.isEmpty(oneConfig)) ? (
        <SkeletonStepsForm />
      ) : (
        <VrTemplate.CreateForm
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
        </VrTemplate.CreateForm>
      )}
    </TranslateProvider>
  )
}
