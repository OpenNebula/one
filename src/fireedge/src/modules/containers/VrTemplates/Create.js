/* ------------------------------------------------------------------------- *
 * Copyright 2002-2026, OpenNebula Project, OpenNebula Systems               *
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
  VrTemplate,
} from '@ResourcesModule'

import {
  deepmerge,
  filterTemplateData,
  isDevelopment,
  jsonToXml,
  transformActionsCreate,
} from '@UtilsModule'

import {
  useSystemData,
  useGeneralApi,
  VmTemplateAPI,
  VmGroupAPI,
  HostAPI,
  ImageAPI,
  SystemAPI,
  UserAPI,
  DatastoreAPI,
} from '@FeaturesModule'

import { PATH, STEP_MAP, T, TAB_FORM_MAP } from '@ConstantsModule'

// Should match ResourcesModules' VmTemplate form
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

  const formattedTemplate = apiTemplateDataExtended
    ? structuredClone(apiTemplateDataExtended)
    : apiTemplateDataExtended

  if (formattedTemplate?.TEMPLATE?.FEATURES?.MIGRATE_AUTO_CONVERGE) {
    const [MIGRATE_AUTO_CONVERGE_INITIAL, MIGRATE_AUTO_CONVERGE_INCREMENT] =
      formattedTemplate.TEMPLATE.FEATURES.MIGRATE_AUTO_CONVERGE.split(',').map(
        (value) => (isNaN(value) ? value : Number(value))
      )

    formattedTemplate.TEMPLATE.FEATURES.MIGRATE_AUTO_CONVERGE_INITIAL =
      MIGRATE_AUTO_CONVERGE_INITIAL

    formattedTemplate.TEMPLATE.FEATURES.MIGRATE_AUTO_CONVERGE_INCREMENT =
      MIGRATE_AUTO_CONVERGE_INCREMENT

    delete formattedTemplate.TEMPLATE.FEATURES.MIGRATE_AUTO_CONVERGE
  }

  const onSubmit = async (rawTemplate) => {
    try {
      const currentState = store.getState()
      const osProfile = rawTemplate?.[GENERAL_ID]?.OS_PROFILE
      const startScript64 =
        rawTemplate?.[EXTRA_ID]?.CONTEXT?.START_SCRIPT_BASE64
      let modifiedFields = structuredClone(currentState.general?.modifiedFields)

      if (rawTemplate?.[EXTRA_ID]?.FEATURES?.MIGRATE_AUTO_CONVERGE_INITIAL) {
        rawTemplate[EXTRA_ID].FEATURES.MIGRATE_AUTO_CONVERGE = `${
          rawTemplate?.[EXTRA_ID]?.FEATURES?.MIGRATE_AUTO_CONVERGE_INITIAL
        }${
          rawTemplate?.[EXTRA_ID]?.FEATURES?.MIGRATE_AUTO_CONVERGE_INCREMENT
            ? `,${rawTemplate[EXTRA_ID].FEATURES.MIGRATE_AUTO_CONVERGE_INCREMENT}`
            : ''
        }`

        if (
          modifiedFields?.extra?.OsCpu?.FEATURES
            ?.MIGRATE_AUTO_CONVERGE_INITIAL ||
          modifiedFields?.extra?.OsCpu?.FEATURES
            ?.MIGRATE_AUTO_CONVERGE_INCREMENT
        ) {
          modifiedFields.extra.OsCpu.FEATURES.MIGRATE_AUTO_CONVERGE = true
          delete modifiedFields.extra.OsCpu.FEATURES
            .MIGRATE_AUTO_CONVERGE_INITIAL
          delete modifiedFields.extra.OsCpu.FEATURES
            .MIGRATE_AUTO_CONVERGE_INCREMENT
        }
      }

      rawTemplate?.[EXTRA_ID]?.FEATURES?.MIGRATE_AUTO_CONVERGE_INITIAL &&
        delete rawTemplate[EXTRA_ID].FEATURES.MIGRATE_AUTO_CONVERGE_INITIAL
      rawTemplate?.[EXTRA_ID]?.FEATURES?.MIGRATE_AUTO_CONVERGE_INCREMENT &&
        delete rawTemplate[EXTRA_ID].FEATURES.MIGRATE_AUTO_CONVERGE_INCREMENT

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

      if (
        modifiedFields?.extra?.Context?.CONTEXT?.START_SCRIPT &&
        startScript64
      ) {
        modifiedFields = deepmerge(modifiedFields, {
          extra: { Context: { CONTEXT: { START_SCRIPT_BASE64: true } } },
        })

        delete modifiedFields.extra.Context.CONTEXT.START_SCRIPT
      }

      const existingTemplate = {
        ...apiTemplateData?.TEMPLATE,
      }

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

      if (rawTemplate?.[GENERAL_ID]?.MEMORYUNIT) {
        filteredTemplate.MEMORYUNIT = rawTemplate[GENERAL_ID].MEMORYUNIT
      }

      filteredTemplate.VROUTER = 'YES'
      transformActionsCreate(filteredTemplate)

      const xmlTemplate = jsonToXml(filteredTemplate, {
        excluded: ['RAW.DATA'],
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
    } catch (error) {
      isDevelopment() && console.log('VR Template error: ', error)
    }
  }

  return (
    <>
      {templateId &&
      (!apiTemplateDataExtended || !apiTemplateData || _.isEmpty(oneConfig)) ? (
        <SkeletonStepsForm />
      ) : (
        <VrTemplate.Forms.CreateForm
          initialValues={formattedTemplate}
          stepProps={{
            apiTemplateDataExtended: formattedTemplate,
            oneConfig,
            adminGroup,
            store,
            isVrouter: true,
          }}
          onSubmit={onSubmit}
          fallback={<SkeletonStepsForm />}
        >
          {(config) => <DefaultFormStepper {...config} update={!!templateId} />}
        </VrTemplate.Forms.CreateForm>
      )}
    </>
  )
}
