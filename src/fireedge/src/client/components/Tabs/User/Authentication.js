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
import PropTypes from 'prop-types'
import { Component, useReducer, useCallback } from 'react'
import {
  Typography,
  TextField,
  IconButton,
  Grid,
  Button,
  // Switch,
  // FormControlLabel,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
} from '@mui/material'
import { EditPencil } from 'iconoir-react'
import {
  useGetUserQuery,
  useUpdateUserMutation,
  useChangeAuthDriverMutation,
} from 'client/features/OneApi/user'
import { useGeneralApi } from 'client/features/General'

/**
 * Reducer to manage the state of the AuthenticationInfo component.
 *
 * @param {object} state - Current state.
 * @param {object} action - Action to be processed.
 * @returns {object} New state.
 */
const reducer = (state, action) => {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value }
    default:
      return state
  }
}

/**
 * Generates the initial state for the user.
 *
 * @param {object} user - User data.
 * @returns {object} Initial state for the user.
 */
const getUserInitialState = (user) => ({
  authDriver: user.AUTH_DRIVER || '',
  password: user.PASSWORD || '',
  token: user.TEMPLATE?.TOKEN_PASSWORD || '',
  twoFactorAuth: user.ENABLED === '1',
  sshKeyDialogOpen: false,
  privateSshKeyDialogOpen: false,
  passphraseDialogOpen: false,
  sshKey: '',
  privateSshKey: '',
  passphrase: '',
})

/**
 * Component to manage and display the authentication information of a user.
 *
 * @param {object} props - Component properties.
 * @param {string|number} props.id - ID of the user.
 * @returns {Component} AuthenticationInfo component.
 */
const AuthenticationInfo = ({ id }) => {
  const { enqueueSuccess, enqueueError } = useGeneralApi()

  const { data: user = {} } = useGetUserQuery({ id })
  const [changeAuthDriver] = useChangeAuthDriverMutation()
  const [updateUser] = useUpdateUserMutation()

  const initialState = getUserInitialState(user)
  const [state, dispatch] = useReducer(reducer, initialState)

  const handleUpdateAuthDriver = useCallback(async () => {
    const updateParams = {
      id,
      driver: state.authDriver,
    }

    let passwordUpdated = false

    if (state.password !== user.PASSWORD) {
      updateParams.password = state.password
      passwordUpdated = true
    }

    try {
      await changeAuthDriver(updateParams)

      if (passwordUpdated) {
        enqueueSuccess('Password updated successfully!')
      } else {
        enqueueSuccess('Authentication driver updated successfully!')
      }
    } catch (error) {
      if (passwordUpdated) {
        enqueueError(`Error updating password: ${error.message}`)
      } else {
        enqueueError(`Error updating authentication driver: ${error.message}`)
      }
    }
  }, [id, state, user.PASSWORD, changeAuthDriver, enqueueSuccess, enqueueError])

  const handleFieldChange = (field, value) => {
    dispatch({ type: 'SET_FIELD', field, value })
  }

  const handleSshKeySave = async () => {
    try {
      const formattedSshKey = `SSH_PUBLIC_KEY="${state.sshKey}"`

      await updateUser({
        id,
        template: formattedSshKey,
        replace: 1,
      })

      handleFieldChange('sshKeyDialogOpen', false)
      enqueueSuccess('Public SSH Key updated successfully!')
    } catch (error) {
      enqueueError(`Error updating Public SSH Key: ${error.message}`)
    }
  }

  const handlePrivateSshKeySave = async () => {
    try {
      const formattedPrivateSshKey = `SSH_PRIVATE_KEY="${state.privateSshKey}"`

      await updateUser({
        id,
        template: formattedPrivateSshKey,
        replace: 1,
      })

      handleFieldChange('privateSshKeyDialogOpen', false)
      enqueueSuccess('Private SSH Key updated successfully!')
    } catch (error) {
      enqueueError(`Error updating Private SSH Key: ${error.message}`)
    }
  }

  const handlePassphraseSave = async () => {
    try {
      const formattedPassphrase = `SSH_PASSPHRASE="${state.passphrase}"`

      await updateUser({
        id,
        template: formattedPassphrase,
        replace: 1,
      })

      handleFieldChange('passphraseDialogOpen', false)
      enqueueSuccess('SSH Key Passphrase updated successfully!')
    } catch (error) {
      enqueueError(`Error updating SSH Key Passphrase: ${error.message}`)
    }
  }

  return (
    <Box display="flex" flexDirection="column" height="100%" width="100%">
      <Box
        p={3}
        boxShadow={3}
        borderRadius={2}
        display="flex"
        flexDirection="column"
        flexGrow={1}
        maxHeight="70%"
        minHeight={'300px'}
      >
        <Typography variant="h6" gutterBottom>
          Authentication
        </Typography>
        <Grid container spacing={2} style={{ flexGrow: 1 }}>
          <Grid item xs={6}>
            <TextField
              label="Authentication driver"
              value={state.authDriver}
              onChange={(e) => handleFieldChange('authDriver', e.target.value)}
              fullWidth
              variant="outlined"
              select
              SelectProps={{
                native: false,
              }}
              data-cy={'auth-driver-selector'}
            >
              {[
                'core',
                'public',
                'ssh',
                'x509',
                'ldap',
                'server_cipher',
                'server_x509',
                'custom',
              ].map((option) => (
                <MenuItem
                  key={option}
                  value={option}
                  data-cy={`auth-driver-selector-${option
                    .toLowerCase()
                    .split(' ')
                    .join('')}`}
                >
                  {option}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          {/* To be enabled when 2FA is done */}
          {/*         <Grid item xs={6}>
          <FormControlLabel
            control={
              <Switch
                checked={state.twoFactorAuth}
                onChange={() =>
                  handleFieldChange('twoFactorAuth', !state.twoFactorAuth)
                }
              />
            }
            label="Two factor authentication"
          />
        </Grid> */}
          <Grid item xs={6}>
            <TextField
              label="Password"
              value={state.password}
              onChange={(e) => handleFieldChange('password', e.target.value)}
              fullWidth
              variant="outlined"
              InputProps={{
                inputProps: {
                  'data-cy': 'auth-password-input',
                },
              }}
            />
          </Grid>
          {/* Not implemented yet */}
          {/*         <Grid item xs={6}>
          <TextField
            label="Login token"
            value={state.token}
            onChange={(e) => handleFieldChange('token', e.target.value)}
            fullWidth
            variant="outlined"
          />
        </Grid> */}
          <Grid item xs={6}>
            <IconButton
              onClick={() => handleFieldChange('sshKeyDialogOpen', true)}
            >
              <EditPencil />
            </IconButton>
            <Typography display="inline">Edit Public SSH Key</Typography>
          </Grid>
          <Grid item xs={6}>
            <IconButton
              onClick={() => handleFieldChange('privateSshKeyDialogOpen', true)}
            >
              <EditPencil />
            </IconButton>
            <Typography display="inline">Edit Private SSH Key</Typography>
          </Grid>
          <Grid item xs={6}>
            <IconButton
              onClick={() => handleFieldChange('passphraseDialogOpen', true)}
            >
              <EditPencil />
            </IconButton>
            <Typography display="inline">Edit SSH Key Passphrase</Typography>
          </Grid>
          <Grid item xs={12}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleUpdateAuthDriver}
              data-cy={'auth-save'}
            >
              Save Changes
            </Button>
          </Grid>
        </Grid>
        <Dialog
          open={state.sshKeyDialogOpen}
          onClose={() => handleFieldChange('sshKeyDialogOpen', false)}
        >
          <DialogTitle>Edit Public SSH Key</DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              multiline
              rows={4}
              value={state.sshKey}
              onChange={(e) => handleFieldChange('sshKey', e.target.value)}
              placeholder="Paste your SSH Key here..."
            />
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => handleFieldChange('sshKeyDialogOpen', false)}
              color="primary"
            >
              Cancel
            </Button>
            <Button onClick={handleSshKeySave} color="primary">
              Save
            </Button>
          </DialogActions>
        </Dialog>
        <Dialog
          open={state.privateSshKeyDialogOpen}
          onClose={() => handleFieldChange('privateSshKeyDialogOpen', false)}
        >
          <DialogTitle>Edit Private SSH Key</DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              multiline
              rows={4}
              value={state.privateSshKey}
              onChange={(e) =>
                handleFieldChange('privateSshKey', e.target.value)
              }
              placeholder="Paste your Private SSH Key here..."
            />
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() =>
                handleFieldChange('privateSshKeyDialogOpen', false)
              }
              color="primary"
            >
              Cancel
            </Button>
            <Button onClick={handlePrivateSshKeySave} color="primary">
              Save
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={state.passphraseDialogOpen}
          onClose={() => handleFieldChange('passphraseDialogOpen', false)}
        >
          <DialogTitle>Edit SSH Key Passphrase</DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              value={state.passphrase}
              onChange={(e) => handleFieldChange('passphrase', e.target.value)}
              placeholder="Enter your passphrase..."
            />
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => handleFieldChange('passphraseDialogOpen', false)}
              color="primary"
            >
              Cancel
            </Button>
            <Button onClick={handlePassphraseSave} color="primary">
              Save
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  )
}

export default AuthenticationInfo

AuthenticationInfo.propTypes = {
  id: PropTypes.string,
}
