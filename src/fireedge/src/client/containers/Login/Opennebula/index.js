/* ------------------------------------------------------------------------- *
 * Copyright 2002-2024, OpenNebula Project, OpenNebula Systems               *
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
  Container,
  LinearProgress,
  Link,
  useMediaQuery,
} from '@mui/material'
import { ReactElement, useMemo, useState } from 'react'

import { useAuth, useAuthApi } from 'client/features/Auth'
import { useGeneral } from 'client/features/General'
import {
  useChangeAuthGroupMutation,
  useLoginMutation,
} from 'client/features/OneApi/auth'

import { Translate, Tr } from 'client/components/HOC'
import { OpenNebulaLogo } from 'client/components/Icons'
import { APPS, APPS_WITH_ONE_PREFIX, APP_URL, T } from 'client/constants'
import Form from 'client/containers/Login/Opennebula/Form'
import * as FORMS from 'client/containers/Login/Opennebula/schema'
import { sentenceCase } from 'client/utils'

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
function OpenNebula() {
  const isMobile = useMediaQuery((theme) => theme.breakpoints.only('xs'))

  const { logout, setErrorMessage } = useAuthApi()
  const { error: authError, isLoginInProgress: needGroupToContinue } = useAuth()

  const [changeAuthGroup, changeAuthGroupState] = useChangeAuthGroupMutation()
  const [login, loginState] = useLoginMutation()
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
          minHeight: 440,
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
              resolver={FORMS.FORM_USER_SCHEMA}
              fields={FORMS.FORM_USER_FIELDS}
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
              resolver={FORMS.FORM_2FA_SCHEMA}
              fields={FORMS.FORM_2FA_FIELDS}
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
              resolver={FORMS.FORM_GROUP_SCHEMA}
              fields={FORMS.FORM_GROUP_FIELDS}
              error={errorMessage}
              isLoading={isLoading}
            />
          )}
        </Box>

        {useMemo(() => STEPS.USER_FORM === step && <AppLinks />, [step])}
      </Box>
    </Container>
  )
}

const AppLinks = () => {
  const { appTitle } = useGeneral()
  const otherApps = APPS.filter((app) => app !== `${appTitle}`.toLowerCase())

  if (otherApps?.length === 0) {
    return null
  }

  return otherApps.map((app) => (
    <Link
      key={app}
      data-cy={`goto-${app}`.toLowerCase()}
      href={`${APP_URL}/${app}`.toLowerCase()}
      variant="caption"
      color="text.secondary"
      padding={1}
    >
      <Translate
        word={T.TakeMeToTheAppGui}
        values={
          APPS_WITH_ONE_PREFIX.includes(app)
            ? `One${sentenceCase(app)}`
            : sentenceCase(app)
        }
      />
    </Link>
  ))
}

export default OpenNebula
