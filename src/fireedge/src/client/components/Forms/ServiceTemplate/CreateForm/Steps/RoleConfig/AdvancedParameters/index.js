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
import { useMemo, useEffect, Component } from 'react'
import { useFormContext } from 'react-hook-form'
import { ADVANCED_PARAMS_FIELDS } from 'client/components/Forms/ServiceTemplate/CreateForm/Steps/RoleConfig/AdvancedParameters/schema'
import { FormWithSchema } from 'client/components/Forms'
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControl,
  Box,
  Typography,
  useTheme,
} from '@mui/material'
import { T } from 'client/constants'
import { Tr } from 'client/components/HOC'

export const SECTION_ID = 'ADVANCEDPARAMS'

/**
 * @param {object} root0 - props
 * @param {string} root0.stepId - Main step ID
 * @param {object} root0.roleConfigs - Roles config
 * @param {Function} root0.onChange - Callback handler
 * @returns {Component} - component
 */
const AdvancedParametersSection = ({ stepId, roleConfigs, onChange }) => {
  const { watch, setValue } = useFormContext()
  const { palette } = useTheme()
  const fields = useMemo(() => ADVANCED_PARAMS_FIELDS, [stepId])

  useEffect(() => {
    setValue(
      `${stepId}.${SECTION_ID}.SHUTDOWNTYPE`,
      roleConfigs?.[SECTION_ID]?.[0] ?? ''
    )
  }, [roleConfigs])

  const shutdownTypeValue = watch(`${stepId}.${SECTION_ID}.SHUTDOWNTYPE`)

  useEffect(() => {
    if (shutdownTypeValue) {
      onChange('update', { [SECTION_ID]: shutdownTypeValue }, false)
    }
  }, [shutdownTypeValue])

  if (fields.length === 0) {
    return null
  }

  return (
    <FormControl
      component="fieldset"
      sx={{ width: '100%', gridColumn: '1 / -1' }}
    >
      <Accordion>
        <AccordionSummary
          aria-controls="panel-content"
          id="panel-header"
          sx={{
            backgroundColor: palette?.background?.paper,
            filter: 'brightness(90%)',
          }}
        >
          <Typography variant="body1">{Tr(T.AdvancedParams)}</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'row',
              width: '100%',
            }}
          >
            <Box component="form" sx={{ flexGrow: 1, display: 'flex' }}>
              <FormWithSchema
                id={stepId}
                cy={'extra-networking'}
                fields={fields}
                rootProps={{ sx: { m: 0 } }}
              />
            </Box>
          </Box>
        </AccordionDetails>
      </Accordion>
    </FormControl>
  )
}

AdvancedParametersSection.propTypes = {
  selectedRoleIndex: PropTypes.number,
  stepId: PropTypes.string,
  roleConfigs: PropTypes.object,
  onChange: PropTypes.func,
}

export default AdvancedParametersSection
