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
import { SubmitButton, FormWithSchema, Tr } from '@ComponentsModule'
import {
  AUTH_DRIVER,
  ONEADMIN_ID,
  SERVERADMIN_ID,
  STYLE_BUTTONS,
  T,
} from '@ConstantsModule'
import { css } from '@emotion/css'
import { UserAPI, useAuth, useGeneralApi } from '@FeaturesModule'
import { yupResolver } from '@hookform/resolvers/yup'
import {
  FIELDS,
  SCHEMA,
} from '@modules/containers/Settings/ChangePassword/schema'
import { useSettingWrapper } from '@modules/containers/Settings/Wrapper'
import { Box } from '@mui/material'
import { ReactElement, useEffect, useMemo } from 'react'
import { FormProvider, useForm } from 'react-hook-form'

const styles = () => ({
  buttonPlace: css({
    textAlign: 'center',
  }),
})

/**
 * Section to change password.
 *
 * @returns {ReactElement} change password
 */
const ChangePassword = () => {
  const successMessageChangePassword = `${Tr(T.ChangePasswordSuccess)}`
  const { Legend, InternalWrapper } = useSettingWrapper()
  const classes = useMemo(() => styles())
  const { enqueueSuccess } = useGeneralApi()
  const { user = {} } = useAuth()
  const [changePassword, { isSuccess: isSuccessChangePassword }] =
    UserAPI.useChangePasswordMutation()

  const { handleSubmit, reset, setValue, ...methods } = useForm({
    reValidateMode: 'onSubmit',
    defaultValues: SCHEMA.default(),
    resolver: yupResolver(SCHEMA),
  })

  /**
   * Change the user's password.
   *
   * @param {object} formData - form data
   * @param {string} formData.password - Password
   */
  const handleChangePassword = async ({ password }) => {
    await changePassword({
      id: user.ID,
      password,
    })
    setValue('confirmPassword', '')
    reset()
  }

  useEffect(
    () =>
      isSuccessChangePassword && enqueueSuccess(successMessageChangePassword),
    [isSuccessChangePassword]
  )

  return (
    <Box component="form" onSubmit={handleSubmit(handleChangePassword)}>
      <Legend title={T.ChangePassword} />
      <InternalWrapper>
        <Box>
          <FormProvider {...methods}>
            <FormWithSchema cy="change-password-form" fields={FIELDS} />
          </FormProvider>
          <Box className={classes.buttonPlace}>
            <SubmitButton
              importance={STYLE_BUTTONS.IMPORTANCE.MAIN}
              size={STYLE_BUTTONS.SIZE.MEDIUM}
              type={STYLE_BUTTONS.TYPE.FILLED}
              data-cy={'change-password-button'}
              label={T.ChangePassword}
              disabled={
                user.ID === ONEADMIN_ID ||
                user.ID === SERVERADMIN_ID ||
                user.AUTH_DRIVER === AUTH_DRIVER.LDAP ||
                user.AUTH_DRIVER === AUTH_DRIVER.SAML
              }
            />
          </Box>
        </Box>
      </InternalWrapper>
    </Box>
  )
}

export { ChangePassword }
