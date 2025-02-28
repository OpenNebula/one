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
import { Redirect, useHistory, useLocation } from 'react-router'

import {
  useGeneralApi,
  UserAPI,
  GroupAPI,
  VmTemplateAPI,
  useSystemData,
  useViews,
} from '@FeaturesModule'

import {
  DefaultFormStepper,
  SkeletonStepsForm,
  PATH,
  Form,
  TranslateProvider,
} from '@ComponentsModule'

import { jsonToXml } from '@ModelsModule'
import { filterTemplateData, transformActionsInstantiate } from '@UtilsModule'
import { TAB_FORM_MAP, RESOURCE_NAMES, T } from '@ConstantsModule'

const _ = require('lodash')
const { VmTemplate } = Form

/**
 * Displays the instantiation form for a VM Template.
 *
 * @returns {ReactElement} Instantiation form
 */
export function InstantiateVmTemplate() {
  // Reset modified fields + path on mount
  useEffect(() => {
    resetFieldPath()
    resetModifiedFields()
  }, [])

  // Get store
  const store = useStore()

  // Get history
  const history = useHistory()
  const { state: { ID: templateId, NAME: templateName } = {} } = useLocation()

  // Hooks
  const { enqueueInfo, resetFieldPath, resetModifiedFields } = useGeneralApi()
  const [instantiate] = VmTemplateAPI.useInstantiateTemplateMutation()

  const { adminGroup, oneConfig } = useSystemData()

  const { data: apiTemplateDataExtended, isError } =
    VmTemplateAPI.useGetTemplateQuery(
      { id: templateId, extended: true },
      { skip: templateId === undefined }
    )

  const { data: apiTemplateData } = VmTemplateAPI.useGetTemplateQuery(
    { id: templateId, extended: false },
    { skip: templateId === undefined }
  )

  // Clone template to be able to modify it
  const dataTemplateExtended = _.cloneDeep(apiTemplateDataExtended)

  // Get users and groups
  UserAPI.useGetUsersQuery(undefined, { refetchOnMountOrArgChange: false })
  GroupAPI.useGetGroupsQuery(undefined, { refetchOnMountOrArgChange: false })

  // Features of the view
  const { getResourceView } = useViews()
  const resource = RESOURCE_NAMES.VM_TEMPLATE
  const { features } = getResourceView(resource)

  const onSubmit = async (templates) => {
    try {
      // Get current state and modified fields
      const currentState = store.getState()
      const modifiedFields = currentState.general?.modifiedFields

      // Iterate over all the templates
      await Promise.all(
        templates.map((rawTemplate) => {
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
              instantiate: true,
            }
          )

          // Every action that is not an human action
          transformActionsInstantiate(
            filteredTemplate,
            apiTemplateData,
            features
          )

          // Convert template to xml
          const xmlFinal = jsonToXml(filteredTemplate)

          // Modify template
          rawTemplate.template = xmlFinal

          // Instantiate virtual machine
          return instantiate(rawTemplate).unwrap()
        })
      )

      resetFieldPath()
      resetModifiedFields()

      history.push(PATH.INSTANCE.VMS.LIST)

      const total = templates.length
      const templateInfo = `#${templateId} ${templateName}`
      enqueueInfo(T.InfoVMTemplateInstantiated, [total, templateInfo])
    } catch {}
  }

  if (!templateId || isError) {
    return <Redirect to={PATH.TEMPLATE.VMS.LIST} />
  }

  return (
    <TranslateProvider>
      {!dataTemplateExtended || !apiTemplateData || _.isEmpty(oneConfig) ? (
        <SkeletonStepsForm />
      ) : (
        <VmTemplate.InstantiateForm
          initialValues={dataTemplateExtended}
          stepProps={{
            dataTemplateExtended,
            oneConfig,
            adminGroup,
          }}
          onSubmit={onSubmit}
          fallback={<SkeletonStepsForm />}
        >
          {(config) => <DefaultFormStepper {...config} />}
        </VmTemplate.InstantiateForm>
      )}
    </TranslateProvider>
  )
}
