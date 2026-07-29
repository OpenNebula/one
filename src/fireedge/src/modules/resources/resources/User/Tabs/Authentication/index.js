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
import { Component, useCallback, useEffect, useState } from 'react'

import { T } from '@ConstantsModule'
import { UserAPI, useGeneralApi } from '@FeaturesModule'
import { AuthenticationTab } from '@ComponentsV2Module'
import { LoadingDisplay } from '@modules/resources/LoadingState'
import {
  getUserId,
  userTabPropTypes,
} from '@modules/resources/resources/User/Tabs/common'

const runMutation = async (mutation) =>
  typeof mutation?.unwrap === 'function' ? mutation.unwrap() : mutation

/**
 * Component to manage and display the authentication information of a user.
 *
 * @param {object} props - Component properties.
 * @param {string|number} props.id - ID of the user.
 * @returns {Component} AuthenticationInfo component.
 */
const AuthenticationInfo = ({ id }) => {
  const { enqueueSuccess, enqueueError } = useGeneralApi()
  const {
    data: user,
    isLoading,
    isFetching,
    isError,
    error,
  } = UserAPI.useGetUserQuery({ id })
  const [changeAuthDriver, { isLoading: isChangingAuthDriver }] =
    UserAPI.useChangeAuthDriverMutation()
  const [updateUser, { isLoading: isUpdatingUser }] =
    UserAPI.useUpdateUserMutation()

  const [authDriver, setAuthDriver] = useState('')
  const [password, setPassword] = useState('')

  useEffect(() => {
    setAuthDriver(user?.AUTH_DRIVER || '')
    setPassword(user?.PASSWORD || '')
  }, [user?.ID, user?.AUTH_DRIVER, user?.PASSWORD])

  const handleUpdateAuthDriver = useCallback(async () => {
    const updateParams = {
      id,
      driver: authDriver,
    }

    let passwordUpdated = false

    if (password !== user?.PASSWORD) {
      updateParams.password = password
      passwordUpdated = true
    }

    try {
      await runMutation(changeAuthDriver(updateParams))
      enqueueSuccess(
        passwordUpdated ? T.SuccessPasswordUpdated : T.SuccessAuthDriver
      )
    } catch (err) {
      enqueueError(
        passwordUpdated ? T.ErrorPasswordUpdated : T.ErrorAuthDriverUpdated,
        err?.message
      )
    }
  }, [id, authDriver, password, user?.PASSWORD, changeAuthDriver])

  const saveTemplateValue = useCallback(
    async ({ key, value, successMessage, errorMessage }) => {
      try {
        await runMutation(
          updateUser({
            id,
            template: `${key}="${value}"`,
            replace: 1,
          })
        )

        enqueueSuccess(successMessage)
      } catch (err) {
        enqueueError(errorMessage, err?.message)
      }
    },
    [id, updateUser, enqueueSuccess, enqueueError]
  )

  const handleSshKeySave = (sshKey) =>
    saveTemplateValue({
      key: 'SSH_PUBLIC_KEY',
      value: sshKey,
      successMessage: T.SuccessPublicSSHKeyUpdated,
      errorMessage: T.ErrorPublicSSHKeyUpdated,
    })

  const handlePrivateSshKeySave = (privateSshKey) =>
    saveTemplateValue({
      key: 'SSH_PRIVATE_KEY',
      value: privateSshKey,
      successMessage: T.SuccessPrivateSSHKeyUpdated,
      errorMessage: T.ErrorPrivateSSHKeyUpdated,
    })

  const handlePassphraseSave = (passphrase) =>
    saveTemplateValue({
      key: 'SSH_PASSPHRASE',
      value: passphrase,
      successMessage: T.SuccessPassphraseSSHKeyUpdated,
      errorMessage: T.ErrorPassphraseSSHKeyUpdated,
    })

  if (isLoading || isFetching || !user) {
    return (
      <LoadingDisplay
        isLoading={isLoading || isFetching}
        isEmpty={!user}
        error={isError ? error?.data : undefined}
      />
    )
  }

  return (
    <AuthenticationTab
      authDriver={authDriver}
      password={password}
      onAuthDriverChange={setAuthDriver}
      onPasswordChange={setPassword}
      onSaveCredentials={handleUpdateAuthDriver}
      onSavePublicSshKey={handleSshKeySave}
      onSavePrivateSshKey={handlePrivateSshKeySave}
      onSavePassphrase={handlePassphraseSave}
      isSaving={isChangingAuthDriver || isUpdatingUser}
    />
  )
}

AuthenticationInfo.propTypes = {
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
}

AuthenticationInfo.displayName = 'AuthenticationInfo'

/**
 * @param {object} root0 - Params
 * @param {object} root0.data - Tab slot data payload
 * @returns {Component} User authentication tab
 */
export const Authentication = ({ data }) => (
  <AuthenticationInfo id={getUserId(data)} />
)

Authentication.propTypes = userTabPropTypes

Authentication.id = 'authentication'
Authentication.title = T.Authentication

export default AuthenticationInfo
