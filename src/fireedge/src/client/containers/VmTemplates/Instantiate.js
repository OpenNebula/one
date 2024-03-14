/* ------------------------------------------------------------------------- *
 * Copyright 2002-2023, OpenNebula Project, OpenNebula Systems               *
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

import { useSystemData } from 'client/features/Auth'
import { jsonToXml } from 'client/models/Helper'
import {
  filterTemplateData,
  transformActionsInstantiate,
} from 'client/utils/parser'
import { TAB_FORM_MAP } from 'client/constants'

const _ = require('lodash')

/**
 * Displays the instantiation form for a VM Template.
 *
 * @returns {ReactElement} Instantiation form
 */
function InstantiateVmTemplate() {
  const store = useStore()
  const history = useHistory()
  const { state: { ID: templateId, NAME: templateName } = {} } = useLocation()

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

  const dataTemplateExtended = _.cloneDeep(apiTemplateDataExtended)

  useGetUsersQuery(undefined, { refetchOnMountOrArgChange: false })
  useGetGroupsQuery(undefined, { refetchOnMountOrArgChange: false })

  const onSubmit = async (templates) => {
    try {
      const currentState = store.getState()
      const modifiedFields = currentState.general?.modifiedFields
      await Promise.all(
        templates.map((rawTemplate) => {
          const existingTemplate = {
            ...apiTemplateData?.TEMPLATE,
          }

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
          transformActionsInstantiate(filteredTemplate, apiTemplateData)

          const xmlFinal = jsonToXml(filteredTemplate)

          // Modify template
          rawTemplate.template = xmlFinal

          return instantiate(rawTemplate).unwrap()
        })
      )

      resetFieldPath()
      resetModifiedFields()

      history.push(PATH.INSTANCE.VMS.LIST)

      const total = templates.length
      const templateInfo = `#${templateId} ${templateName}`
      enqueueInfo(`VM Template instantiated x${total} - ${templateInfo}`)
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
