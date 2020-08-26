/* Copyright 2002-2019, OpenNebula Project, OpenNebula Systems                */
/*                                                                            */
/* Licensed under the Apache License, Version 2.0 (the "License"); you may    */
/* not use this file except in compliance with the License. You may obtain    */
/* a copy of the License at                                                   */
/*                                                                            */
/* http://www.apache.org/licenses/LICENSE-2.0                                 */
/*                                                                            */
/* Unless required by applicable law or agreed to in writing, software        */
/* distributed under the License is distributed on an "AS IS" BASIS,          */
/* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.   */
/* See the License for the specific language governing permissions and        */
/* limitations under the License.                                             */
/* -------------------------------------------------------------------------- */

import React, { useState } from 'react';
import {
  Paper,
  Box,
  Container,
  Slide,
  LinearProgress
} from '@material-ui/core';

import useAuth from 'client/hooks/useAuth';
import useOpennebula from 'client/hooks/useOpennebula';

import FormUser from 'client/containers/Login/FormUser';
import Form2fa from 'client/containers/Login/Form2fa';
import FormGroup from 'client/containers/Login/FormGroup';
import loginStyles from 'client/containers/Login/styles';

const STEP = {
  USER_FORM: 0,
  FA2_FORM: 1,
  GROUP_FORM: 2
};

function Login() {
  const classes = loginStyles();
  const [user, setUser] = useState(undefined);
  const [step, setStep] = useState(STEP.USER_FORM);
  const {
    isLoading,
    error,
    login,
    logout,
    getAuthInfo,
    setPrimaryGroup
  } = useAuth();
  const { groups } = useOpennebula();

  const handleSubmitUser = dataForm => {
    login({ ...user, ...dataForm }).then(data => {
      if (data?.token) {
        getAuthInfo().then(() => setStep(STEP.GROUP_FORM));
      } else {
        setStep(data ? STEP.FA2_FORM : step);
        setUser(data ? dataForm : user);
      }
    });
  };

  const handleSubmitGroup = dataForm => setPrimaryGroup(dataForm);

  const handleBack = () => {
    logout();
    setUser(undefined);
    setStep(STEP.USER_FORM);
  };

  return (
    <Container component="main" maxWidth="xs" className={classes.root}>
      {isLoading && <LinearProgress style={{ width: '100%' }} />}
      <Paper variant="outlined" className={classes.paper}>
        <img className={classes.logo} src="/static/logo.png" alt="Opennebula" />
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
              <FormGroup
                groups={groups}
                onBack={handleBack}
                onSubmit={handleSubmitGroup}
              />
            </Box>
          </Slide>
        </Box>
      </Paper>
    </Container>
  );
}

Login.propTypes = {};

Login.defaultProps = {};

export default Login;
