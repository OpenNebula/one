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
import {
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  MenuItem,
  TextField,
  Typography,
} from '@mui/material'
import { useGeneralApi, UserAPI } from '@FeaturesModule'
import { EditPencil } from 'iconoir-react'
import PropTypes from 'prop-types'
import { Component, useCallback, useReducer } from 'react'
import { Tr } from '@modules/components/HOC'
import { T, STYLE_BUTTONS } from '@ConstantsModule'
import { SubmitButton } from '@modules/components/FormControl'

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

  const { data: user = {} } = UserAPI.useGetUserQuery({ id })
  const [changeAuthDriver] = UserAPI.useChangeAuthDriverMutation()
  const [updateUser] = UserAPI.useUpdateUserMutation()

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
        enqueueSuccess(T.SuccessPasswordUpdated)
      } else {
        enqueueSuccess(T.SuccessAuthDriver)
      }
    } catch (error) {
      if (passwordUpdated) {
        enqueueError(T.ErrorPasswordUpdated, error.message)
      } else {
        enqueueError(T.ErrorAuthDriverUpdated, error.message)
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
      enqueueSuccess(T.SuccessPublicSSHKeyUpdated)
    } catch (error) {
      enqueueError(T.ErrorPublicSSHKeyUpdated, error.message)
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
      enqueueSuccess(T.SuccessPrivateSSHKeyUpdated)
    } catch (error) {
      enqueueError(T.ErrorPrivateSSHKeyUpdated, error.message)
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
      enqueueSuccess(T.SuccessPassphraseSSHKeyUpdated)
    } catch (error) {
      enqueueError(T.ErrorPassphraseSSHKeyUpdated, error.message)
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
          {Tr(T.Authentication)}
        </Typography>
        <Grid container spacing={2} style={{ flexGrow: 1 }}>
          <Grid item xs={6}>
            <TextField
              label={Tr(T.AuthenticationDriver)}
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
          <Grid item xs={6}>
            <TextField
              label={Tr(T.Password)}
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
          <Grid item xs={6}>
            <SubmitButton
              onClick={() => handleFieldChange('sshKeyDialogOpen', true)}
              icon={<EditPencil />}
            />
            <Typography display="inline">{Tr(T.EditPublicSSHKey)}</Typography>
          </Grid>
          <Grid item xs={6}>
            <SubmitButton
              onClick={() => handleFieldChange('privateSshKeyDialogOpen', true)}
              icon={<EditPencil />}
            />
            <Typography display="inline">{Tr(T.EditPrivateSSHKey)}</Typography>
          </Grid>
          <Grid item xs={6}>
            <SubmitButton
              onClick={() => handleFieldChange('passphraseDialogOpen', true)}
              icon={<EditPencil />}
            />
            <Typography display="inline">
              {Tr(T.EditSSHKeyPassphrase)}
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <SubmitButton
              importance={STYLE_BUTTONS.IMPORTANCE.MAIN}
              size={STYLE_BUTTONS.SIZE.MEDIUM}
              type={STYLE_BUTTONS.TYPE.FILLED}
              onClick={handleUpdateAuthDriver}
              data-cy={'auth-save'}
              label={T.SaveChanges}
            />
          </Grid>
        </Grid>
        <Dialog
          open={state.sshKeyDialogOpen}
          onClose={() => handleFieldChange('sshKeyDialogOpen', false)}
        >
          <DialogTitle>{Tr(T.EditPublicSSHKey)}</DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              multiline
              rows={4}
              value={state.sshKey}
              onChange={(e) => handleFieldChange('sshKey', e.target.value)}
              placeholder={Tr(T.PasteSSHKey)}
            />
          </DialogContent>
          <DialogActions>
            <SubmitButton
              onClick={() => handleFieldChange('sshKeyDialogOpen', false)}
              importance={STYLE_BUTTONS.IMPORTANCE.SECONDARY}
              size={STYLE_BUTTONS.SIZE.MEDIUM}
              type={STYLE_BUTTONS.TYPE.FILLED}
              label={T.Cancel}
            />
            <SubmitButton
              onClick={handleSshKeySave}
              importance={STYLE_BUTTONS.IMPORTANCE.MAIN}
              size={STYLE_BUTTONS.SIZE.MEDIUM}
              type={STYLE_BUTTONS.TYPE.FILLED}
              color="primary"
              label={T.Save}
            />
          </DialogActions>
        </Dialog>
        <Dialog
          open={state.privateSshKeyDialogOpen}
          onClose={() => handleFieldChange('privateSshKeyDialogOpen', false)}
        >
          <DialogTitle>{Tr(T.EditPrivateSSHKey)}</DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              multiline
              rows={4}
              value={state.privateSshKey}
              onChange={(e) =>
                handleFieldChange('privateSshKey', e.target.value)
              }
              placeholder={Tr(T.PastePrivateSSHKey)}
            />
          </DialogContent>
          <DialogActions>
            <SubmitButton
              onClick={() =>
                handleFieldChange('privateSshKeyDialogOpen', false)
              }
              importance={STYLE_BUTTONS.IMPORTANCE.SECONDARY}
              size={STYLE_BUTTONS.SIZE.MEDIUM}
              type={STYLE_BUTTONS.TYPE.FILLED}
              label={T.Cancel}
            />
            <SubmitButton
              onClick={handlePrivateSshKeySave}
              importance={STYLE_BUTTONS.IMPORTANCE.MAIN}
              size={STYLE_BUTTONS.SIZE.MEDIUM}
              type={STYLE_BUTTONS.TYPE.FILLED}
              color="primary"
              label={T.Save}
            />
          </DialogActions>
        </Dialog>

        <Dialog
          open={state.passphraseDialogOpen}
          onClose={() => handleFieldChange('passphraseDialogOpen', false)}
        >
          <DialogTitle>{Tr(T.EditSSHKeyPassphrase)}</DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              value={state.passphrase}
              onChange={(e) => handleFieldChange('passphrase', e.target.value)}
              placeholder={Tr(T.EnterPassphrase)}
            />
          </DialogContent>
          <DialogActions>
            <SubmitButton
              onClick={() => handleFieldChange('passphraseDialogOpen', false)}
              importance={STYLE_BUTTONS.IMPORTANCE.SECONDARY}
              size={STYLE_BUTTONS.SIZE.MEDIUM}
              type={STYLE_BUTTONS.TYPE.FILLED}
              label={T.Cancel}
            />
            <SubmitButton
              onClick={handlePassphraseSave}
              importance={STYLE_BUTTONS.IMPORTANCE.MAIN}
              size={STYLE_BUTTONS.SIZE.MEDIUM}
              type={STYLE_BUTTONS.TYPE.FILLED}
              color="primary"
              label={T.Save}
            />
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
