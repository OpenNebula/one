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
import { useCallback } from 'react'
import { object } from 'yup'
import { useFormContext, useWatch } from 'react-hook-form'
import { Box } from '@mui/material'

import { AttributePanel } from 'client/components/Tabs/Common'
import { cleanEmpty, cloneObject, set } from 'client/utils'
import { T } from 'client/constants'

export const STEP_ID = 'custom-attributes'

const Content = () => {
  const { setValue } = useFormContext()
  const customVars = useWatch({ name: STEP_ID, defaultValue: {} })

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

/**
 * Custom variables about VM Template.
 *
 * @returns {object} Custom configuration step
 */
const CustomAttributes = () => ({
  id: STEP_ID,
  label: T.CustomAttributes,
  resolver: object(),
  optionsValidate: { abortEarly: false },
  content: Content,
})

export default CustomAttributes
