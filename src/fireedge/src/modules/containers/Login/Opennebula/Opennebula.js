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

import { Box, Container, LinearProgress, useMediaQuery } from '@mui/material'
import { ReactElement, useState } from 'react'

import { useAuth, useAuthApi, AuthAPI } from '@FeaturesModule'

import { Tr, OpenNebulaLogo } from '@ComponentsModule'
import { T } from '@ConstantsModule'
import { Form } from '@modules/containers/Login/Opennebula/Form'
import * as FORM_SCHEMA from '@modules/containers/Login/Opennebula/schema'

const STEPS = {
  USER_FORM: 0,
  FA2_FORM: 1,
  GROUP_FORM: 2,
}

/**
 * Displays the login form and handles the login process.
 *
 * @returns {ReactElement} The login form.
 */
export function OpenNebulaLoginHandler() {
  const isMobile = useMediaQuery((theme) => theme.breakpoints.only('xs'))

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
      }}
    >
      <LinearProgress
        color="secondary"
        sx={{ visibility: isLoading ? 'visible' : 'hidden' }}
      />
      <Box
        sx={{
          p: 2,
          overflow: 'hidden',
          minHeight: 380,
          border: ({ palette }) => ({
            xs: 'none',
            sm: `1px solid ${palette.divider}`,
          }),
          borderRadius: ({ shape }) => shape.borderRadius / 2,
          height: { xs: 'calc(100vh - 4px)', sm: 'auto' },
          backgroundColor: { xs: 'transparent', sm: 'background.paper' },
        }}
      >
        <OpenNebulaLogo
          data-cy="opennebula-logo"
          height={100}
          width="100%"
          withText
        />

        <Box display="flex" py={2} px={1} overflow="hidden">
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

export default OpenNebulaLoginHandler
