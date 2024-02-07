/* ------------------------------------------------------------------------- *
 * Copyright 2002-2023, OpenNebula Project, OpenNebula Systems               *
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
import { Component, useMemo, useEffect } from 'react'
import { Box, FormControl } from '@mui/material'
import { createMinMaxVmsFields } from 'client/components/Forms/ServiceTemplate/CreateForm/Steps/RoleConfig/MinMaxVms/schema'
import { FormWithSchema } from 'client/components/Forms'
import { useFieldArray, useFormContext } from 'react-hook-form'
import { STEP_ID as ROLE_DEFINITION_ID } from 'client/components/Forms/ServiceTemplate/CreateForm/Steps/Roles'

export const SECTION_ID = 'MINMAXVMS'
/**
 * @param {object} root0 - props
 * @param {string} root0.stepId - Main step ID
 * @param {number} root0.selectedRoleIndex - Active role index
 * @returns {Component} - component
 */
const MinMaxVms = ({ stepId, selectedRoleIndex }) => {
  const { control, setValue, getValues } = useFormContext()
  const cardinality = useMemo(
    () =>
      getValues(ROLE_DEFINITION_ID)?.[selectedRoleIndex]?.CARDINALITY ??
      undefined,
    [selectedRoleIndex]
  )

  const fields = createMinMaxVmsFields(
    `${stepId}.${SECTION_ID}.${selectedRoleIndex}`,
    cardinality
  )

  useFieldArray({
    name: useMemo(() => `${stepId}.${SECTION_ID}`, [stepId, selectedRoleIndex]),
    control: control,
  })

  if (fields.length === 0) {
    return null
  }

  // Set default values
  useEffect(() => {
    fields.forEach((field) => {
      const defaultValue = field.validation.default()
      setValue(field.name, defaultValue || 0)
    })
  }, [fields])

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
