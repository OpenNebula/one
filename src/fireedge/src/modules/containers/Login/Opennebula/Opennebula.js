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

import { useTranslation } from '@ProvidersModule'
import { InteractiveGrid, OpenNebulaIcon } from '@ComponentsV2Module'
import { T } from '@ConstantsModule'
import { AuthAPI, useAuth, useAuthApi } from '@FeaturesModule'
import { Form } from '@modules/containers/Login/Opennebula/Form'
import { QrDisplay } from '@modules/containers/Login/Opennebula/QrDisplay'
import * as FORM_SCHEMA from '@modules/containers/Login/Opennebula/schema'
import {
  Box,
  Container,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import PropTypes from 'prop-types'
import { ReactElement, useEffect, useMemo, useRef, useState } from 'react'

import { styles } from '@modules/containers/Login/styles'

const STEPS = {
  USER_FORM: 0,
  REGISTER_2FA: 1,
  FA2_FORM: 2,
  GROUP_FORM: 3,
}

const getResponseErrorMessage = (error, fallback) => {
  const data = error?.data

  return (
    (typeof data === 'string' ? data : data?.message) ||
    error?.message ||
    fallback
  )
}

/**
 * Displays the login form and handles the login process.
 *
 * @param {object} props - Props
 * @param {object} props.data - User Auth data
 * @returns {ReactElement} The login form.
 */
export function OpenNebulaLoginHandler({ data = {} }) {
  const { translate } = useTranslation()
  const isMountedRef = useRef(true)
  const [isLoading, setIsLoading] = useState(false)
  const { remoteRedirect } = data

  const [MFAParams, setMFAParams] = useState(null)
  const [formError, setFormError] = useState(undefined)
  const [loginParams, setLoginParams] = useState({
    username: '',
    password: '',
    token: '',
  })

  const isMobile = useMediaQuery((themeMobile) =>
    themeMobile.breakpoints.only('xs')
  )

  const { setErrorMessage } = useAuthApi()
  const { error: authError, isLoginInProgress: needGroupToContinue } = useAuth()

  const [changeAuthGroup] = AuthAPI.useChangeAuthGroupMutation()

  const [login, loginState] = AuthAPI.useLoginMutation()
  const [getAuthUser] = AuthAPI.useLazyGetAuthUserQuery()

  const apiErrorMessage = getResponseErrorMessage(loginState.error, authError)
  const errorMessage =
    formError === null ? undefined : formError ?? apiErrorMessage

  const [step, setStep] = useState(() =>
    needGroupToContinue ? STEPS.GROUP_FORM : STEPS.USER_FORM
  )

  useEffect(
    () => () => {
      isMountedRef.current = false
    },
    []
  )

  const handleSubmit = async (formData) => {
    setIsLoading(true)
    setFormError(null)
    setErrorMessage(undefined)
    setLoginParams((prev) => ({ ...prev, ...formData }))
    try {
      const response = await login({ ...loginParams, ...formData }).unwrap()
      if (!isMountedRef.current) return

      const { isLoginInProgress, img, imgUrl, status } = response || {}

      switch (status) {
        case 'ok': {
          const authUserResponse = await getAuthUser()
          if (!isMountedRef.current) return

          if (authUserResponse?.error) {
            setFormError({
              field: formData?.tfatoken ? 'tfatoken' : ['user', 'token'],
              id: Date.now(),
              message: formData?.tfatoken ? T.InvalidTfa : T.LoginFailed,
            })

            break
          }

          if (isLoginInProgress) {
            setStep(STEPS.GROUP_FORM)
          }
          break
        }

        case 'need_2fa_setup': {
          setMFAParams({ imgSrc: imgUrl || img, ...formData })
          setStep(STEPS.REGISTER_2FA)
          break
        }

        case 'need_2fa_token': {
          setStep(STEPS.FA2_FORM)
          break
        }
      }
    } catch (error) {
      if (!isMountedRef.current) return

      const isTfaError = step === STEPS.FA2_FORM || !!formData?.tfatoken
      const message =
        error?.status === 401
          ? isTfaError
            ? T.InvalidTfa
            : T.WrongUsernamePassword
          : getResponseErrorMessage(error, T.LoginFailed)

      setErrorMessage(message)
      setFormError({
        field: isTfaError ? 'tfatoken' : ['user', 'token'],
        id: Date.now(),
        message,
      })
    } finally {
      if (isMountedRef.current) setIsLoading(false)
    }
  }

  const handleSubmitGroup = (dataForm) => {
    changeAuthGroup(dataForm)
  }

  const handleBack = () => {
    setStep(STEPS.USER_FORM)
    setFormError(null)
    setLoginParams({})
  }

  const theme = useTheme()
  const classes = useMemo(() => styles(theme), [theme])

  const renderFormStep = ({
    onBack = handleBack,
    onSubmit = handleSubmit,
    resolver,
    fields,
    errorField,
    additionalProps = {},
  }) => (
    <Form
      onBack={onBack}
      onSubmit={onSubmit}
      resolver={resolver}
      fields={fields}
      error={errorMessage}
      errorField={errorField}
      isLoading={isLoading}
      {...additionalProps}
    />
  )

  const renderUserStep = () =>
    renderFormStep({
      onBack: null,
      resolver: FORM_SCHEMA.FORM_USER_SCHEMA,
      fields: FORM_SCHEMA.FORM_USER_FIELDS,
      errorField: 'token',
      additionalProps: {
        remoteRedirect,
      },
    })

  const renderFa2Step = () =>
    renderFormStep({
      resolver: FORM_SCHEMA.FORM_2FA_SCHEMA,
      fields: FORM_SCHEMA.FORM_2FA_FIELDS,
      errorField: 'tfatoken',
    })

  const renderGroupStep = () =>
    renderFormStep({
      onSubmit: handleSubmitGroup,
      resolver: FORM_SCHEMA.FORM_GROUP_SCHEMA,
      fields: FORM_SCHEMA.FORM_GROUP_FIELDS,
    })

  const renderRegister2FAStep = () => <QrDisplay {...MFAParams} />

  const loginStepClass = {
    [STEPS.USER_FORM]: classes.loginUser,
    [STEPS.REGISTER_2FA]: classes.loginQr,
    [STEPS.FA2_FORM]: classes.login2fa,
    [STEPS.GROUP_FORM]: classes.loginUser,
  }[step]

  return (
    <Container
      className={classes.container}
      component="main"
      disableGutters={isMobile}
    >
      <InteractiveGrid data-cy="opennebula-brand-grid">
        <OpenNebulaIcon withText width={100} height={40} />
      </InteractiveGrid>

      <Box className={`${classes.login} ${loginStepClass}`}>
        {![STEPS.FA2_FORM, STEPS.REGISTER_2FA]?.includes(step) && (
          <Box data-login-title display="flex" overflow="visible" width="100%">
            <Typography className={classes.loginTitle} variant="h6">
              {translate(T.LogIn)}
            </Typography>
          </Box>
        )}

        <Box display="flex" overflow="visible" width="100%">
          {STEPS.USER_FORM === step && renderUserStep()}
          {STEPS.REGISTER_2FA === step && renderRegister2FAStep()}
          {STEPS.FA2_FORM === step && renderFa2Step()}
          {STEPS.GROUP_FORM === step && renderGroupStep()}
        </Box>
      </Box>
    </Container>
  )
}

OpenNebulaLoginHandler.propTypes = {
  data: PropTypes.shape({
    id: PropTypes.string,
    remoteRedirect: PropTypes.string,
  }),
}
OpenNebulaLoginHandler.displayName = 'OpenNebula'

export default OpenNebulaLoginHandler
