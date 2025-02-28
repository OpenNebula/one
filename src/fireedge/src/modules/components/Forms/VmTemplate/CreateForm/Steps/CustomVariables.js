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
import { useCallback, useEffect } from 'react'
import { useSelector } from 'react-redux'
import PropTypes from 'prop-types'
import { SystemAPI, useGeneralApi } from '@FeaturesModule'
import { STEP_MAP, T, TAB_FORM_MAP } from '@ConstantsModule'
import {
  deepmerge,
  cleanEmpty,
  cloneObject,
  set,
  flattenObjectByKeys,
} from '@UtilsModule'
import { object } from 'yup'
import { useFormContext, useWatch } from 'react-hook-form'
import { Box } from '@mui/material'
import { AttributePanel } from '@modules/components/Tabs/Common'

export const STEP_ID = 'custom-variables'

const Content = ({ isUpdate }) => {
  const { setValue, reset, getValues, watch } = useFormContext()
  const { useLoadOsProfile } = useGeneralApi()
  const customVars = useWatch({ name: STEP_ID })

  const [fetchProfile] = SystemAPI.useLazyGetOsProfilesQuery()
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
  }, [osProfile])

  const handleChangeAttribute = useCallback(
    (path, newValue) => {
      const newCustomVars = cloneObject(customVars)

      set(newCustomVars, path, newValue)
      setValue(STEP_ID, cleanEmpty(newCustomVars))
    },
    [customVars]
  )

  return (
    <Box display="grid" gap="1em">
      <AttributePanel
        allActionsEnabled
        handleAdd={handleChangeAttribute}
        handleEdit={handleChangeAttribute}
        handleDelete={handleChangeAttribute}
        attributes={customVars}
        filtersSpecialAttributes={false}
      />
    </Box>
  )
}

Content.propTypes = {
  isUpdate: PropTypes.bool,
}

/**
 * Custom variables about VM Template.
 *
 * @param {object} params - Props
 * @param {object} params.apiTemplateDataExtended - VM Template
 * @returns {object} Custom configuration step
 */
const CustomVariables = ({ apiTemplateDataExtended: vmTemplate }) => {
  const isUpdate = !!vmTemplate?.NAME

  return {
    id: STEP_ID,
    label: T.CustomVariables,
    resolver: object(),
    optionsValidate: { abortEarly: false },
    content: (props) => Content({ ...props, isUpdate }),
  }
}

export default CustomVariables
