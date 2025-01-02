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
import { useMemo, useEffect, useRef } from 'react'
import { useTheme } from '@mui/material'
import PropTypes from 'prop-types'
import { useWatch, useFormContext } from 'react-hook-form'
import { useViews, useGeneralApi, SystemAPI } from '@FeaturesModule'
import FormWithSchema from '@modules/components/Forms/FormWithSchema'
import useStyles from '@modules/components/Forms/VmTemplate/CreateForm/Steps/General/styles'

import {
  SCHEMA,
  SECTIONS,
} from '@modules/components/Forms/VmTemplate/CreateForm/Steps/General/schema'
import { getActionsAvailable as getSectionsAvailable } from '@ModelsModule'
import {
  generateKey,
  deepmerge,
  flattenObjectByKeys,
  sentenceCase,
  isDevelopment,
} from '@UtilsModule'
import {
  T,
  RESOURCE_NAMES,
  VmTemplate,
  STEP_MAP,
  TAB_FORM_MAP,
} from '@ConstantsModule'
import { set } from 'lodash'
import { Tr } from '@modules/components/HOC'

let generalFeatures

export const STEP_ID = 'general'

const Content = ({
  isUpdate,
  oneConfig,
  adminGroup,
  setFormData,
  isVrouter,
  lastOsProfile,
}) => {
  const theme = useTheme()
  const [fetchProfile] = SystemAPI.useLazyGetOsProfilesQuery()
  const classes = useMemo(() => useStyles(theme), [theme])
  const { view, getResourceView } = useViews()
  const hypervisor = useWatch({ name: `${STEP_ID}.HYPERVISOR` })

  const { enqueueSuccess, setFieldPath, useResetLoadOsProfile } =
    useGeneralApi()

  const { getValues, setValue, watch, reset } = useFormContext()
  const osProfile = watch('general.OS_PROFILE')
  const currentProfile = useRef(osProfile)

  // Prefill current step based on profile
  const profileSuccessMsg =
    Tr(T.Loaded) + ' ' + Tr(T.Profile.toLowerCase()) + ': '

  useEffect(async () => {
    if (
      currentProfile.current !== osProfile &&
      osProfile &&
      osProfile !== '-'
    ) {
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

        useResetLoadOsProfile()
        currentProfile.current = osProfile
        enqueueSuccess(profileSuccessMsg + sentenceCase(osProfile))
      } catch (error) {
        isDevelopment() && console.error('Failed to load profile: ', error)
      }
    }
  }, [osProfile])

  useEffect(() => {
    setFieldPath(`general`)
  }, [])

  // Create watch for vcpu
  const vcpuWatch = useWatch({
    name: 'general.VCPU',
    defaultValue: getValues('general.VCPU'),
  })

  // Synchronize general.VCPU and extra.VCPU (they're the same field but we need to create two to validate in both steps the vcpu)
  useEffect(() => {
    // Set value in formContext
    setValue('extra.VCPU', vcpuWatch)

    // Set value in formData (extra.VCPU is in another step, so formData won't be updated if we don't force to update) -> components/Forms/VmTemplate/CreateForm/Steps/ExtraConfiguration/numa/index.js
    setFormData((prevState) => {
      set(prevState, 'extra.VCPU', vcpuWatch)

      return prevState
    })
  }, [vcpuWatch])

  const sections = useMemo(() => {
    const resource = RESOURCE_NAMES.VM_TEMPLATE
    const { features, dialogs } = getResourceView(resource)
    const dialog = dialogs?.create_dialog
    const sectionsAvailable = getSectionsAvailable(dialog, hypervisor)

    generalFeatures = features

    return (
      SECTIONS(
        hypervisor,
        isUpdate,
        features,
        oneConfig,
        adminGroup,
        isVrouter,
        lastOsProfile
      )
        .filter(
          ({ id, required }) => required || sectionsAvailable.includes(id)
        )
        // unique keys to avoid duplicates
        .map((section) => ({ key: generateKey(), ...section }))
    )
  }, [view, hypervisor])

  return (
    <div className={classes.root}>
      {sections.map(({ key, id, ...section }) => (
        <FormWithSchema
          key={key}
          id={STEP_ID}
          cy={`${STEP_ID}-${id}`}
          rootProps={{ className: classes[id] }}
          saveState={true}
          {...section}
        />
      ))}
    </div>
  )
}

/**
 * General configuration about VM Template.
 *
 * @param {VmTemplate} vmTemplate - VM Template
 * @returns {object} General configuration step
 */
const General = ({
  apiTemplateDataExtended: vmTemplate,
  oneConfig,
  adminGroup,
  isVrouter = false,
}) => {
  const isUpdate = !!vmTemplate?.NAME
  const initialHypervisor = vmTemplate?.TEMPLATE?.HYPERVISOR
  const lastOsProfile = vmTemplate?.TEMPLATE?.OS_PROFILE || ''

  return {
    id: STEP_ID,
    label: T.General,
    resolver: (formData) => {
      const hypervisor = formData?.[STEP_ID]?.HYPERVISOR ?? initialHypervisor

      return SCHEMA(hypervisor, isUpdate, generalFeatures)
    },
    optionsValidate: { abortEarly: false },
    content: (props) =>
      Content({
        ...props,
        isUpdate,
        oneConfig,
        adminGroup,
        isVrouter,
        lastOsProfile,
      }),
  }
}

Content.propTypes = {
  isUpdate: PropTypes.bool,
  oneConfig: PropTypes.object,
  adminGroup: PropTypes.bool,
  setFormData: PropTypes.func,
  isVrouter: PropTypes.bool,
  lastOsProfile: PropTypes.string,
}

export default General
