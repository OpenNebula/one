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
import { useCallback } from 'react'
import { T } from '@ConstantsModule'
import { cleanEmpty, cloneObject, set } from '@UtilsModule'
import { object } from 'yup'
import { useFormContext, useWatch } from 'react-hook-form'
import { Box } from '@mui/material'
import { unset } from 'lodash'
import { AttributesPanel, AlertNotification } from '@ComponentsV2Module'

export const STEP_ID = 'oneform-tags'

const getAttributePayload = (attribute, newValue) =>
  typeof attribute === 'string'
    ? { key: attribute, value: newValue }
    : attribute ?? {}

const Content = () => {
  const { setValue } = useFormContext()
  const oneformTags = useWatch({ name: STEP_ID })

  const handleSetOneformTags = useCallback(
    (newOneformTags) => {
      setValue(STEP_ID, cleanEmpty(newOneformTags), {
        shouldDirty: true,
        shouldValidate: true,
      })
    },
    [setValue]
  )

  const handleChangeAttribute = useCallback(
    (attribute, newValue) => {
      const { key, path, value } = getAttributePayload(attribute, newValue)
      const attributePath = path ?? key

      if (!attributePath) return

      const newOneformTags = cloneObject(oneformTags)

      set(newOneformTags, attributePath, value)
      handleSetOneformTags(newOneformTags)
    },
    [handleSetOneformTags, oneformTags]
  )

  const handleDeleteAttribute = useCallback(
    (_, attribute) => {
      const attributePath = attribute?.path ?? attribute?.key

      if (!attributePath) return

      const newOneformTags = cloneObject(oneformTags)

      unset(newOneformTags, attributePath)
      handleSetOneformTags(newOneformTags)
    },
    [handleSetOneformTags, oneformTags]
  )

  return (
    <Box display="grid" gap="1em">
      <AlertNotification
        type="primary"
        status="information"
        description={T['oneformtags.info']}
        isDismissible={false}
        style={{
          gridColumn: '1 / -1',
          marginTop: '1em',
          width: '100%',
          boxSizing: 'border-box',
        }}
      />
      <AttributesPanel
        title={T.OneformTags}
        actions={{ add: true, copy: true, delete: true, edit: true }}
        attributes={oneformTags}
        handleAdd={handleChangeAttribute}
        handleEdit={handleChangeAttribute}
        handleDelete={handleDeleteAttribute}
        isFullHeight={false}
      />
    </Box>
  )
}

/**
 * OneForm Tags for Provision.
 *
 * @returns {object} Oneform Tags step
 */
const OneformTags = () => ({
  id: STEP_ID,
  label: T.OneformTags,
  resolver: object(),
  optionsValidate: { abortEarly: false },
  content: () => Content(),
})

export default OneformTags
