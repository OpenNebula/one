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
import { memo, useMemo, useEffect, useReducer } from 'react'
import PropTypes from 'prop-types'
import {
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Box,
  Typography,
  InputAdornment,
  IconButton,
} from '@mui/material'
import { Cancel } from 'iconoir-react'

import { useUpdateUserQuotaMutation } from 'client/features/OneApi/user'
import { useGeneralApi } from 'client/features/General'
import { T } from 'client/constants'

/**
 * QuotaControls Component
 *
 * @param {object} props - Props for the component
 * @param {Array} props.quotaTypes - Available quota types
 * @param {string} props.userId - User ID
 * @param {string} props.selectedType - Selected quota type
 * @param {Function} props.setSelectedType - Function to set selected quota type
 */
export const QuotaControls = memo(
  ({ quotaTypes, userId, selectedType, setSelectedType }) => {
    const initialState = {
      globalIds: '',
      selectedIdentifiers: [],
      globalValue: '',
      isValid: true,
      isApplyDisabled: true,
    }

    // eslint-disable-next-line no-shadow
    const reducer = (state, action) => {
      switch (action.type) {
        case 'SET_GLOBAL_IDS':
          return { ...state, globalIds: action.payload }
        case 'SET_SELECTED_IDENTIFIERS':
          return { ...state, selectedIdentifiers: action.payload }
        case 'SET_GLOBAL_VALUE':
          return { ...state, globalValue: action.payload }
        case 'SET_IS_VALID':
          return { ...state, isValid: action.payload }
        case 'SET_IS_APPLY_DISABLED':
          return { ...state, isApplyDisabled: action.payload }
        default:
          return state
      }
    }

    const [state, dispatch] = useReducer(reducer, initialState)
    const { enqueueError, enqueueSuccess } = useGeneralApi()
    const [updateUserQuota] = useUpdateUserQuotaMutation()

    useEffect(() => {
      dispatch({ type: 'SET_SELECTED_IDENTIFIERS', payload: [] })
    }, [selectedType])

    useEffect(() => {
      const isValueNumeric =
        !isNaN(state.globalValue) && state.globalValue !== ''
      const isApplyValid =
        state.isValid &&
        selectedType &&
        state.selectedIdentifiers.length > 0 &&
        isValueNumeric
      dispatch({ type: 'SET_IS_APPLY_DISABLED', payload: !isApplyValid })
    }, [
      state.isValid,
      selectedType,
      state.selectedIdentifiers,
      state.globalValue,
    ])

    const quotaIdentifiers = useMemo(
      () => ({
        VM: [
          { id: 'VMS', displayName: 'Virtual Machines' },
          { id: 'RUNNING_VMS', displayName: 'Running VMs' },
          { id: 'MEMORY', displayName: 'Memory' },
          { id: 'RUNNING_MEMORY', displayName: 'Running Memory' },
          { id: 'CPU', displayName: 'CPU' },
          { id: 'RUNNING_CPU', displayName: 'Running CPU' },
          { id: 'SYSTEM_DISK_SIZE', displayName: 'System Disk Size' },
        ],
        DATASTORE: [
          { id: 'SIZE', displayName: 'Size' },
          { id: 'IMAGES', displayName: 'Images' },
        ],
        NETWORK: [{ id: 'LEASES', displayName: 'Leases' }],
        IMAGE: [{ id: 'RVMS', displayName: 'Running VMs' }],
      }),
      []
    )

    const validateResourceIds = (value) => {
      const regex = /^(\d+)(,\d+)*$/
      const valid = regex.test(value) || value === ''
      dispatch({ type: 'SET_IS_VALID', payload: valid })
    }

    const handleApplyGlobalQuotas = () => {
      const idsArray = state.globalIds.split(',').map((id) => id.trim())

      const quota = {}
      state.selectedIdentifiers.forEach((identifier) => {
        quota[identifier] = state.globalValue
      })

      state.isValid &&
        idsArray.forEach(async (resourceId) => {
          const xmlData = quotasToXml(selectedType, resourceId, quota)
          let result
          try {
            result = await updateUserQuota({ id: userId, template: xmlData })
          } catch (error) {
            // result = { error: error.message }
          }

          if (result && result.error) {
            enqueueError(`Error updating quota for ID ${resourceId}`) // ${result.error}, currently excluded since message is globally transmitted
          } else {
            enqueueSuccess(`Quota for ID ${resourceId} updated successfully!`)
          }
        })
    }

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Grid container spacing={2} direction="column" sx={{ flex: 1 }}>
          <Grid item>
            <FormControl
              fullWidth
              variant="outlined"
              data-cy="qc-type-selector"
            >
              <InputLabel>Type</InputLabel>
              <Select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                label="Type"
                inputProps={{ 'data-cy': 'qc-type-selector-input' }}
              >
                {quotaTypes.map((type) => (
                  <MenuItem
                    key={type.type}
                    value={type.type}
                    data-cy={`qc-type-selector-${type.type.toLowerCase()}`}
                  >
                    {type.title}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item>
            <TextField
              label="Resource IDs (comma-separated)"
              value={state.globalIds}
              onChange={(e) => {
                const value = e.target.value
                dispatch({ type: 'SET_GLOBAL_IDS', payload: value })
                validateResourceIds(value)
              }}
              variant="outlined"
              fullWidth
              error={!state.isValid}
              helperText={
                !state.isValid &&
                'Invalid format. Please enter a single ID or comma-separated IDs.'
              }
              InputProps={{
                inputProps: {
                  style: { padding: '16px' },
                  'data-cy': 'qc-id-input',
                },
                endAdornment: state.globalIds && (
                  <InputAdornment position="end">
                    <IconButton
                      edge="end"
                      onClick={() =>
                        dispatch({ type: 'SET_GLOBAL_IDS', payload: '' })
                      }
                      sx={{
                        marginRight: '-4px',
                      }}
                    >
                      <Cancel />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item>
            <FormControl
              fullWidth
              variant="outlined"
              style={{ height: 'auto', maxHeight: '100px', overflow: 'auto' }}
              data-cy="qc-identifier-selector"
            >
              <InputLabel>Identifiers</InputLabel>
              <Select
                multiple
                value={state.selectedIdentifiers}
                inputProps={{ 'data-cy': 'qc-identifier-selector-input' }}
                onChange={(e) =>
                  dispatch({
                    type: 'SET_SELECTED_IDENTIFIERS',
                    payload: e.target.value,
                  })
                }
                label="Identifiers"
                renderValue={(selected) => {
                  const selectedNames = selected
                    .map((value) => {
                      const foundItem = quotaIdentifiers[selectedType]?.find(
                        (item) => item.id === value
                      )

                      return foundItem ? foundItem.displayName : ''
                    })
                    .filter(Boolean)

                  let displayText = selectedNames.join(', ')

                  const maxLength = 30
                  if (displayText.length > maxLength) {
                    displayText = `${displayText.substring(0, maxLength)}...`
                  }

                  return displayText
                }}
              >
                {quotaIdentifiers[selectedType]?.map(({ id, displayName }) => (
                  <MenuItem
                    key={id}
                    value={id}
                    data-cy={`qc-identifier-selector-${displayName
                      .toLowerCase()
                      .split(' ')
                      .join('')}`}
                    style={{
                      opacity: state.selectedIdentifiers.includes(id) ? 1 : 0.5,
                    }}
                  >
                    {displayName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item>
            <TextField
              label="Value"
              value={state.globalValue}
              onChange={(e) =>
                dispatch({ type: 'SET_GLOBAL_VALUE', payload: e.target.value })
              }
              variant="outlined"
              fullWidth
              InputProps={{
                inputProps: {
                  style: { padding: '16px' },
                  'data-cy': 'qc-value-input',
                },
                endAdornment: state.globalValue && (
                  <InputAdornment position="end">
                    <IconButton
                      edge="end"
                      onClick={() =>
                        dispatch({ type: 'SET_GLOBAL_VALUE', payload: '' })
                      }
                      sx={{
                        marginRight: '-4px',
                      }}
                    >
                      <Cancel />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item>
            <Button
              variant="contained"
              color="primary"
              fullWidth
              onClick={handleApplyGlobalQuotas}
              disabled={state.isApplyDisabled}
              size={'large'}
              data-cy={'qc-apply-button'}
            >
              {T.Apply}
            </Button>
          </Grid>
          <Grid item sx={{ mt: 2 }}>
            <Typography
              variant="subtitle2"
              color="textSecondary"
              sx={{ opacity: 0.7 }}
            >
              <strong>How to use Quota Controls:</strong>
              <ul>
                <li>Select the quota type from the dropdown.</li>
                <li>Enter Resource IDs, separated by commas.</li>
                <li>Select identifiers for the quota.</li>
                <li>Enter the value for the selected quota.</li>
                <li>Click Apply to set the quotas.</li>
              </ul>
            </Typography>
          </Grid>
        </Grid>
      </Box>
    )
  }
)

/**
 * Convert quota data to XML format.
 *
 * @param {string} type - Quota type.
 * @param {string} resourceId - Resource ID
 * @param {object} quota - Quota data.
 * @returns {string} XML representation of the quota.
 */
const quotasToXml = (type, resourceId, quota) => {
  let innerXml = ''

  for (const [key, value] of Object.entries(quota)) {
    innerXml += `<${key.toUpperCase()}>${value}</${key.toUpperCase()}>`
  }

  const finalXml = `<TEMPLATE><${type}><ID>${resourceId}</ID>${innerXml}</${type}></TEMPLATE>`

  return finalXml
}

QuotaControls.displayName = 'QuotaControls'

QuotaControls.propTypes = {
  quotaTypes: PropTypes.arrayOf(
    PropTypes.shape({
      title: PropTypes.string.isRequired,
      type: PropTypes.string.isRequired,
    })
  ).isRequired,
  userId: PropTypes.string.isRequired,
  selectedType: PropTypes.string,
  setSelectedType: PropTypes.func,
}
