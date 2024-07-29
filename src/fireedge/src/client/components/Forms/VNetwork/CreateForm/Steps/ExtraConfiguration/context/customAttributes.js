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
import { ReactElement, useCallback, useMemo } from 'react'
import { useFormContext, useWatch } from 'react-hook-form'
import { reach } from 'yup'

import { getUnknownVars } from 'client/components/Forms/VNetwork/CreateForm/Steps'
import { STEP_ID as EXTRA_ID } from 'client/components/Forms/VNetwork/CreateForm/Steps/ExtraConfiguration'
import { useGeneralApi } from 'client/features/General'

import { Legend } from 'client/components/Forms'
import { AttributePanel } from 'client/components/Tabs/Common'
import { T } from 'client/constants'

/**
 * Renders the context attributes to Virtual Network form.
 *
 * @returns {ReactElement} - Context attributes section
 */
const ContextAttrsSection = () => {
  const { enqueueError } = useGeneralApi()
  const { setValue, getResolver } = useFormContext()
  const extraStepVars = useWatch({ name: EXTRA_ID }) || {}

  const unknownVars = useMemo(
    () => getUnknownVars(extraStepVars, getResolver()),
    [extraStepVars]
  )

  const handleChangeAttribute = useCallback(
    (path, newValue) => {
      try {
        const extraSchema = reach(getResolver(), EXTRA_ID)

        // retrieve the schema for the given path
        reach(extraSchema, path)
        enqueueError(T.InvalidAttribute)
      } catch (e) {
        // When the path is not found, it means that
        // the attribute is correct and we can set it
        setValue(`${EXTRA_ID}.${path}`, newValue)
      }
    },
    [setValue]
  )

  return (
    <AttributePanel
      collapse
      title={
        <Legend
          disableGutters
          data-cy={'custom-attributes'}
          title={T.CustomAttributes}
        />
      }
      allActionsEnabled
      handleAdd={handleChangeAttribute}
      handleEdit={handleChangeAttribute}
      handleDelete={handleChangeAttribute}
      attributes={unknownVars}
      filtersSpecialAttributes={false}
    />
  )
}

export default ContextAttrsSection
