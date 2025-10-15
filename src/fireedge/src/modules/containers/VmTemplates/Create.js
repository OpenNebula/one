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
import { ReactElement, useEffect } from 'react'
import { useStore } from 'react-redux'
import { useHistory, useLocation } from 'react-router'

import {
  DatastoreAPI,
  HostAPI,
  ImageAPI,
  SystemAPI,
  useGeneralApi,
  UserAPI,
  useSystemData,
  VmGroupAPI,
  VmTemplateAPI,
} from '@FeaturesModule'

import {
  DefaultFormStepper,
  Form,
  PATH,
  SkeletonStepsForm,
  TranslateProvider,
} from '@ComponentsModule'

import { STEP_MAP, T, TAB_FORM_MAP } from '@ConstantsModule'
import { jsonToXml } from '@ModelsModule'
import {
  deepmerge,
  filterTemplateData,
  isDevelopment,
  transformActionsCreate,
} from '@UtilsModule'

const { VmTemplate } = Form
const _ = require('lodash')

/**
 * Displays the creation or modification form to a VM Template.
 *
 * @returns {ReactElement} VM Template form
 */
export function CreateVmTemplate() {
  // Reset modified fields + path on mount
  useEffect(() => {
    resetFieldPath()
    resetModifiedFields()
  }, [])

  // Get store
  const store = useStore()

  // Get history
  const history = useHistory()
  const { state: { ID: templateId, NAME } = {} } = useLocation()

  // Hooks
  const { enqueueSuccess, resetFieldPath, resetModifiedFields } =
    useGeneralApi()
  const [fetchProfile] = SystemAPI.useLazyGetOsProfilesQuery()
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
      // Get current state and modified fields
      const currentState = store.getState()
      const osProfile = rawTemplate?.general?.OS_PROFILE
      let modifiedFields = currentState.general?.modifiedFields
      // This loads the OS profile and marks all fields of it as modified so they wont be filtered out
      if (osProfile && osProfile !== '-') {
        try {
          const convertLeafValuesToBoolean = (obj) =>
            Object.fromEntries(
              Object.entries(obj).map(([key, value]) => {
                if (typeof value === 'object' && value !== null) {
                  return [key, convertLeafValuesToBoolean(value)]
                }

                return [key, value != null]
              })
            )

          const { data: fetchedProfile } = await fetchProfile({ id: osProfile })
          const mappedSteps = Object.fromEntries(
            Object.entries(fetchedProfile).map(([step, values]) => [
              STEP_MAP[step] || step,
              convertLeafValuesToBoolean(values),
            ])
          )
          modifiedFields = deepmerge(modifiedFields, mappedSteps)
        } catch (error) {
          isDevelopment() &&
            console.error('Failed mapping profile filter: ', error)
        }
      }

      // Get the original template
      const existingTemplate = {
        ...apiTemplateData?.TEMPLATE,
      }

      // Filter template to delete attributes that the user has not interact with them
      const filteredTemplate = filterTemplateData(
        rawTemplate,
        modifiedFields,
        existingTemplate,
        TAB_FORM_MAP,
        {
          instantiate: false,
          update: !!templateId,
        }
      )

      if (rawTemplate?.general?.MEMORYUNIT) {
        filteredTemplate.MEMORYUNIT = rawTemplate.general.MEMORYUNIT
      }

      // Every action that is not an human action
      transformActionsCreate(filteredTemplate)

      // Convert template to xml
      const xmlTemplate = jsonToXml(filteredTemplate, {
        excluded: ['RAW.DATA'],
      })

      // Update or create the template
      if (!templateId) {
        const newTemplateId = await allocate({
          template: xmlTemplate,
        }).unwrap()
        resetFieldPath()
        resetModifiedFields()
        history.push(PATH.TEMPLATE.VMS.LIST)
        enqueueSuccess(T.SuccessVMTemplateCreated, newTemplateId)
      } else {
        await update({ id: templateId, template: xmlTemplate }).unwrap()
        resetFieldPath()
        resetModifiedFields()
        history.push(PATH.TEMPLATE.VMS.LIST)
        enqueueSuccess(T.SuccessVMTemplateUpdated, [templateId, NAME])
      }
    } catch (error) {
      isDevelopment() && console.log('VM Template error: ', error)
    }
  }

  return (
    <TranslateProvider>
      {templateId &&
      (!apiTemplateDataExtended || !apiTemplateData || _.isEmpty(oneConfig)) ? (
        <SkeletonStepsForm />
      ) : (
        <VmTemplate.CreateForm
          initialValues={apiTemplateDataExtended}
          stepProps={{
            apiTemplateDataExtended,
            oneConfig,
            adminGroup,
            store,
            isVrouter: false,
          }}
          onSubmit={onSubmit}
          fallback={<SkeletonStepsForm />}
        >
          {(config) => <DefaultFormStepper {...config} />}
        </VmTemplate.CreateForm>
      )}
    </TranslateProvider>
  )
}
