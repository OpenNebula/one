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
  SkeletonStepsForm,
  VmTemplate,
} from '@ResourcesModule'

import {
  jsonToXml,
  deepmerge,
  filterTemplateData,
  isDevelopment,
  transformActionsCreate,
} from '@UtilsModule'

import { STEP_MAP, T, TAB_FORM_MAP, PATH } from '@ConstantsModule'

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

  const { data: hosts = [], isSuccess: hostsLoaded } =
    HostAPI.useGetHostsAdminQuery()
  const isNic = (device) => device?.CLASS?.startsWith('02')

  const hostNics = []
    .concat(hosts)
    ?.map((host) => [].concat(host?.HOST_SHARE?.PCI_DEVICES?.PCI))
    ?.flat()
    ?.filter(isNic)

  const formatNics = []
    .concat(apiTemplateDataExtended?.TEMPLATE?.PCI)
    ?.filter(Boolean)
    ?.map((pci) => {
      if (!isNic(pci) && !pci?.SHORT_ADDRESS) return pci
      const DCV = ['DEVICE', 'CLASS', 'VENDOR']
      const origNic = hostNics?.find((nic) =>
        pci?.SHORT_ADDRESS
          ? nic?.SHORT_ADDRESS === pci?.SHORT_ADDRESS
          : DCV?.every((k) => nic?.[k] === pci?.[k])
      )

      const shortAddr =
        pci?.SHORT_ADDRESS ?? `${origNic?.BUS}:${origNic?.SLOT}.x`

      return {
        ...pci,
        PCI_ADDRESS: `${DCV?.map((k) => origNic?.[k])?.join(':')}@${shortAddr}`,
        PCI_SELECTION_MODE: pci?.SHORT_ADDRESS ? 'manual' : 'automatic',
        PCI_TYPE:
          origNic?.SRIOV?.toLowerCase?.() === 'no'
            ? 'pf'
            : origNic?.SRIOV ?? 'emulated',
      }
    })
    ?.filter(Boolean)

  const formattedTemplate = formatNics?.length
    ? {
        ...structuredClone(apiTemplateDataExtended),
        TEMPLATE: {
          ...structuredClone(apiTemplateDataExtended?.TEMPLATE),
          PCI: formatNics,
        },
      }
    : apiTemplateDataExtended
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
      // Get current state and modified fields
      const currentState = store.getState()
      const osProfile = rawTemplate?.general?.OS_PROFILE
      const startScript64 = rawTemplate?.extra?.CONTEXT?.START_SCRIPT_BASE64
      let modifiedFields = structuredClone(currentState.general?.modifiedFields)

      if (rawTemplate?.extra?.FEATURES?.MIGRATE_AUTO_CONVERGE_INITIAL) {
        rawTemplate.extra.FEATURES.MIGRATE_AUTO_CONVERGE = `${
          rawTemplate?.extra?.FEATURES?.MIGRATE_AUTO_CONVERGE_INITIAL
        }${
          rawTemplate?.extra?.FEATURES?.MIGRATE_AUTO_CONVERGE_INCREMENT
            ? `,${rawTemplate.extra.FEATURES.MIGRATE_AUTO_CONVERGE_INCREMENT}`
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

      rawTemplate?.extra?.FEATURES?.MIGRATE_AUTO_CONVERGE_INITIAL &&
        delete rawTemplate.extra.FEATURES.MIGRATE_AUTO_CONVERGE_INITIAL
      rawTemplate?.extra?.FEATURES?.MIGRATE_AUTO_CONVERGE_INCREMENT &&
        delete rawTemplate.extra.FEATURES.MIGRATE_AUTO_CONVERGE_INCREMENT

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

      if (
        modifiedFields?.extra?.Context?.CONTEXT?.START_SCRIPT &&
        startScript64
      ) {
        modifiedFields = deepmerge(modifiedFields, {
          extra: { Context: { CONTEXT: { START_SCRIPT_BASE64: true } } },
        })

        delete modifiedFields.extra.Context.CONTEXT.START_SCRIPT
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
    <>
      {templateId &&
      (!apiTemplateDataExtended ||
        !apiTemplateData ||
        _.isEmpty(oneConfig) ||
        !hostsLoaded) ? (
        <SkeletonStepsForm />
      ) : (
        <VmTemplate.Forms.CreateForm
          initialValues={formattedTemplate}
          stepProps={{
            formattedTemplate,
            oneConfig,
            adminGroup,
            store,
            isVrouter: false,
          }}
          onSubmit={onSubmit}
          fallback={<SkeletonStepsForm />}
        >
          {(config) => <DefaultFormStepper {...config} update={!!templateId} />}
        </VmTemplate.Forms.CreateForm>
      )}
    </>
  )
}
