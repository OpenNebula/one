import React, { useMemo, useState } from 'react'

import { Paper, Box, Container, LinearProgress, useMediaQuery } from '@material-ui/core'

import { useAuth } from 'client/hooks'
import Logo from 'client/icons/logo'
import { ONEADMIN_ID } from 'client/constants'

import {
  FORM_USER_FIELDS,
  FORM_USER_SCHEMA,
  FORM_2FA_FIELDS,
  FORM_2FA_SCHEMA,
  FORM_GROUP_FIELDS,
  FORM_GROUP_SCHEMA
} from 'client/containers/Login/schema'
import Form from 'client/containers/Login/Form'
import loginStyles from 'client/containers/Login/styles'

const STEPS = {
  USER_FORM: 0,
  FA2_FORM: 1,
  GROUP_FORM: 2
}

function Login () {
  const classes = loginStyles()
  const isMobile = useMediaQuery(theme => theme.breakpoints.only('xs'))
  const [user, setUser] = useState(undefined)
  const [step, setStep] = useState(STEPS.USER_FORM)
  const {
    isLoading,
    error,
    login,
    logout,
    getAuthInfo,
    setPrimaryGroup
  } = useAuth()

  const handleSubmitUser = dataForm => {
    login({ ...user, ...dataForm }).then(data => {
      if (data?.token) {
        getAuthInfo().then(() => {
          data?.id !== ONEADMIN_ID && setStep(STEPS.GROUP_FORM)
        })
      } else {
        setStep(data ? STEPS.FA2_FORM : step)
        setUser(data ? dataForm : user)
      }
    })
  }

  const handleSubmitGroup = dataForm => setPrimaryGroup(dataForm)

  const handleBack = () => {
    logout()
    setUser(undefined)
    setStep(STEPS.USER_FORM)
  }

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
          <Logo width="100%" height={100} withText viewBox="140 140 380 360" data-cy="opennebula-logo" />
        ), [])}
        <Box className={classes.wrapperForm}>
          {step === STEPS.USER_FORM && <Form
            transitionProps={{
              direction: 'right',
              in: step === STEPS.USER_FORM,
              appear: false
            }}
            onSubmit={handleSubmitUser}
            resolver={FORM_USER_SCHEMA}
            fields={FORM_USER_FIELDS}
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
            resolver={FORM_2FA_SCHEMA}
            fields={FORM_2FA_FIELDS}
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
            resolver={FORM_GROUP_SCHEMA}
            fields={FORM_GROUP_FIELDS}
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
