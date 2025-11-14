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

import { useGeneralApi } from 'client/features/General'
import { useGetDatastoresQuery } from 'client/features/OneApi/datastore'
import { useGetHostsQuery } from 'client/features/OneApi/host'
import { useGetImagesQuery } from 'client/features/OneApi/image'
import { useGetUsersQuery } from 'client/features/OneApi/user'
import { useGetVMGroupsQuery } from 'client/features/OneApi/vmGroup'
import {
  useAllocateTemplateMutation,
  useGetTemplateQuery,
  useUpdateTemplateMutation,
} from 'client/features/OneApi/vmTemplate'

import { PATH } from 'client/apps/sunstone/routesOne'
import {
  DefaultFormStepper,
  SkeletonStepsForm,
} from 'client/components/FormStepper'
import { CreateForm } from 'client/components/Forms/VmTemplate'

import { T, TAB_FORM_MAP } from 'client/constants'
import { jsonToXml } from 'client/models/Helper'
import { deepmerge, isDevelopment } from 'client/utils'
import { filterTemplateData, transformActionsCreate } from 'client/utils/parser'

import { useSystemData } from 'client/features/Auth'

const _ = require('lodash')

/**
 * Displays the creation or modification form to a VM Template.
 *
 * @returns {ReactElement} VM Template form
 */
function CreateVmTemplate() {
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
      // Get current state and modified fields
      const currentState = store.getState()
      const startScript64 = rawTemplate?.extra?.CONTEXT?.START_SCRIPT_BASE64
      let modifiedFields = currentState.general?.modifiedFields

      // Get the original template
      const existingTemplate = {
        ...apiTemplateData?.TEMPLATE,
      }

      if (
        modifiedFields?.extra?.Context?.CONTEXT?.START_SCRIPT &&
        startScript64
      ) {
        modifiedFields = deepmerge(modifiedFields, {
          extra: { Context: { CONTEXT: { START_SCRIPT_BASE64: true } } },
        })

        delete modifiedFields.extra.Context.CONTEXT.START_SCRIPT
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
        isVrouter: false,
      }}
      onSubmit={onSubmit}
      fallback={<SkeletonStepsForm />}
    >
      {(config) => <DefaultFormStepper {...config} />}
    </CreateForm>
  )
}

export default CreateVmTemplate
