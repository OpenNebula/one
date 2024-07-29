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
import FormWithSchema from 'client/components/Forms/FormWithSchema'
import { NETWORK_TYPES } from 'client/components/Forms/ServiceTemplate/CreateForm/Steps/Extra/networking/schema'
import { T } from 'client/constants'
import { Box, Grid, TextField } from '@mui/material'
import { useState, useMemo, useEffect } from 'react'
import { createNetworkFields, createNetworkSchema } from './schema'
import { useFieldArray, useFormContext } from 'react-hook-form'

export const STEP_ID = 'network'
export const FIELD_ARRAY = 'NETWORKS'

const Content = (props) => {
  const { control, setValue } = useFormContext()

  const templatePath = props?.dataTemplate?.TEMPLATE?.BODY?.networks
  const networkInfo = Object.entries(templatePath || {}).reduce(
    (acc, [key, value]) => {
      const extraPart = value.split('::')?.[1]
      acc[key] = extraPart

      return acc
    },
    {}
  )

  const [tableIndex, setTableIndex] = useState(0)

  const [tableType, setTableType] = useState(
    Object.keys(NETWORK_TYPES)?.[0] ?? ''
  )

  const fields = useMemo(
    () =>
      createNetworkFields(`${STEP_ID}.${FIELD_ARRAY}.${tableIndex}`, tableType),
    [tableIndex, tableType, STEP_ID]
  )

  useFieldArray({
    name: useMemo(() => `${STEP_ID}.${FIELD_ARRAY}`, [STEP_ID, tableIndex]),
    control: control,
  })

  useEffect(() => {
    setValue(`${STEP_ID}.${FIELD_ARRAY}.${tableIndex}.tableType`, tableType)
  }, [tableType, tableIndex, STEP_ID])

  if (fields?.length === 0) {
    return null
  }

  return (
    <Box>
      <Grid container spacing={2}>
        <Grid item xs={6}>
          <TextField
            select
            label="Network ID"
            onChange={(e) => {
              setTableIndex(e.target.selectedIndex)
            }}
            fullWidth
            InputProps={{
              inputProps: { 'data-cy': `select-${STEP_ID}-id` },
            }}
            variant="outlined"
          >
            {Object.keys(networkInfo).map((key) => (
              <option key={key} value={key}>
                {key}
              </option>
            ))}
          </TextField>
        </Grid>

        <Grid item xs={6}>
          <TextField
            select
            label="Network Type"
            value={tableType}
            onChange={(e) => setTableType(e.target.value)}
            fullWidth
            InputProps={{
              inputProps: { 'data-cy': `select-${STEP_ID}-type` },
            }}
            variant="outlined"
          >
            {Object.entries(NETWORK_TYPES).map(([key, value]) => (
              <option key={key} value={key}>
                {value}
              </option>
            ))}
          </TextField>
        </Grid>
      </Grid>
      <FormWithSchema cy={`${STEP_ID}`} fields={fields} />
    </Box>
  )
}

Content.propTypes = {
  dataTemplate: PropTypes.object,
  isUpdate: PropTypes.bool,
}

/**
 * @param {object} template - Service Template
 * @returns {object} - Step
 */
const Network = (template) => ({
  id: STEP_ID,
  label: T.Network,
  resolver: createNetworkSchema(),
  optionsValidate: { abortEarly: false },
  defaultDisabled: {
    condition: () => {
      const disableStep = !template?.dataTemplate?.TEMPLATE?.BODY?.networks

      return disableStep
    },
  },
  content: () => Content(template),
})
Network.propTypes = {
  data: PropTypes.object,
  setFormData: PropTypes.func,
}

export default Network
