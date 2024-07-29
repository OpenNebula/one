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
import { useEffect } from 'react'
import { Component, useFormContext, Controller } from 'react-hook-form'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  Button,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormControlLabel,
  RadioGroup,
  Radio,
} from '@mui/material'
import PropTypes from 'prop-types'
import { Tr } from 'client/components/HOC'
import { T } from 'client/constants'

/**
 * @param {object} root0 - Props
 * @param {boolean} root0.open - Is dialog open?
 * @param {Function} root0.onClose - On close handler
 * @param {object} root0.userInput - User input
 * @returns {Component} - User input edit dialog
 */
const UserInputDialog = ({ open, onClose, userInput }) => {
  const { control, setValue } = useFormContext({
    defaultValues: {
      value: userInput?.default || undefined,
    },
  })

  useEffect(() => {
    setValue(`user_inputs.${userInput.name}`, userInput?.default || '')
  }, [userInput, setValue])

  const onSubmit = () => {
    onClose()
  }

  const renderInputField = ({ field }) => {
    const handleNumericChange = (event) => {
      const value = event.target.value
      field.onChange(userInput.type === 'number' ? Number(value) : value)
    }
    switch (userInput.type) {
      case 'list':
      case 'listmultiple':
        return (
          <FormControl fullWidth>
            <InputLabel id="value-select-label">Value</InputLabel>
            <Select
              {...field}
              labelId="value-select-label"
              id="value-select"
              label={Tr(T.Value)}
              multiple={userInput?.type === 'listmultiple'}
            >
              {userInput?.options?.map((option, index) => (
                <MenuItem key={index} value={option}>
                  {option}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )
      case 'boolean':
        return (
          <RadioGroup
            row
            aria-labelledby="boolean-choice-label"
            name="boolean-choice"
            value={field.value}
            onChange={(e) => field.onChange(e.target.value)}
          >
            <FormControlLabel
              value="YES"
              control={<Radio />}
              label={Tr(T.Yes)}
            />
            <FormControlLabel value="NO" control={<Radio />} label={Tr(T.No)} />
          </RadioGroup>
        )
      default:
        return (
          <TextField
            {...field}
            margin="dense"
            id="value"
            label={Tr(T.Value)}
            type={userInput?.type === 'number' ? 'number' : 'text'}
            fullWidth
            variant="outlined"
            onChange={
              userInput.type === 'number' ? handleNumericChange : field.onChange
            }
          />
        )
    }
  }

  const handleDialogClick = (event) => {
    event.stopPropagation()
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby="form-dialog-title"
      onClick={handleDialogClick}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault()
          onSubmit()
        }}
      >
        <DialogTitle id="form-dialog-title">{userInput.name}</DialogTitle>
        <DialogContent>
          {userInput.description && (
            <Typography style={{ marginBottom: '16px' }}>
              {userInput.description}
            </Typography>
          )}
          <Controller
            name={`user_inputs.${userInput.name}`}
            control={control}
            render={renderInputField}
          />
        </DialogContent>
        <DialogActions>
          <Button type="submit" color="primary">
            OK
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}

UserInputDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  userInput: PropTypes.shape({
    default: PropTypes.any,
    description: PropTypes.string,
    max: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    min: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    name: PropTypes.string.isRequired,
    options: PropTypes.arrayOf(PropTypes.string),
    type: PropTypes.string.isRequired,
  }),
  onSave: PropTypes.func.isRequired,
}

export default UserInputDialog
