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
// eslint-disable-next-line no-unused-vars
import { ReactElement, useMemo, useEffect } from 'react'
import { useSelector } from 'react-redux'
import PropTypes from 'prop-types'
// eslint-disable-next-line no-unused-vars
import { useFormContext, FieldErrors } from 'react-hook-form'
import { useViews, SystemAPI, useGeneralApi } from '@FeaturesModule'
import { Translate } from '@modules/components/HOC'
import { BaseTab as Tabs } from '@modules/components/Tabs'
import { deepmerge, flattenObjectByKeys } from '@UtilsModule'
import Storage from '@modules/components/Forms/VmTemplate/CreateForm/Steps/ExtraConfiguration/storage'
import Networking from '@modules/components/Forms/VmTemplate/CreateForm/Steps/ExtraConfiguration/networking'
import Placement from '@modules/components/Forms/VmTemplate/CreateForm/Steps/ExtraConfiguration/placement'
import ScheduleAction from '@modules/components/Forms/VmTemplate/CreateForm/Steps/ExtraConfiguration/scheduleAction'
import Booting, {
  BootOrder,
} from '@modules/components/Forms/VmTemplate/CreateForm/Steps/ExtraConfiguration/booting'
import Context from '@modules/components/Forms/VmTemplate/CreateForm/Steps/ExtraConfiguration/context'
import Pci from '@modules/components/Forms/VmTemplate/CreateForm/Steps/ExtraConfiguration/pci'
import InputOutput from '@modules/components/Forms/VmTemplate/CreateForm/Steps/ExtraConfiguration/inputOutput'
import Numa from '@modules/components/Forms/VmTemplate/CreateForm/Steps/ExtraConfiguration/numa'
import Backup from '@modules/components/Forms/VmTemplate/CreateForm/Steps/ExtraConfiguration/backup'

import {
  STEP_MAP,
  T,
  RESOURCE_NAMES,
  VmTemplate,
  TAB_FORM_MAP,
} from '@ConstantsModule'
import { STEP_ID as GENERAL_ID } from '@modules/components/Forms/VmTemplate/CreateForm/Steps/General'
import { SCHEMA } from '@modules/components/Forms/VmTemplate/CreateForm/Steps/ExtraConfiguration/schema'
import { getActionsAvailable as getSectionsAvailable } from '@ModelsModule'

const VROUTER_DISABLED_TABS = ['network', 'pci']

/**
 * @typedef {object} TabType
 * @property {string} id - Id will be to use in view yaml to hide/display the tab
 * @property {string} name - Label of tab
 * @property {ReactElement} Content - Content tab
 * @property {object} [icon] - Icon of tab
 * @property {function(FieldErrors):boolean} [getError] - Returns `true` if the tab contains an error in form
 */

export const STEP_ID = 'extra'

/** @type {TabType[]} */
export const TABS = [
  Storage,
  Networking,
  Booting,
  Pci,
  InputOutput,
  Context,
  ScheduleAction,
  Placement,
  Numa,
  Backup,
]

const Content = ({
  data,
  setFormData,
  oneConfig,
  adminGroup,
  isUpdate,
  isVrouter,
}) => {
  const {
    watch,
    formState: { errors },
    control,
    getValues,
    reset,
  } = useFormContext()
  const { useLoadOsProfile } = useGeneralApi()
  const [fetchProfile] = SystemAPI.useLazyGetOsProfilesQuery()
  const { view, getResourceView } = useViews()
  const osProfile = watch('general.OS_PROFILE')
  const profileIsLoaded =
    useSelector((state) => state?.general?.loadedOsProfile?.[STEP_ID]) || false

  // Prefill current step based on profile
  useEffect(async () => {
    if (!profileIsLoaded && osProfile && osProfile !== '-') {
      try {
        const { data: fetchedProfile } = await fetchProfile({ id: osProfile })
        const currentForm = getValues()
        const mappedSteps = Object.fromEntries(
          Object.entries(fetchedProfile).map(([key, value]) => [
            STEP_MAP[key] || key,
            value,
          ])
        )

        const flattenByKeys = Object.keys(TAB_FORM_MAP)
        mappedSteps.extra = flattenObjectByKeys(
          mappedSteps.extra,
          flattenByKeys
        )

        const mergedSteps = deepmerge(currentForm, mappedSteps)

        reset(mergedSteps, {
          shouldDirty: true,
          shouldTouch: true,
          keepDefaultValues: true,
        })
        useLoadOsProfile({ stepId: STEP_ID })
      } catch (error) {}
    }
  }, [osProfile, profileIsLoaded])

  const hypervisor = useMemo(() => watch(`${GENERAL_ID}.HYPERVISOR`), [])

  const sectionsAvailable = useMemo(() => {
    const resource = RESOURCE_NAMES.VM_TEMPLATE
    const dialog = getResourceView(resource)?.dialogs?.create_dialog

    return getSectionsAvailable(dialog, hypervisor)
  }, [view])

  const totalErrors = Object.keys(errors[STEP_ID] ?? {}).length

  const tabs = useMemo(
    () =>
      TABS.filter(
        ({ id }) =>
          sectionsAvailable.includes(id) &&
          (isVrouter ? !VROUTER_DISABLED_TABS.includes(id) : true)
      ).map(({ Content: TabContent, name, getError, ...section }) => ({
        ...section,
        name,
        label: <Translate word={name} />,
        renderContent: () => (
          <TabContent
            {...{
              data,
              setFormData,
              hypervisor,
              control,
              oneConfig,
              adminGroup,
              isUpdate,
              isVrouter,
            }}
          />
        ),
        error: getError?.(errors[STEP_ID]),
      })),
    [totalErrors, view, control, oneConfig, adminGroup]
  )

  return <Tabs tabs={tabs} />
}

/**
 * Optional configuration about VM Template.
 *
 * @param {VmTemplate} vmTemplate - VM Template
 * @returns {object} Optional configuration step
 */
const ExtraConfiguration = ({
  apiTemplateDataExtended: vmTemplate,
  oneConfig,
  adminGroup,
  store,
  isVrouter,
}) => {
  const initialHypervisor = vmTemplate?.TEMPLATE?.HYPERVISOR
  const isUpdate = !!vmTemplate?.NAME

  return {
    id: STEP_ID,
    label: T.AdvancedOptions,
    resolver: (formData) => {
      const hypervisor = formData?.[GENERAL_ID]?.HYPERVISOR ?? initialHypervisor

      const currentState = store.getState()
      const modifiedFields = currentState.general?.modifiedFields

      return SCHEMA(hypervisor, oneConfig, adminGroup, isUpdate, modifiedFields)
    },
    optionsValidate: { abortEarly: false },
    content: (props) =>
      Content({ ...props, oneConfig, adminGroup, isUpdate, isVrouter }),
  }
}

Content.propTypes = {
  data: PropTypes.any,
  setFormData: PropTypes.func,
  oneConfig: PropTypes.object,
  adminGroup: PropTypes.bool,
  isUpdate: PropTypes.bool,
  isVrouter: PropTypes.bool,
}

export { BootOrder }
export default ExtraConfiguration
