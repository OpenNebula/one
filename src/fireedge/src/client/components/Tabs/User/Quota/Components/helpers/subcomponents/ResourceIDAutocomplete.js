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
import { Component, useState } from 'react'
import { Autocomplete, Box, Chip, IconButton, TextField } from '@mui/material'
import { Trash } from 'iconoir-react'

/**
 * @param {object} root0 - Component
 * @param {string} root0.selectedType - Selected Quota type.
 * @param {object} root0.state - Variable states.
 * @param {object} root0.actions - Reducer actions object.
 * @param {Function} root0.validateResourceId - Validates resource IDs.
 * @param {Array} root0.filteredResourceIDs - Filtered resource IDs.
 * @param {object} root0.palette - MUI theme.
 * @param {object} root0.nameMaps - Object containing name mappings for resources.
 * @returns {Component} - Autocomplete input.
 */
export const ResourceIDAutocomplete = ({
  selectedType,
  state,
  actions,
  validateResourceId,
  filteredResourceIDs,
  palette,
  nameMaps,
}) => {
  const [inputValue, setInputValue] = useState('')

  return (
    <Autocomplete
      multiple
      inputValue={inputValue}
      onInputChange={(event, newInputValue) => {
        setInputValue(newInputValue)
      }}
      options={filteredResourceIDs}
      getOptionLabel={(option) =>
        nameMaps[selectedType]?.[option.toString()] ?? option.toString()
      }
      freeSolo
      value={state.globalIds ?? []}
      disabled={selectedType === 'VM'}
      onKeyDown={(event) => {
        if (event.key === 'Enter' && event.target.value) {
          event.preventDefault()
          const newId = event.target.value
          if (validateResourceId(newId, state?.globalIds, actions.setIsValid)) {
            const newValue = [...state.globalIds, newId]
            actions.setGlobalIds(newValue)
          }
        }
      }}
      renderOption={(option, { selected }) => (
        <Box
          key={option?.key}
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          width="100%"
          sx={{
            cursor: 'pointer',
            borderBottom: 1,
            paddingX: '12px',
            '&:hover': {
              backgroundColor: palette.action.hover,
            },
          }}
          onClick={() => {
            if (!state.globalIds.includes(option?.key)) {
              const newValue = [...state.globalIds, option?.key]
              actions.setGlobalIds(newValue)
            }
          }}
        >
          <span>{option?.key}</span>
          <IconButton
            edge="end"
            onClick={(event) => {
              event.stopPropagation()
              if (!state.globalIds.includes(option?.key)) {
                const newValue = [...state.globalIds, option?.key]
                actions.setGlobalIds(newValue)
              }
              actions.setMarkForDeletion(option?.key)
            }}
          >
            <Trash />
          </IconButton>
        </Box>
      )}
      renderInput={(params) => (
        <TextField
          {...params}
          onBlur={(event) => {
            const value = event.target.value.trim()
            if (
              value &&
              validateResourceId(value, state?.globalIds, actions.setIsValid)
            ) {
              if (!state.globalIds.includes(value)) {
                actions.setGlobalIds([...state.globalIds, value])
              }
            }
            setInputValue('')
          }}
          variant="outlined"
          label="Resource IDs"
          placeholder={
            inputValue || state?.globalIds?.length > 1
              ? ''
              : 'Select or type a Resource ID'
          }
          fullWidth
          error={!state.isValid}
          helperText={
            !state.isValid &&
            'Invalid format or duplicate ID. Please enter a positive number.'
          }
          sx={{
            '.MuiOutlinedInput-root': {
              minHeight: '56px',
            },
            '.MuiOutlinedInput-input': {
              padding: '16px',
            },
          }}
        />
      )}
      onChange={(_event, value) => {
        state.globalIds.forEach((id) => {
          if (!value.includes(id)) {
            actions.setUnmarkForDeletion(id)
          }
        })
        if (value.length === 0) {
          actions.setValues({})
          actions.setGlobalIds([])
          actions.setGlobalValue('')
        }
      }}
      renderTags={(value, getTagProps) =>
        value.map((option, index) => (
          <Chip
            key={index}
            variant="outlined"
            label={option}
            {...getTagProps({ index })}
            style={{
              backgroundColor: state.markedForDeletion.includes(option)
                ? palette?.error?.main
                : 'transparent',
            }}
            onDelete={() => {
              actions.setUnmarkForDeletion(option)
              const newValue = state.globalIds.filter((id) => id !== option)
              actions.setGlobalIds(newValue)
            }}
          />
        ))
      }
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
  actions: PropTypes.objectOf(PropTypes.func),
  validateResourceId: PropTypes.func,
  filteredResourceIDs: PropTypes.arrayOf(PropTypes.any),
  palette: PropTypes.shape({
    action: PropTypes.shape({
      hover: PropTypes.string,
    }),
    error: PropTypes.shape({
      main: PropTypes.string,
    }),
    background: PropTypes.shape({
      default: PropTypes.string,
    }),
  }),
  nameMaps: PropTypes.object,
}

ResourceIDAutocomplete.defaultProps = {
  palette: {},
}
