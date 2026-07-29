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
import { Component } from 'react'
import { Box, Popover } from '@mui/material'
import { Cancel } from 'iconoir-react'
import { useTranslation } from '@ProvidersModule'
import { T } from '@ConstantsModule'
import { Button, InputField } from '@ComponentsV2Module'

const getInputValue = ({ state, getConcatenatedValues }) => {
  if (state.globalIds.length > 1) {
    return getConcatenatedValues(
      state.values,
      state.globalIds,
      state.markedForDeletion
    )
  }

  return state.markedForDeletion.includes(state.globalIds[0])
    ? 'Delete'
    : state.globalValue
}

/**
 * @param {object} props - The props for the component.
 * @param {string} props.selectedType - The currently selected quota type.
 * @param {object} props.state - The state object containing various state indicators.
 * @param {object} props.actions - An object containing reducer actions to mutate the state.
 * @param {Function} props.validateValue - A function to validate the input value.
 * @param {Function} props.getConcatenatedValues - A function to concatenate multiple values.
 * @param {Function} props.setPopoverAnchorEl - A function to set the anchor for the popover.
 * @param {HTMLElement} props.popoverAnchorEl - The anchor element for the popover.
 * @param {object} props.palette - The MUI theme palette.
 * @param {object} props.touchedFields - An object representing the touched state of fields.
 * @param {Function} props.setTouchedFields - A function to set fields as touched upon interaction.
 * @returns {Component} - Input component
 */
export const HybridInputField = ({
  selectedType,
  state,
  actions,
  validateValue,
  getConcatenatedValues,
  setPopoverAnchorEl,
  popoverAnchorEl,
  palette,
  touchedFields,
  setTouchedFields,
}) => {
  const { translate } = useTranslation()
  const isDisabled = () =>
    state.selectedIdentifier === '' ||
    (state.quotaType !== 'VM' && state.globalIds?.length === 0) ||
    (state.globalIds?.length === 1 &&
      state.markedForDeletion.includes(state.globalIds[0]))

  const handleValueChange = (value) => {
    if (!validateValue(value)) return

    if (state.quotaType === 'VM' || state.globalIds.length === 1) {
      actions.setGlobalValue(value)
      actions.setValues({
        ...state.values,
        [state?.globalIds[0]]: value,
      })
    } else {
      const updatedValues = { ...state.values }
      state.globalIds.forEach((id) => {
        if (!state.markedForDeletion.includes(id)) {
          updatedValues[id] = value
        }
      })
      actions.setValues(updatedValues)
    }
  }

  const showClearButton =
    state.globalValue &&
    state.globalIds.length <= 1 &&
    !state.markedForDeletion.includes(state.globalIds[0])

  return (
    <>
      <InputField
        label={translate(T.Value)}
        isDisabled={isDisabled()}
        disabled={isDisabled()}
        value={getInputValue({ state, getConcatenatedValues })}
        onChange={handleValueChange}
        onClick={(event) => {
          if (state.globalIds.length > 1) {
            setPopoverAnchorEl(event.currentTarget)
          }
        }}
        inputProps={{
          'data-cy': 'qc-value-input',
        }}
        endIcon={
          showClearButton && (
            <Button
              type="transparent"
              size="small"
              iconOnly={<Cancel width="16px" height="16px" />}
              onClick={(event) => {
                event.stopPropagation()
                actions.setGlobalValue('')
                actions.setValues({
                  ...state.values,
                  [state?.globalIds[0]]: '',
                })
              }}
              sx={{ padding: '0px' }}
            />
          )
        }
      />
      <Popover
        open={Boolean(popoverAnchorEl)}
        anchorEl={popoverAnchorEl}
        onClose={() => setPopoverAnchorEl(null)}
        anchorOrigin={{ vertical: 'center', horizontal: 'right' }}
        transformOrigin={{ vertical: 'center', horizontal: 'left' }}
        sx={{
          '& .MuiPaper-root': {
            padding: '16px',
            maxWidth: '500px',
            borderRadius: '8px',
            boxShadow: '0px 4px 20px rgba(0,0,0,0.1)',
            backgroundColor: palette?.background?.default,
          },
        }}
      >
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
            gap: '16px',
            minWidth: '420px',
          }}
        >
          {state.globalIds.map((id, index) => {
            const isMarkedForDeletion = state.markedForDeletion.includes(id)
            const fieldIsInvalid =
              touchedFields[id] && !validateValue(state.values[id])

            return (
              <InputField
                key={id}
                label={'Value for ' + state.selectedIdentifier + ' ID ' + id}
                value={isMarkedForDeletion ? 'Delete' : state.values[id] || ''}
                isDisabled={isMarkedForDeletion}
                disabled={isMarkedForDeletion}
                data-cy={'qc-value-input-' + (index ?? 0)}
                onChange={(value) => {
                  if (validateValue(value)) {
                    actions.setValues({ ...state.values, [id]: value })
                  }
                }}
                error={fieldIsInvalid ? 'Invalid value' : ''}
                onBlur={() =>
                  setTouchedFields((prev) => ({ ...prev, [id]: true }))
                }
              />
            )
          })}
        </Box>
      </Popover>
    </>
  )
}

HybridInputField.propTypes = {
  selectedType: PropTypes.string,
  state: PropTypes.shape({
    selectedIdentifier: PropTypes.string,
    quotaType: PropTypes.string,
    globalIds: PropTypes.arrayOf(PropTypes.string),
    globalValue: PropTypes.string,
    markedForDeletion: PropTypes.oneOfType([PropTypes.array, PropTypes.string]),
    values: PropTypes.objectOf(PropTypes.string),
  }),
  actions: PropTypes.shape({
    setGlobalValue: PropTypes.func,
    setValues: PropTypes.func,
    setMarkForDeletion: PropTypes.func,
    setUnmarkForDeletion: PropTypes.func,
  }),
  validateValue: PropTypes.func,
  getConcatenatedValues: PropTypes.func,
  setPopoverAnchorEl: PropTypes.func,
  popoverAnchorEl: PropTypes.instanceOf(Element),
  palette: PropTypes.object,
  touchedFields: PropTypes.objectOf(PropTypes.bool),
  setTouchedFields: PropTypes.func,
}
