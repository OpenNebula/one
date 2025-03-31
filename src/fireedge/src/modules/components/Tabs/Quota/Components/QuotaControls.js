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
import { memo, useMemo, useEffect, useState, useCallback } from 'react'
import PropTypes from 'prop-types'
import {
  Autocomplete,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  useTheme,
} from '@mui/material'

import { UserAPI, GroupAPI, useGeneralApi, SystemAPI } from '@FeaturesModule'

import { T, STYLE_BUTTONS } from '@ConstantsModule'
import { Tr } from '@modules/components/HOC'
import {
  validateResourceId,
  validateValue,
  useQuotaControlReducer,
  getConcatenatedValues,
  quotaIdentifiers,
  handleApplyGlobalQuotas,
} from '@modules/components/Tabs/Quota/Components/helpers/scripts'

import {
  HybridInputField,
  ResourceIDAutocomplete,
} from '@modules/components/Tabs/Quota/Components/helpers/subcomponents'

import { SubmitButton } from '@modules/components/FormControl'

import { mapValues, map } from 'lodash'

/**
 * QuotaControls Component
 *
 * @param {object} props - Props for the component
 * @param {Array} props.quotaTypes - Available quota types
 * @param {string} props.userId - User ID
 * @param {string} props.selectedType - Selected quota type
 * @param {Function} props.setSelectedType - Function to set selected quota type
 * @param {Array} props.existingResourceIDs - Existing resource IDs
 * @param {object} props.clickedElement - Clicked element data.
 * @param {object} props.nameMaps - Resource name mappings.
 */
export const QuotaControls = memo(
  ({
    quotaTypes,
    userId,
    selectedType,
    setSelectedType,
    existingData,
    clickedElement,
    nameMaps,
    groups,
  }) => {
    const [state, actions] = useQuotaControlReducer()

    const [popoverAnchorEl, setPopoverAnchorEl] = useState(null)
    const [touchedFields, setTouchedFields] = useState({})
    const { enqueueError, enqueueSuccess } = useGeneralApi()
    const { data: { QUOTA_VM_ATTRIBUTE: genericQuotas = [] } = {} } =
      SystemAPI.useGetOneConfigQuery()

    const formatGenericQuotas = (
      Array.isArray(genericQuotas) ? genericQuotas : [genericQuotas]
    )?.reduce((acc, quota) => {
      acc.push(
        {
          id: quota,
          displayName: quota.charAt(0) + quota.slice(1).toLowerCase(),
        },
        {
          id: `RUNNING_${quota?.toUpperCase()}`,
          displayName: `Running ${
            quota.charAt(0) + quota.slice(1).toLowerCase()
          }`,
        }
      )

      return acc
    }, [])

    const extendedQuotaIdentifiers = mapValues(quotaIdentifiers, (quotaArray) =>
      map(quotaArray, (quota) => ({
        ...quota,
        displayName: Tr(quota.displayName),
      }))
    )

    if (!extendedQuotaIdentifiers.VM) {
      extendedQuotaIdentifiers.VM = []
    }

    extendedQuotaIdentifiers.VM = [
      ...extendedQuotaIdentifiers.VM,
      ...formatGenericQuotas,
    ]

    const [updateQuota] = groups
      ? GroupAPI.useUpdateGroupQuotaMutation()
      : UserAPI.useUpdateUserQuotaMutation()

    const { palette } = useTheme()

    useEffect(() => {
      if (!clickedElement) return

      if (actions.setGlobalIds && Array.isArray(state.globalIds)) {
        const { ID } = clickedElement
        const isElementSelected = state.globalIds.includes(ID)
        actions.setGlobalIds(
          isElementSelected
            ? state.globalIds.filter((id) => id !== ID)
            : [...state.globalIds, ID]
        )
      }
    }, [clickedElement])

    useMemo(() => {
      actions.setSelectedIdentifier('')
    }, [selectedType])

    useEffect(() => {
      actions.setGlobalIds([])
      actions.setGlobalValue('')
      actions.setMarkForDeletion([])
    }, [selectedType])

    const getNewValues = useCallback(
      () =>
        existingData.reduce((acc, item) => {
          const identifier = state.selectedIdentifier
          acc[item.ID] = item[identifier] || ''

          return acc
        }, {}),
      [existingData, selectedType, state.selectedIdentifier]
    )

    useEffect(() => {
      const newValues = getNewValues()
      actions.setValues(newValues)
    }, [getNewValues, state.globalIds, selectedType, state.selectedIdentifier])

    useEffect(() => {
      const isApplyEnabled =
        state.isValid &&
        selectedType &&
        state.selectedIdentifier.length > 0 &&
        state.globalIds.length > 0 &&
        validateValue(state.globalValue)
      actions.setIsApplyDisabled(!isApplyEnabled)
    }, [
      state.isValid,
      selectedType,
      state.selectedIdentifier,
      state.globalValue,
      state.globalIds.length,
    ])

    useEffect(() => {
      const allValuesAreValid = state.globalIds.every((id) =>
        validateValue(state.values[id] || '')
      )

      actions.setIsValid(allValuesAreValid)
    }, [state.globalIds, state.values])

    useEffect(() => {
      if (state.globalIds.length === 1) {
        const singleGlobalId = state.globalIds[0]
        const singleGlobalValue = state.values[singleGlobalId] || ''
        actions.setGlobalValue(singleGlobalValue)
      }
    }, [state.globalIds, state.values])

    const existingTemplate = groups
      ? GroupAPI.useGetGroupQuery({ id: userId })
      : UserAPI.useGetUserQuery({ id: userId })

    const filteredResourceIDs = [
      ...existingData
        ?.map(({ ID, CLUSTER_IDS }) => ID ?? CLUSTER_IDS)
        ?.filter((id) => !state.globalIds.includes(id))
        .filter(Boolean),
    ]

    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          overflow: 'auto',
        }}
      >
        <Grid
          container
          spacing={2}
          direction="column"
          sx={{ flex: 1, overflow: 'auto' }}
        >
          <Grid item>
            <FormControl
              fullWidth
              variant="outlined"
              data-cy="qc-type-selector"
            >
              <InputLabel>{Tr(T.Type)}</InputLabel>
              <Select
                value={selectedType || ''}
                onChange={(e) => setSelectedType(e.target.value)}
                label={Tr(T.Type)}
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
            <ResourceIDAutocomplete
              selectedType={selectedType}
              state={state}
              actions={actions}
              validateResourceId={validateResourceId}
              filteredResourceIDs={filteredResourceIDs}
              palette={palette}
              nameMaps={nameMaps}
            />
          </Grid>

          <Grid item>
            <Autocomplete
              value={
                extendedQuotaIdentifiers[selectedType]?.find(
                  (item) => item.id === state.selectedIdentifier
                ) || null
              }
              onChange={(_event, newValue) => {
                actions.setSelectedIdentifier(newValue ? newValue.id : '')
              }}
              options={extendedQuotaIdentifiers[selectedType] || []}
              getOptionLabel={(option) => option.displayName}
              style={{ width: '100%', height: '100%' }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={Tr(T.Identifier)}
                  variant="outlined"
                  inputProps={{
                    ...params.inputProps,
                    'data-cy': 'qc-identifier-selector-input',
                  }}
                  InputProps={{
                    ...params.InputProps,
                    style: { height: '56px' },
                  }}
                  style={{
                    height: '56px',
                    maxHeight: '56px',
                    overflow: 'visible',
                  }}
                />
              )}
              ListboxProps={{
                style: { maxHeight: 200, overflow: 'auto' },
              }}
              renderOption={(props, option) => (
                <MenuItem
                  {...props}
                  key={option.id}
                  value={option.id}
                  data-cy={`qc-identifier-selector-${option.displayName
                    .toLowerCase()
                    .split(' ')
                    .join('')}`}
                  style={{
                    opacity: state.selectedIdentifier === option.id ? 1 : 0.5,
                  }}
                >
                  {option.displayName}
                </MenuItem>
              )}
              data-cy="qc-identifier-selector"
            />
          </Grid>
          <Grid item>
            <HybridInputField
              selectedType={selectedType}
              state={state}
              actions={actions}
              validateValue={validateValue}
              getConcatenatedValues={getConcatenatedValues}
              setPopoverAnchorEl={setPopoverAnchorEl}
              popoverAnchorEl={popoverAnchorEl}
              palette={palette}
              touchedFields={touchedFields}
              setTouchedFields={setTouchedFields}
            />
          </Grid>
          <Grid item>
            <SubmitButton
              importance={STYLE_BUTTONS.IMPORTANCE.MAIN}
              size={STYLE_BUTTONS.SIZE.MEDIUM}
              type={STYLE_BUTTONS.TYPE.FILLED}
              label={T.Apply}
              fullWidth
              onClick={() =>
                handleApplyGlobalQuotas(
                  state,
                  existingTemplate,
                  selectedType,
                  actions,
                  userId,
                  updateQuota,
                  enqueueError,
                  enqueueSuccess,
                  nameMaps
                )
              }
              disabled={state.isApplyDisabled}
              data-cy={'qc-apply-button'}
            />
          </Grid>
          <Grid item sx={{ mt: 2 }}>
            <Typography
              variant="subtitle2"
              color="textSecondary"
              sx={{ opacity: 0.7 }}
            >
              <strong>{Tr(T.QuotaHelpTitle)}:</strong>
              <ul>
                <li>{Tr(T.QuotaHelpStep1)}</li>
                <Box
                  component="li"
                  sx={{
                    textDecoration: 'underline',
                    fontWeight: 'bold',
                  }}
                  title={Tr(T.QuotaHelpStep2Tooltip)}
                >
                  {Tr(T.QuotaHelpStep2)}
                </Box>

                <Box
                  component="li"
                  sx={{
                    textDecoration: 'underline',
                    fontWeight: 'bold',
                  }}
                  title={Tr(T.QuotaHelpStep3Tooltip)}
                >
                  {Tr(T.QuotaHelpStep3)}
                </Box>

                <li>{Tr(T.QuotaHelpStep4)}</li>
                <li>{Tr(T.QuotaHelpStep5)}</li>
              </ul>
            </Typography>
          </Grid>
        </Grid>
      </Box>
    )
  }
)

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
  existingData: PropTypes.oneOfType([PropTypes.array, PropTypes.object]),
  clickedElement: PropTypes.object,
  nameMaps: PropTypes.object,
  groups: PropTypes.bool,
}

QuotaControls.defaultProps = {
  existingData: [],
}
