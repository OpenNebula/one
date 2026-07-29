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
import { STEP_ID as EXTRA_ID } from '@modules/resources/resources/VnTemplate/Forms/CreateForm/Steps/Configuration/constants'
import { FIELDS } from '@modules/resources/resources/VnTemplate/Forms/CreateForm/Steps/Configuration/context/schema'
import { Folder as ContextIcon } from 'iconoir-react'
import { unset } from 'lodash'
import { Box } from '@mui/material'
import PropTypes from 'prop-types'
import { useCallback, useMemo } from 'react'
import { useFormContext, useWatch } from 'react-hook-form'
import { reach } from 'yup'

import { AttributesPanel, FormWithSchema } from '@ComponentsV2Module'
import { useGeneralApi } from '@FeaturesModule'
import { getUnknownVars } from '@modules/resources/resources/VnTemplate/Forms/CreateForm/Steps/Configuration/utils'
import { T } from '@ConstantsModule'
import { cleanEmpty, cloneObject, set } from '@UtilsModule'

/**
 * Renders the context attributes to Virtual Network form.
 *
 * @returns {object} - Context attributes section
 */
const CustomAttributes = () => {
  const { enqueueError } = useGeneralApi()
  const { setValue, getResolver } = useFormContext()
  const extraStepVars = useWatch({ name: EXTRA_ID }) || {}

  const unknownVars = useMemo(
    () => getUnknownVars(extraStepVars, getResolver()),
    [extraStepVars]
  )

  const handleChangeAttribute = useCallback(
    ({ key, path, value } = {}) => {
      const attributePath = path ?? key
      if (!attributePath) return

      try {
        const extraSchema = reach(getResolver(), EXTRA_ID)

        // retrieve the schema for the given path
        reach(extraSchema, attributePath)
        enqueueError(T.InvalidAttribute)
      } catch (e) {
        // When the path is not found, it means that
        // the attribute is correct and we can set it
        const nextExtraVars = cloneObject(extraStepVars)
        set(nextExtraVars, attributePath, value)
        setValue(EXTRA_ID, cleanEmpty(nextExtraVars))
      }
    },
    [extraStepVars, setValue]
  )

  const handleDeleteAttribute = useCallback(
    (index, attribute) => {
      const attributePath =
        attribute?.path ?? attribute?.key ?? Object.keys(unknownVars)?.[index]

      if (!attributePath) return

      const nextExtraVars = cloneObject(extraStepVars)
      unset(nextExtraVars, attributePath)
      setValue(EXTRA_ID, cleanEmpty(nextExtraVars))
    },
    [extraStepVars, setValue, unknownVars]
  )

  return (
    <Box sx={{ pt: 3 }}>
      <AttributesPanel
        title={T.CustomAttributes}
        actions={{ add: true, edit: true, delete: true, copy: true }}
        attributes={unknownVars}
        handleAdd={handleChangeAttribute}
        handleEdit={handleChangeAttribute}
        handleDelete={handleDeleteAttribute}
        isFullHeight={false}
      />
    </Box>
  )
}

const ContextContent = ({ oneConfig, adminGroup }) => (
  <>
    <FormWithSchema
      id={EXTRA_ID}
      cy="context"
      fields={FIELDS(oneConfig, adminGroup)}
    />
    <CustomAttributes />
  </>
)

ContextContent.propTypes = {
  oneConfig: PropTypes.object,
  adminGroup: PropTypes.bool,
}

/** @type {object} */
const TAB = {
  id: 'context',
  name: T.Context,
  icon: ContextIcon,
  Content: ContextContent,
  getError: (error) => FIELDS().some(({ name }) => error?.[name]),
}

export default TAB
