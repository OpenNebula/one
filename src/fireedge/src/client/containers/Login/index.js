import React, { useState } from 'react'
import {
  Paper,
  Box,
  Container,
  Slide,
  LinearProgress,
  useMediaQuery
} from '@material-ui/core'

import useAuth from 'client/hooks/useAuth'

import FormUser from 'client/containers/Login/Forms/FormUser'
import Form2fa from 'client/containers/Login/Forms/Form2fa'
import FormGroup from 'client/containers/Login/Forms/FormGroup'
import loginStyles from 'client/containers/Login/styles'
import Logo from 'client/icons/logo'
import { ONEADMIN_ID } from 'client/constants'

const STEP = {
  USER_FORM: 0,
  FA2_FORM: 1,
  GROUP_FORM: 2
}

function Login () {
  const classes = loginStyles()
  const isMobile = useMediaQuery(theme => theme.breakpoints.only('xs'))
  const [user, setUser] = useState(undefined)
  const [step, setStep] = useState(STEP.USER_FORM)
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
          data?.id !== ONEADMIN_ID && setStep(STEP.GROUP_FORM)
        })
      } else {
        setStep(data ? STEP.FA2_FORM : step)
        setUser(data ? dataForm : user)
      }
    })
  }

  const handleSubmitGroup = dataForm => setPrimaryGroup(dataForm)

  const handleBack = () => {
    logout()
    setUser(undefined)
    setStep(STEP.USER_FORM)
  }

  return (
    <Container
      component="main"
      disableGutters={isMobile}
      maxWidth={isMobile ? 'lg' : 'xs'}
      className={classes.root}
    >
      {isLoading && <LinearProgress className={classes.loading} />}
      <Paper variant="outlined" className={classes.paper}>
        <Logo width="100%" height={100} withText viewBox="140 140 380 360" />
        <Box className={classes.wrapper}>
          <Slide
            direction="right"
            timeout={{ enter: 400 }}
            in={step === STEP.USER_FORM}
            appear={false}
            mountOnEnter
            unmountOnExit
          >
            <Box style={{ opacity: isLoading ? 0.7 : 1 }}>
              <FormUser onSubmit={handleSubmitUser} error={error} />
            </Box>
          </Slide>
        </Box>
        <Box>
          <Slide
            direction="left"
            timeout={{ enter: 400 }}
            in={step === STEP.FA2_FORM}
            mountOnEnter
            unmountOnExit
          >
            <Box style={{ opacity: isLoading ? 0.7 : 1 }}>
              <Form2fa
                onBack={handleBack}
                onSubmit={handleSubmitUser}
                error={error}
              />
            </Box>
          </Slide>
        </Box>
        <Box className={classes.wrapper}>
          <Slide
            direction="left"
            timeout={{ enter: 400 }}
            in={step === STEP.GROUP_FORM}
            mountOnEnter
            unmountOnExit
          >
            <Box style={{ opacity: isLoading ? 0.7 : 1 }}>
              <FormGroup onBack={handleBack} onSubmit={handleSubmitGroup} />
            </Box>
          </Slide>
        </Box>
      </Paper>
    </Container>
  )
}

Login.propTypes = {}

Login.defaultProps = {}

export default Login
