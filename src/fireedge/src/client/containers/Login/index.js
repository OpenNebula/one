/* ------------------------------------------------------------------------- *
 * Copyright 2002-2022, OpenNebula Project, OpenNebula Systems               *
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

import { ReactElement, useState, memo } from 'react'
import PropTypes from 'prop-types'
import {
  Box,
  Container,
  LinearProgress,
  Link,
  useMediaQuery,
} from '@mui/material'

import {
  useLoginMutation,
  useChangeAuthGroupMutation,
} from 'client/features/AuthApi'
import { useAuth, useAuthApi } from 'client/features/Auth'
import { useGeneral } from 'client/features/General'

import Form from 'client/containers/Login/Form'
import * as FORMS from 'client/containers/Login/schema'
import { OpenNebulaLogo } from 'client/components/Icons'
import { Translate } from 'client/components/HOC'
import { sentenceCase } from 'client/utils'
import { T, APPS, APP_URL, APPS_WITH_ONE_PREFIX } from 'client/constants'

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
function Login() {
  const isMobile = useMediaQuery((theme) => theme.breakpoints.only('xs'))

  const { logout } = useAuthApi()
  const { error: authError, isLoginInProgress: needGroupToContinue } = useAuth()

  const { appTitle } = useGeneral()

  const [changeAuthGroup, changeAuthGroupState] = useChangeAuthGroupMutation()
  const [login, loginState] = useLoginMutation()
  const isLoading = loginState.isLoading || changeAuthGroupState.isLoading
  const errorMessage = loginState.error?.data?.message ?? authError

  const [dataUserForm, setDataUserForm] = useState(undefined)
  const [step, setStep] = useState(() =>
    needGroupToContinue ? STEPS.GROUP_FORM : STEPS.USER_FORM
  )

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
    } catch {}
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

        {APPS?.filter((app) => app !== `${appTitle}`.toLowerCase())?.map(
          (app) => (
            <AppLink key={app} app={app} />
          )
        )}
      </Box>
    </Container>
  )
}

const AppLink = memo(({ app }) => {
  const name = APPS_WITH_ONE_PREFIX.includes(app)
    ? `One${sentenceCase(app)}`
    : sentenceCase(app)

  return (
    <Link
      key={app}
      href={`${APP_URL}/${app}`}
      variant="caption"
      color="text.secondary"
      padding={1}
    >
      <Translate word={T.TakeMeToTheAppGui} values={name} />
    </Link>
  )
})

AppLink.displayName = 'AppLink'
AppLink.propTypes = { app: PropTypes.string.isRequired }

export default Login
