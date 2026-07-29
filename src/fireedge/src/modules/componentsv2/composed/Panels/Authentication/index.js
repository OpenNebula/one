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
import { Component, forwardRef, useMemo, useState } from 'react'
import { Box, Typography } from '@mui/material'
import { EditPencil } from 'iconoir-react'

import { T } from '@ConstantsModule'
import { Dialog } from '@modules/componentsv2/primitives/Dialog'
import { Dropdown } from '@modules/componentsv2/primitives/Dropdown'
import { InputField } from '@modules/componentsv2/primitives/Fields'
import { SubmitButton } from '@modules/componentsv2/primitives/Buttons/Submit'
import { TextArea } from '@modules/componentsv2/primitives/TextArea'
import { getStyles } from '@modules/componentsv2/composed/Panels/Authentication/styles'
import { useTranslation } from '@ProvidersModule'

const AUTH_DRIVER_OPTIONS = [
  'core',
  'public',
  'ssh',
  'x509',
  'ldap',
  'saml',
  'server_cipher',
  'server_x509',
  'custom',
].map((driver) => ({ text: driver, value: driver }))

const SECRET_DIALOGS = {
  sshKey: {
    title: T.EditPublicSSHKey,
    label: T.SshPublicKey,
    placeholder: T.PasteSSHKey,
  },
  privateSshKey: {
    title: T.EditPrivateSSHKey,
    label: T.SshPrivateKey,
    placeholder: T.PastePrivateSSHKey,
  },
  passphrase: {
    title: T.EditSSHKeyPassphrase,
    label: T.SshPassphraseKey,
    placeholder: T.EnterPassphrase,
    singleLine: true,
  },
}

/**
 * Displays user authentication controls using the Components V2 design system.
 *
 * @param {object} props - Component props
 * @param {string} props.authDriver - Current authentication driver
 * @param {string} props.password - Current password value
 * @param {Function} props.onAuthDriverChange - Auth driver change handler
 * @param {Function} props.onPasswordChange - Password change handler
 * @param {Function} props.onSaveCredentials - Credentials save handler
 * @param {Function} props.onSavePublicSshKey - Public SSH key save handler
 * @param {Function} props.onSavePrivateSshKey - Private SSH key save handler
 * @param {Function} props.onSavePassphrase - SSH passphrase save handler
 * @param {boolean} props.isDisabled - Disable all controls
 * @param {boolean} props.isSaving - Disable controls while saving
 * @param {object} ref - Forwarded ref
 * @returns {Component} Authentication tab
 */
export const AuthenticationTab = forwardRef(
  (
    {
      authDriver = '',
      password = '',
      onAuthDriverChange,
      onPasswordChange,
      onSaveCredentials,
      onSavePublicSshKey,
      onSavePrivateSshKey,
      onSavePassphrase,
      isDisabled = false,
      isSaving = false,
    },
    ref
  ) => {
    const { translate } = useTranslation()
    const [dialog, setDialog] = useState(null)
    const [dialogValue, setDialogValue] = useState('')
    const activeDialog = dialog ? SECRET_DIALOGS[dialog] : null

    const selectedAuthDriver = useMemo(
      () =>
        AUTH_DRIVER_OPTIONS.find(({ value }) => value === authDriver) ?? {
          text: authDriver,
          value: authDriver,
        },
      [authDriver]
    )

    const openDialog = (name) => {
      setDialog(name)
      setDialogValue('')
    }

    const closeDialog = () => {
      setDialog(null)
      setDialogValue('')
    }

    const saveDialog = async () => {
      if (dialog === 'sshKey') await onSavePublicSshKey?.(dialogValue)
      if (dialog === 'privateSshKey') await onSavePrivateSshKey?.(dialogValue)
      if (dialog === 'passphrase') await onSavePassphrase?.(dialogValue)

      closeDialog()
    }

    return (
      <Box sx={(theme) => getStyles({ theme })} ref={ref}>
        <Typography className="title">{translate(T.Authentication)}</Typography>

        <Box className="container">
          <Box className="section">
            <Dropdown
              key={authDriver}
              label={T.AuthenticationDriver}
              initialValue={selectedAuthDriver}
              isMultipleSelectable={false}
              isDisabled={isDisabled || isSaving}
              options={AUTH_DRIVER_OPTIONS}
              onChange={(option) =>
                onAuthDriverChange?.(option?.value ?? option)
              }
              dataCy="auth-driver-selector"
            />

            <InputField
              label={T.Password}
              value={password}
              isDisabled={isDisabled || isSaving}
              onChange={(value) => onPasswordChange?.(value)}
              inputProps={{ 'data-cy': 'auth-password-input' }}
            />
          </Box>

          <Box className="section">
            <SubmitButton
              type="secondary"
              startIcon={<EditPencil width="16px" height="16px" />}
              onClick={() => openDialog('sshKey')}
              isDisabled={isDisabled || isSaving}
              label={T.EditPublicSSHKey}
            />

            <SubmitButton
              type="secondary"
              startIcon={<EditPencil width="16px" height="16px" />}
              onClick={() => openDialog('privateSshKey')}
              isDisabled={isDisabled || isSaving}
              label={T.EditPrivateSSHKey}
            />

            <SubmitButton
              type="secondary"
              startIcon={<EditPencil width="16px" height="16px" />}
              onClick={() => openDialog('passphrase')}
              isDisabled={isDisabled || isSaving}
              label={T.EditSSHKeyPassphrase}
            />
          </Box>

          <Box className="section">
            <SubmitButton
              type="primary"
              onClick={onSaveCredentials}
              isDisabled={isDisabled}
              isSubmitting={isSaving}
              data-cy="auth-save"
              label={T.SaveChanges}
            />
          </Box>
        </Box>

        <Dialog
          open={!!activeDialog}
          onClose={closeDialog}
          title={activeDialog && activeDialog.title}
          actions={
            <>
              <SubmitButton
                type="secondary"
                onClick={closeDialog}
                isDisabled={isSaving}
                label={T.Cancel}
              />
              <SubmitButton
                type="primary"
                onClick={saveDialog}
                isSubmitting={isSaving}
                label={T.Save}
              />
            </>
          }
        >
          {activeDialog?.singleLine ? (
            <InputField
              label={activeDialog.label}
              placeholder={activeDialog.placeholder}
              value={dialogValue}
              onChange={setDialogValue}
            />
          ) : (
            <TextArea
              key={dialog}
              label={activeDialog && activeDialog.label}
              placeholder={activeDialog && activeDialog.placeholder}
              initialValue={dialogValue}
              minRows={5}
              maxRows={10}
              onChange={setDialogValue}
            />
          )}
        </Dialog>
      </Box>
    )
  }
)

AuthenticationTab.propTypes = {
  authDriver: PropTypes.string,
  password: PropTypes.string,
  onAuthDriverChange: PropTypes.func,
  onPasswordChange: PropTypes.func,
  onSaveCredentials: PropTypes.func,
  onSavePublicSshKey: PropTypes.func,
  onSavePrivateSshKey: PropTypes.func,
  onSavePassphrase: PropTypes.func,
  isDisabled: PropTypes.bool,
  isSaving: PropTypes.bool,
}

AuthenticationTab.displayName = 'AuthenticationTab'
