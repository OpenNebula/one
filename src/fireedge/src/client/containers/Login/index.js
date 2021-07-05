import React, { useMemo, useState } from 'react'

import { Paper, Box, Container, LinearProgress, useMediaQuery } from '@material-ui/core'

import { useFetch } from 'client/hooks'
import { useAuth, useAuthApi } from 'client/features/Auth'

import Logo from 'client/icons/logo'
import Form from 'client/containers/Login/Form'
import * as FORMS from 'client/containers/Login/schema'
import loginStyles from 'client/containers/Login/styles'

const STEPS = {
  USER_FORM: 0,
  FA2_FORM: 1,
  GROUP_FORM: 2
}

function Login () {
  const classes = loginStyles()
  const isMobile = useMediaQuery(theme => theme.breakpoints.only('xs'))

  const { error, isLoading: authLoading, isLoginInProgress: needGroupToContinue } = useAuth()

  const { login, getAuthUser, changeGroup, logout } = useAuthApi()
  const { fetchRequest: fetchLogin, loading: loginIsLoading } = useFetch(login)

  const [dataUserForm, setDataUserForm] = useState(undefined)
  const [step, setStep] = useState(
    () => needGroupToContinue ? STEPS.GROUP_FORM : STEPS.USER_FORM
  )

  const handleSubmitUser = async (dataForm) => {
    const response = await fetchLogin({ ...dataUserForm, ...dataForm })
    const { jwt, user, isLoginInProgress } = response || {}

    if (jwt && isLoginInProgress) {
      getAuthUser()
      setStep(STEPS.GROUP_FORM)
    } else if (!jwt && user?.ID) {
      setStep(STEPS.FA2_FORM)
      setDataUserForm(dataForm)
    }
  }

  const handleSubmitGroup = dataForm => changeGroup(dataForm)

  const handleBack = () => {
    logout()
    setDataUserForm(undefined)
    setStep(STEPS.USER_FORM)
  }

  const isLoading = loginIsLoading || authLoading

  return (
    <Container
      component="main"
      disableGutters={isMobile}
      maxWidth={isMobile ? 'lg' : 'xs'}
      className={classes.root}
    >
      {isLoading && <LinearProgress color='secondary' className={classes.loading} />}
      <Paper variant="outlined" className={classes.paper}>
        {useMemo(() => (
          <Logo width='100%' height={100} withText data-cy='opennebula-logo' />
        ), [])}
        <Box className={classes.wrapperForm}>
          {step === STEPS.USER_FORM && <Form
            transitionProps={{
              direction: 'right',
              in: step === STEPS.USER_FORM,
              enter: false
            }}
            onSubmit={handleSubmitUser}
            resolver={FORMS.FORM_USER_SCHEMA}
            fields={FORMS.FORM_USER_FIELDS}
            error={error}
            isLoading={isLoading}
          />}
          {step === STEPS.FA2_FORM && <Form
            transitionProps={{
              direction: 'left',
              in: step === STEPS.FA2_FORM
            }}
            onBack={handleBack}
            onSubmit={handleSubmitUser}
            resolver={FORMS.FORM_2FA_SCHEMA}
            fields={FORMS.FORM_2FA_FIELDS}
            error={error}
            isLoading={isLoading}
          />}
          {step === STEPS.GROUP_FORM && <Form
            transitionProps={{
              direction: 'left',
              in: step === STEPS.GROUP_FORM
            }}
            onBack={handleBack}
            onSubmit={handleSubmitGroup}
            resolver={FORMS.FORM_GROUP_SCHEMA}
            fields={FORMS.FORM_GROUP_FIELDS}
            error={error}
            isLoading={isLoading}
          />}
        </Box>
      </Paper>
    </Container>
  )
}

Login.propTypes = {}

Login.defaultProps = {}

export default Login
