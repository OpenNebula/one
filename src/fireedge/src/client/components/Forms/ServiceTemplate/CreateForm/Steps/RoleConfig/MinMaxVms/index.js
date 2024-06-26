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
import { useFieldArray, useFormContext, useWatch } from 'react-hook-form'
import { STEP_ID as ROLE_DEFINITION_ID } from 'client/components/Forms/ServiceTemplate/CreateForm/Steps/Roles'
import { STEP_ID as ROLE_CONFIG_ID } from 'client/components/Forms/ServiceTemplate/CreateForm/Steps/RoleConfig'

export const SECTION_ID = 'MINMAXVMS'
/**
 * @param {object} root0 - props
 * @param {string} root0.stepId - Main step ID
 * @param {number} root0.selectedRoleIndex - Active role index
 * @returns {Component} - component
 */
const MinMaxVms = ({ stepId, selectedRoleIndex }) => {
  const { control, setValue, getValues, setError, clearErrors } =
    useFormContext()

  const watchedActiveField = useWatch({
    control,
    name: `${stepId}.${SECTION_ID}.${selectedRoleIndex}`,
  })

  const cardinality = useMemo(() => {
    const baseCardinality =
      getValues(ROLE_DEFINITION_ID)?.[selectedRoleIndex]?.CARDINALITY
    const minVms =
      getValues(ROLE_CONFIG_ID)?.[SECTION_ID]?.[selectedRoleIndex]?.min_vms

    const maxVms =
      getValues(ROLE_CONFIG_ID)?.[SECTION_ID]?.[selectedRoleIndex]?.max_vms

    return {
      min_vms: minVms,
      max_vms: maxVms,
      default: baseCardinality,
    }
  }, [selectedRoleIndex])

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

  useEffect(() => {
    const validateFields = (activeFields) => {
      const { min_vms: minVms, max_vms: maxVms } = activeFields
      if (maxVms < minVms) {
        ;['min_vms', 'max_vms'].forEach((field) => {
          setError(`${stepId}.${SECTION_ID}.${selectedRoleIndex}.${field}`, {
            type: 'manual',
            message: `Min/Max validation error`,
          })
        })
      } else if (maxVms >= minVms) {
        ;['min_vms', 'max_vms'].forEach((field) => {
          clearErrors(`${stepId}.${SECTION_ID}.${selectedRoleIndex}.${field}`)
        })
      }
    }

    watchedActiveField && validateFields(watchedActiveField)
  }, [watchedActiveField])

  // Set default values
  useEffect(() => {
    fields.forEach((field) => {
      setValue(
        field.name,
        cardinality?.[field?.name?.split('.')?.at(-1)] ??
          cardinality?.default ??
          0
      )
    })
  }, [cardinality])

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
