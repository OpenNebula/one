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
import { useCallback, useMemo } from 'react'
import PropTypes from 'prop-types'
import { T } from '@ConstantsModule'
import { cleanEmpty, cloneObject, set } from '@UtilsModule'
import { object } from 'yup'
import { useFormContext, useWatch } from 'react-hook-form'
import { useTheme, Box, Alert } from '@mui/material'
import { css } from '@emotion/css'
import { AttributePanel } from '@modules/components/Tabs/Common'
import { Tr } from '@modules/components/HOC'

export const STEP_ID = 'oneform-tags'

const Content = () => {
  const theme = useTheme()
  const { setValue } = useFormContext()
  const oneformTags = useWatch({ name: STEP_ID })

  const handleChangeAttribute = useCallback(
    (path, newValue) => {
      const newOneformTags = cloneObject(oneformTags)

      set(newOneformTags, path, newValue)
      setValue(STEP_ID, cleanEmpty(newOneformTags))
    },
    [oneformTags]
  )

  // Style for info message
  const useStyles = ({ palette }) => ({
    groupInfo: css({
      '&': {
        gridColumn: '1 / -1',
        marginTop: '1em',
        backgroundColor: palette.background.paper,
      },
    }),
  })

  const classes = useMemo(() => useStyles(theme), [theme])

  return (
    <Box display="grid" gap="1em">
      <Alert severity="info" variant="outlined" className={classes.groupInfo}>
        {Tr(T['oneformtags.info'])}
      </Alert>
      <AttributePanel
        allActionsEnabled
        handleAdd={handleChangeAttribute}
        handleEdit={handleChangeAttribute}
        handleDelete={handleChangeAttribute}
        attributes={oneformTags}
        filtersSpecialAttributes={false}
      />
    </Box>
  )
}

Content.propTypes = {
  isUpdate: PropTypes.bool,
}

/**
 * OneForm Tags for Provision.
 *
 * @returns {object} Oneform Tags step
 */
// IDEA: check the src/modules/components/Forms/VmTemplate/CreateForm/Steps/CustomVariables.js for inspiration
const OneformTags = () => ({
  id: STEP_ID,
  label: T.OneformTags,
  resolver: object(),
  optionsValidate: { abortEarly: false },
  content: () => Content(),
})

export default OneformTags
