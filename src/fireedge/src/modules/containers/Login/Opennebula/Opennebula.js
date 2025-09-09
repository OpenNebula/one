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
import { JWT_NAME, T } from '@ConstantsModule'
import { AuthAPI, AuthSlice, useAuth, useAuthApi } from '@FeaturesModule'
import { Form } from '@modules/containers/Login/Opennebula/Form'
import * as FORM_SCHEMA from '@modules/containers/Login/Opennebula/schema'
import {
  Box,
  Container,
  LinearProgress,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import { storage } from '@UtilsModule'
import PropTypes from 'prop-types'
import { ReactElement, useEffect, useMemo, useState } from 'react'
import { useDispatch } from 'react-redux'

import { styles } from '@modules/containers/Login/styles'

const { actions: authActions } = AuthSlice

const STEPS = {
  USER_FORM: 0,
  FA2_FORM: 1,
  GROUP_FORM: 2,
}

/**
 * Displays the login form and handles the login process.
 *
 * @param {object} props - Props
 * @param {object} props.data - User Auth data
 * @returns {ReactElement} The login form.
 */
export function OpenNebulaLoginHandler({ data = {} }) {
  const dispatch = useDispatch()
  const { remoteRedirect, jwt: userJWT } = data

  useEffect(() => {
    if (userJWT) {
      storage(JWT_NAME, userJWT)
      dispatch(authActions.changeJwt(userJWT))
    }
  }, [])

  const isMobile = useMediaQuery((themeMobile) =>
    themeMobile.breakpoints.only('xs')
  )

  const { logout, setErrorMessage } = useAuthApi()
  const { error: authError, isLoginInProgress: needGroupToContinue } = useAuth()

  const [changeAuthGroup, changeAuthGroupState] =
    AuthAPI.useChangeAuthGroupMutation()
  const [login, loginState] = AuthAPI.useLoginMutation()
  const isLoading = loginState.isLoading || changeAuthGroupState.isLoading
  const errorMessage = loginState.error?.data?.message ?? authError

  const [dataUserForm, setDataUserForm] = useState(undefined)
  const [step, setStep] = useState(() =>
    needGroupToContinue ? STEPS.GROUP_FORM : STEPS.USER_FORM
  )

  // Wrong username and password message
  const wrongUsernamePassword = Tr(T.WrongUsernamePassword)

  const handleSubmitUser = async (dataForm) => {
    try {
      const response = await login({ ...dataUserForm, ...dataForm }).unwrap()
      const { jwt, user, isLoginInProgress } = response || {}

      if (jwt && isLoginInProgress) {
        setStep(STEPS.GROUP_FORM)
      } else if (!jwt && user?.ID) {
        setStep(STEPS.FA2_FORM)
        setDataUserForm(dataForm)
      }
    } catch (error) {
      // If login request returns 401, show error message about username and password
      error?.status === 401 && setErrorMessage(wrongUsernamePassword)
    }
  }

  const handleSubmitGroup = (dataForm) => {
    changeAuthGroup(dataForm)
  }

  const handleBack = () => {
    logout()
    setDataUserForm(undefined)
    setStep(STEPS.USER_FORM)
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

        <Box display="flex" overflow="hidden">
          <Typography variant="h2" sx={{ margin: '3.5rem 0rem 0rem 0rem' }}>
            {Tr(T.LogIn)}
          </Typography>
        </Box>

        <Box display="flex" overflow="hidden">
          {step === STEPS.USER_FORM && (
            <Form
              transitionProps={{
                direction: 'right',
                in: step === STEPS.USER_FORM,
                enter: false,
              }}
              onSubmit={handleSubmitUser}
              resolver={FORM_SCHEMA.FORM_USER_SCHEMA}
              fields={FORM_SCHEMA.FORM_USER_FIELDS}
              error={errorMessage}
              isLoading={isLoading}
              remoteRedirect={remoteRedirect}
            />
          )}
          {step === STEPS.FA2_FORM && (
            <Form
              transitionProps={{
                direction: 'left',
                in: step === STEPS.FA2_FORM,
              }}
              onBack={handleBack}
              onSubmit={handleSubmitUser}
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
    jwt: PropTypes.string,
    id: PropTypes.string,
    remoteRedirect: PropTypes.string,
  }),
}
OpenNebulaLoginHandler.displayName = 'OpenNebula'

export default OpenNebulaLoginHandler
