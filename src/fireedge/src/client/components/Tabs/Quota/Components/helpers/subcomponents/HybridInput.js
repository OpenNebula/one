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
import { Component } from 'react'
import {
  TextField,
  InputAdornment,
  IconButton,
  Popover,
  Paper,
  Grid,
} from '@mui/material'
import { Cancel } from 'iconoir-react'
import { Tr } from 'client/components/HOC'
import { T } from 'client/constants'

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
  const isDisabled = () =>
    state.selectedIdentifier === '' ||
    (selectedType !== 'VM' && state.globalIds?.length === 0) ||
    (state.globalIds?.length === 1 &&
      state.markedForDeletion.includes(state.globalIds[0]))

  const getValue = () => {
    if (selectedType === 'VM') {
      return state.globalValue
    } else if (state.globalIds.length > 1) {
      return getConcatenatedValues(
        state.values,
        state.globalIds,
        state.markedForDeletion
      )
    } else {
      return state.markedForDeletion.includes(state.globalIds[0])
        ? 'Delete'
        : state.globalValue
    }
  }

  return (
    <>
      <TextField
        label={Tr(T.Value)}
        disabled={isDisabled()}
        value={getValue()}
        onChange={(e) => {
          const value = e.target.value
          if (validateValue(value)) {
            if (state.globalIds.length === 1 || selectedType === 'VM') {
              actions.setGlobalValue(value)
              if (selectedType !== 'VM') {
                actions.setValues({
                  ...state.values,
                  [state?.globalIds[0]]: value,
                })
              }
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
        }}
        onClick={(event) => {
          if (state.globalIds.length > 1) {
            setPopoverAnchorEl(event.currentTarget)
          }
        }}
        variant="outlined"
        fullWidth
        InputProps={{
          inputProps: {
            style: { padding: '16px' },
            'data-cy': 'qc-value-input',
          },
          endAdornment: state.globalValue &&
            state.globalIds.length <= 1 &&
            !state.markedForDeletion.includes(state.globalIds[0]) && (
              <InputAdornment position="end">
                <IconButton
                  edge="end"
                  onClick={() => actions.setGlobalValue('')}
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
      <Popover
        open={Boolean(popoverAnchorEl)}
        anchorEl={popoverAnchorEl}
        onClose={() => setPopoverAnchorEl(null)}
        anchorOrigin={{ vertical: 'center', horizontal: 'right' }}
        transformOrigin={{ vertical: 'center', horizontal: 'left' }}
        sx={{
          '& .MuiPaper-root': {
            padding: 2,
            maxWidth: '500px',
            borderRadius: 2,
            boxShadow: '0px 4px 20px rgba(0,0,0,0.1)',
          },
        }}
      >
        <Paper
          elevation={0}
          sx={{
            padding: 2,
            backgroundColor: palette?.background?.default,
          }}
        >
          <Grid container spacing={2}>
            {state.globalIds.map((id, index) => (
              <Grid item key={index} xs={6}>
                <TextField
                  label={`Value for ${state.selectedIdentifier} ID ${id}`}
                  value={
                    state.markedForDeletion.includes(id)
                      ? 'Delete'
                      : state.values[id] || ''
                  }
                  disabled={state.markedForDeletion.includes(id)}
                  data-cy={`qc-value-input-${index ?? 0}`}
                  onChange={(e) => {
                    const value = e.target.value
                    if (validateValue(value)) {
                      actions.setValues({ ...state.values, [id]: value })
                    }
                  }}
                  variant="outlined"
                  fullWidth
                  size="small"
                  error={touchedFields[id] && !validateValue(state.values[id])}
                  helperText={
                    touchedFields[id] &&
                    !validateValue(state.values[id]) &&
                    'Invalid value'
                  }
                  onBlur={() =>
                    setTouchedFields((prev) => ({ ...prev, [id]: true }))
                  }
                />
              </Grid>
            ))}
          </Grid>
        </Paper>
      </Popover>
    </>
  )
}

HybridInputField.propTypes = {
  selectedType: PropTypes.string,
  state: PropTypes.shape({
    selectedIdentifier: PropTypes.string,
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
