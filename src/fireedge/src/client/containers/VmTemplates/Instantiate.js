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
import { Redirect, useHistory, useLocation } from 'react-router'

import { useGeneralApi } from 'client/features/General'
import { useGetGroupsQuery } from 'client/features/OneApi/group'
import { useGetUsersQuery } from 'client/features/OneApi/user'
import {
  useGetTemplateQuery,
  useInstantiateTemplateMutation,
} from 'client/features/OneApi/vmTemplate'

import { PATH } from 'client/apps/sunstone/routesOne'
import {
  DefaultFormStepper,
  SkeletonStepsForm,
} from 'client/components/FormStepper'
import { InstantiateForm } from 'client/components/Forms/VmTemplate'

import { useSystemData, useViews } from 'client/features/Auth'
import { jsonToXml } from 'client/models/Helper'
import {
  filterTemplateData,
  transformActionsInstantiate,
} from 'client/utils/parser'
import { TAB_FORM_MAP, RESOURCE_NAMES, T } from 'client/constants'

const _ = require('lodash')

/**
 * Displays the instantiation form for a VM Template.
 *
 * @returns {ReactElement} Instantiation form
 */
function InstantiateVmTemplate() {
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
  const [instantiate] = useInstantiateTemplateMutation()

  const { adminGroup, oneConfig } = useSystemData()

  const { data: apiTemplateDataExtended, isError } = useGetTemplateQuery(
    { id: templateId, extended: true },
    { skip: templateId === undefined }
  )

  const { data: apiTemplateData } = useGetTemplateQuery(
    { id: templateId, extended: false },
    { skip: templateId === undefined }
  )

  // Clone template to be able to modify it
  const dataTemplateExtended = _.cloneDeep(apiTemplateDataExtended)

  // Get users and groups
  useGetUsersQuery(undefined, { refetchOnMountOrArgChange: false })
  useGetGroupsQuery(undefined, { refetchOnMountOrArgChange: false })

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

  return !dataTemplateExtended || !apiTemplateData || _.isEmpty(oneConfig) ? (
    <SkeletonStepsForm />
  ) : (
    <InstantiateForm
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
    </InstantiateForm>
  )
}

export default InstantiateVmTemplate
