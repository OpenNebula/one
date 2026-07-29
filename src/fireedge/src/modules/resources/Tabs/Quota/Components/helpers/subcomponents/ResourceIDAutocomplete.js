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
import PropTypes from 'prop-types'

import { T } from '@ConstantsModule'
import { useTranslation } from '@ProvidersModule'
import { MultiValueInput } from '@ComponentsV2Module'

const toText = (value) => (value == null ? '' : String(value))

const includesValue = (values, value) =>
  values.some((current) => toText(current) === toText(value))

const toOption = ({ selectedType, nameMaps, resourceId }) => {
  const value = toText(resourceId)

  return {
    value,
    text: nameMaps[selectedType]?.[value] ?? value,
  }
}

/**
 * Resource ID selector used by quota controls.
 *
 * @param {object} props - Component props
 * @param {string} props.selectedType - Selected quota type
 * @param {object} props.state - Quota control state
 * @param {object} props.actions - Quota control actions
 * @param {Function} props.validateResourceId - Resource ID validator
 * @param {Array} props.filteredResourceIDs - Available resource IDs
 * @param {object} props.nameMaps - Resource name mappings
 * @returns {object} - Resource ID selector
 */
export const ResourceIDAutocomplete = ({
  selectedType,
  state,
  actions,
  validateResourceId,
  filteredResourceIDs,
  nameMaps,
}) => {
  const { translate } = useTranslation()
  const values = state.globalIds ?? []

  const handleValuesChange = (nextValues = []) => {
    values.forEach((id) => {
      if (!includesValue(nextValues, id)) {
        actions.setUnmarkForDeletion(id)
      }
    })

    if (nextValues.length === 0) {
      actions.setValues({})
      actions.setGlobalValue('')
    }

    actions.setGlobalIds(nextValues)
  }

  return (
    <MultiValueInput
      mode="select"
      allowCustomValues
      label={translate(selectedType === 'VM' ? T.ClusterIds : T.ResourceIds)}
      placeholder={translate(
        selectedType === 'VM' ? T.ClusterIdsConcept : T.ResourceIdsConcept
      )}
      error={!state.isValid ? translate(T.ResourceIdsInvalid) : ''}
      values={values}
      markedValues={state.markedForDeletion ?? []}
      options={(filteredResourceIDs ?? []).map((resourceId) =>
        toOption({ selectedType, nameMaps, resourceId })
      )}
      validateValue={(value, { source }) => {
        if (source === 'option') {
          actions.setIsValid(true)

          return true
        }

        return validateResourceId(value, values, actions.setIsValid)
      }}
      onChange={handleValuesChange}
      rowsDisplayed={6}
      dataCy="qc-id-input"
    />
  )
}

ResourceIDAutocomplete.propTypes = {
  selectedType: PropTypes.string,
  state: PropTypes.shape({
    globalIds: PropTypes.array,
    isValid: PropTypes.bool,
    markedForDeletion: PropTypes.array,
  }),
  actions: PropTypes.shape({
    setGlobalIds: PropTypes.func,
    setGlobalValue: PropTypes.func,
    setIsValid: PropTypes.func,
    setUnmarkForDeletion: PropTypes.func,
    setValues: PropTypes.func,
  }),
  validateResourceId: PropTypes.func,
  filteredResourceIDs: PropTypes.arrayOf(PropTypes.any),
  nameMaps: PropTypes.object,
}

ResourceIDAutocomplete.defaultProps = {
  state: {},
  actions: {},
  filteredResourceIDs: [],
  nameMaps: {},
}
