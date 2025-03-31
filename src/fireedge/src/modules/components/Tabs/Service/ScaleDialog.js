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
import { Component } from 'react'
import PropTypes from 'prop-types'
import { useForm } from 'react-hook-form'
import {
  Dialog,
  TextField,
  Switch,
  FormControlLabel,
  Stack,
  Box,
  Typography,
} from '@mui/material'
import { Tr } from '@modules/components/HOC'
import { T, STYLE_BUTTONS } from '@ConstantsModule'
import SubmitButton from '@modules/components/FormControl/SubmitButton'

/**
 * Dialog for scaling the number of VMs.
 *
 * @param {object} props - Props
 * @param {boolean} props.open - Determines if the dialog is open
 * @param {Function} props.onClose - Function to call when closing the dialog
 * @param {Function} props.onScale - API call when the form is submitted
 * @param {string} props.roleName - Selected role name
 * @returns {Component} The scale dialog component
 */
export const ScaleDialog = ({ open, onClose, onScale, roleName }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm()

  /**
   * Handles the form submission.
   *
   * @param {object} data - The data from the form
   */
  const onSubmit = (data) => {
    onScale({
      action: {
        force: data?.force,
        cardinality: data?.numberOfVms,
        role_name: roleName,
      },
    })
    onClose()
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <Box padding={4}>
        <Typography variant="h6">Scale</Typography>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Stack direction="column" alignItems="start" justifyContent="center">
            <TextField
              margin="normal"
              fullWidth
              label={Tr(T.NumberOfVms)}
              type="number"
              {...register('numberOfVms', {
                required: 'Number of VMs is required',
              })}
              error={!!errors.numberOfVms}
              helperText={errors.numberOfVms?.message}
            />
            <FormControlLabel
              control={<Switch {...register('force')} />}
              label={Tr(T.Force)}
            />
            <SubmitButton
              importance={STYLE_BUTTONS.IMPORTANCE.MAIN}
              size={STYLE_BUTTONS.SIZE.MEDIUM}
              type={STYLE_BUTTONS.TYPE.FILLED}
              sx={{ mt: 2, alignSelf: 'end' }}
              label={T.Scale}
            />
          </Stack>
        </form>
      </Box>
    </Dialog>
  )
}

ScaleDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onScale: PropTypes.func.isRequired,
  roleName: PropTypes.string,
}
