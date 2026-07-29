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
import { memo, useMemo, useEffect, useState, useCallback, useRef } from 'react'
import PropTypes from 'prop-types'
import { Box, Typography, useTheme } from '@mui/material'

import {
  UserAPI,
  GroupAPI,
  useGeneralApi,
  SystemAPI,
  ClusterAPI,
  DatastoreAPI,
  ImageAPI,
  VnAPI,
} from '@FeaturesModule'

import { T } from '@ConstantsModule'
import { useTranslation } from '@ProvidersModule'
import {
  validateResourceId,
  validateValue,
  useQuotaControlReducer,
  getConcatenatedValues,
  quotaIdentifiers,
  handleApplyGlobalQuotas,
} from '@modules/resources/Tabs/Quota/Components/helpers/scripts'

import {
  HybridInputField,
  ResourceIDAutocomplete,
} from '@modules/resources/Tabs/Quota/Components/helpers/subcomponents'

import { Dropdown, SubmitButton, Tooltip } from '@ComponentsV2Module'

import { mapValues, map } from 'lodash'

const getOptionDataCy = ({ displayName, id, type }) =>
  String(type ?? displayName ?? id ?? '')
    .toLowerCase()
    .split(' ')
    .join('')

const toDropdownOptions = (items = []) =>
  items.map(({ displayName, id, title, type }) => ({
    text: displayName ?? title,
    value: id ?? type,
    dataCy: getOptionDataCy({ displayName, id, type }),
  }))

const getSelectedOption = (options, value) =>
  options.find(({ value: optionValue }) => optionValue === value) ?? null

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
    const { translate } = useTranslation()
    const [getClusters] = ClusterAPI.useLazyGetClustersQuery()
    const [getDatastores] = DatastoreAPI.useLazyGetDatastoresQuery()
    const [getImages] = ImageAPI.useLazyGetImagesQuery()
    const [getNetworks] = VnAPI.useLazyGetVNetworksQuery()

    const [state, actions] = useQuotaControlReducer()
    const [popoverAnchorEl, setPopoverAnchorEl] = useState(null)
    const [existingResourceIds, setExistingResourceIds] = useState(null)
    const [touchedFields, setTouchedFields] = useState({})
    const { enqueueError, enqueueSuccess } = useGeneralApi()
    const { data: { QUOTA_VM_ATTRIBUTE: genericQuotas = [] } = {} } =
      SystemAPI.useGetOneConfigQuery()

    const initialized = useRef(false)

    const formatGenericQuotas = (
      Array.isArray(genericQuotas) ? genericQuotas : [genericQuotas]
    )?.reduce((acc, quota) => {
      acc.push(
        {
          id: quota,
          displayName: quota.charAt(0) + quota.slice(1).toLowerCase(),
        },
        {
          id: 'RUNNING_' + quota?.toUpperCase(),
          displayName:
            'Running ' + quota.charAt(0) + quota.slice(1).toLowerCase(),
        }
      )

      return acc
    }, [])

    const extendedQuotaIdentifiers = mapValues(quotaIdentifiers, (quotaArray) =>
      map(quotaArray, (quota) => ({
        ...quota,
        displayName: translate(quota.displayName),
      }))
    )

    if (!extendedQuotaIdentifiers.VM) {
      extendedQuotaIdentifiers.VM = []
    }

    extendedQuotaIdentifiers.VM = [
      ...extendedQuotaIdentifiers.VM,
      ...formatGenericQuotas,
    ]

    const quotaTypeOptions = toDropdownOptions(quotaTypes)
    const identifierOptions = toDropdownOptions(
      extendedQuotaIdentifiers[selectedType] || []
    )
    const selectedQuotaType = getSelectedOption(quotaTypeOptions, selectedType)
    const selectedIdentifier = getSelectedOption(
      identifierOptions,
      state.selectedIdentifier
    )

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
      actions.setQuotaType(selectedType)
      actions.setGlobalIds(
        selectedType === 'VM' && !initialized.current ? ['@Global'] : []
      )
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
        (state.quotaType === 'VM' || state.globalIds.length > 0) &&
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

    useEffect(() => {
      const fetchData = async () => {
        let result = null

        switch (state?.quotaType) {
          case 'VM':
            result = await getClusters()
            break
          case 'DATASTORE':
            result = await getDatastores()
            break
          case 'IMAGE':
            result = await getImages()
            break
          case 'NETWORK':
            result = await getNetworks()
            break
          default:
            result = null
        }

        const formatResourceNames = []
          .concat(result?.data)
          ?.map(({ NAME } = {}) => NAME)
          ?.filter(Boolean)

        setExistingResourceIds(formatResourceNames)
      }

      fetchData()
    }, [state?.quotaType])

    const filteredResourceIDs = useMemo(() => {
      const idsFromData =
        existingData
          ?.map(({ ID, CLUSTER_IDS }) => ID ?? CLUSTER_IDS)
          ?.filter((id) => id !== '@Global' && !state.globalIds.includes(id))
          .filter(Boolean) ?? []

      const allIds = [...(existingResourceIds ?? []), ...idsFromData]

      return [
        ...(state?.quotaType === 'VM' ? ['@Global'] : []),
        ...new Set(allIds),
      ]
    }, [state.quotaType, existingData, existingResourceIds, state.globalIds])

    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          overflow: 'visible',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            gap: '16px',
            overflow: 'visible',
          }}
        >
          <Box>
            <Dropdown
              dataCy="qc-type-selector"
              label={translate(T.Type)}
              initialValue={selectedQuotaType}
              options={quotaTypeOptions}
              onChange={(option) => setSelectedType(option?.value ?? '')}
            />
          </Box>

          <ResourceIDAutocomplete
            selectedType={selectedType}
            state={state}
            actions={actions}
            validateResourceId={validateResourceId}
            filteredResourceIDs={filteredResourceIDs}
            palette={palette}
            nameMaps={nameMaps}
          />

          <Box>
            <Dropdown
              dataCy="qc-identifier-selector"
              label={translate(T.Identifier)}
              initialValue={selectedIdentifier}
              options={identifierOptions}
              onChange={(option) => {
                actions.setSelectedIdentifier(option?.value ?? '')
              }}
              rowsDisplayed={6}
            />
          </Box>

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

          <SubmitButton
            type="primary"
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
            isDisabled={state.isApplyDisabled}
            data-cy="qc-apply-button"
          />

          <Box
            sx={{
              color: 'text.body',
              opacity: 0.82,
              fontSize: '0.875rem',
              lineHeight: 1.55,
              '& ul': {
                margin: '8px 0 0',
                paddingInlineStart: '20px',
              },
              '& li': {
                marginBottom: '4px',
              },
            }}
          >
            <Typography component="strong" sx={{ fontWeight: 600 }}>
              {translate(T.QuotaHelpTitle)}:
            </Typography>
            <ul>
              <li>{translate(T.QuotaHelpStep1)}</li>
              <li>
                <Tooltip title={translate(T.QuotaHelpStep2Tooltip)}>
                  <Box component="span" sx={{ textDecoration: 'underline' }}>
                    {translate(T.QuotaHelpStep2)}
                  </Box>
                </Tooltip>
              </li>
              <li>
                <Tooltip title={translate(T.QuotaHelpStep3Tooltip)}>
                  <Box component="span" sx={{ textDecoration: 'underline' }}>
                    {translate(T.QuotaHelpStep3)}
                  </Box>
                </Tooltip>
              </li>
              <li>{translate(T.QuotaHelpStep4)}</li>
              <li>{translate(T.QuotaHelpStep5)}</li>
            </ul>
          </Box>
        </Box>
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
