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
import PropTypes from 'prop-types'
import { Component, useMemo } from 'react'
import { Box, FormControl } from '@mui/material'
import { createMinMaxVmsFields } from 'client/components/Forms/ServiceTemplate/CreateForm/Steps/RoleConfig/MinMaxVms/schema'
import { FormWithSchema } from 'client/components/Forms'
import { useFieldArray, useFormContext } from 'react-hook-form'

export const SECTION_ID = 'MINMAXVMS'

/**
 * @param {object} root0 - props
 * @param {string} root0.stepId - Main step ID
 * @param {number} root0.selectedRoleIndex - Active role index
 * @returns {Component} - component
 */
const MinMaxVms = ({ stepId, selectedRoleIndex }) => {
  const { control } = useFormContext()

  const fields = createMinMaxVmsFields(
    `${stepId}.${SECTION_ID}.${selectedRoleIndex}`
  )

  useFieldArray({
    name: useMemo(() => `${stepId}.${SECTION_ID}`, [stepId, selectedRoleIndex]),
    control: control,
  })

  if (fields.length === 0) {
    return null
  }

  return (
    <Box>
      <FormControl
        component="fieldset"
        sx={{ width: '100%', gridColumn: '1 / -1' }}
      >
        <FormWithSchema fields={fields} rootProps={{ sx: { m: 0 } }} />
      </FormControl>
    </Box>
  )
}

MinMaxVms.propTypes = {
  stepId: PropTypes.string,
  selectedRoleIndex: PropTypes.number,
}

export default MinMaxVms
