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

import { OpenNebulaLogo, Tr } from '@ComponentsModule'
import { T } from '@ConstantsModule'
import { AuthAPI, useAuth, useAuthApi } from '@FeaturesModule'
import { Form } from '@modules/containers/Login/Opennebula/Form'
import { QrDisplay } from '@modules/containers/Login/Opennebula/QrDisplay'
import * as FORM_SCHEMA from '@modules/containers/Login/Opennebula/schema'
import {
  Box,
  Container,
  LinearProgress,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import PropTypes from 'prop-types'
import { ReactElement, useMemo, useState } from 'react'

import { styles } from '@modules/containers/Login/styles'

const STEPS = {
  USER_FORM: 0,
  REGISTER_2FA: 1,
  FA2_FORM: 2,
  GROUP_FORM: 3,
}

/**
 * Displays the login form and handles the login process.
 *
 * @param {object} props - Props
 * @param {object} props.data - User Auth data
 * @returns {ReactElement} The login form.
 */
export function OpenNebulaLoginHandler({ data = {} }) {
  const [isLoading, setIsLoading] = useState(false)
  const { remoteRedirect } = data

  const [MFAParams, setMFAParams] = useState(null)
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

  const errorMessage = loginState.error?.data?.message ?? authError

  const [step, setStep] = useState(() =>
    needGroupToContinue ? STEPS.GROUP_FORM : STEPS.USER_FORM
  )

  // Wrong username and password message
  const wrongUsernamePassword = Tr(T.WrongUsernamePassword)

  const handleSubmit = async (formData) => {
    setIsLoading(true)
    setLoginParams((prev) => ({ ...prev, ...formData }))
    try {
      const response = await login({ ...loginParams, ...formData }).unwrap()
      await getAuthUser()
      const { isLoginInProgress, imgUrl, status } = response || {}

      switch (status) {
        case 'ok': {
          if (isLoginInProgress) {
            setStep(STEPS.GROUP_FORM)
          }
          break
        }

        case 'need_2fa_setup': {
          setMFAParams({ imgSrc: imgUrl, ...formData })
          setStep(STEPS.REGISTER_2FA)
          break
        }

        case 'need_2fa_token': {
          setStep(STEPS.FA2_FORM)
          break
        }
      }
    } catch (error) {
      if (error?.status === 401) {
        setErrorMessage(wrongUsernamePassword)
      } else {
        setErrorMessage(error?.data?.message || 'Login failed')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmitGroup = (dataForm) => {
    changeAuthGroup(dataForm)
  }

  const handleBack = () => {
    setStep(STEPS.USER_FORM)
    setLoginParams({})
  }

  const theme = useTheme()
  const classes = useMemo(() => styles(theme), [theme])

  return (
    <Container
      component="main"
      disableGutters={isMobile}
      maxWidth={isMobile ? 'lg' : 'xs'}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        height: '100vh',
        alignItems: 'center',
      }}
    >
      <LinearProgress sx={{ visibility: isLoading ? 'visible' : 'hidden' }} />
      <Box className={classes.login}>
        <OpenNebulaLogo
          data-cy="opennebula-logo"
          height={'3rem'}
          width="100%"
          withText
        />

        {![STEPS.FA2_FORM, STEPS.REGISTER_2FA]?.includes(step) && (
          <Box display="flex" overflow="hidden">
            <Typography variant="h2" sx={{ margin: '3.5rem 0rem 0rem 0rem' }}>
              {Tr(T.LogIn)}
            </Typography>
          </Box>
        )}

        <Box display="flex" overflow="hidden">
          {step === STEPS.USER_FORM && (
            <Form
              transitionProps={{
                direction: 'right',
                in: step === STEPS.USER_FORM,
                enter: false,
              }}
              onSubmit={handleSubmit}
              resolver={FORM_SCHEMA.FORM_USER_SCHEMA}
              fields={FORM_SCHEMA.FORM_USER_FIELDS}
              error={errorMessage}
              isLoading={isLoading}
              remoteRedirect={remoteRedirect}
            />
          )}
          {step === STEPS.REGISTER_2FA && <QrDisplay {...MFAParams} />}

          {step === STEPS.FA2_FORM && (
            <Form
              transitionProps={{
                direction: 'left',
                in: step === STEPS.FA2_FORM,
              }}
              onBack={handleBack}
              onSubmit={handleSubmit}
              resolver={FORM_SCHEMA.FORM_2FA_SCHEMA}
              fields={FORM_SCHEMA.FORM_2FA_FIELDS}
              error={errorMessage}
              isLoading={isLoading}
            />
          )}

          {step === STEPS.GROUP_FORM && (
            <Form
              transitionProps={{
                direction: 'left',
                in: step === STEPS.GROUP_FORM,
              }}
              onBack={handleBack}
              onSubmit={handleSubmitGroup}
              resolver={FORM_SCHEMA.FORM_GROUP_SCHEMA}
              fields={FORM_SCHEMA.FORM_GROUP_FIELDS}
              error={errorMessage}
              isLoading={isLoading}
            />
          )}
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
