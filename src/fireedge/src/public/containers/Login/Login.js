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

import React from 'react';
import {
  Box,
  Paper,
  Checkbox,
  Container,
  TextField,
  FormControlLabel
} from '@material-ui/core';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';

import { SignIn, Username, Password, keepLoggedIn } from 'client/constants';
import { Translate, Tr } from 'client/components/HOC';
import ButtonSubmit from 'client/components/FormControl/submitButton';
import useAuth from 'client/hooks/auth/useAuth';

import loginStyles from './styles';

function Login() {
  const classes = loginStyles();
  const { isLoading, login } = useAuth();

  const { register, handleSubmit, errors } = useForm(
    yup.object().shape({
      user: yup.string().required(),
      pass: yup.string().required(),
      remember: yup.boolean()
    })
  );

  const onSubmit = dataForm => {
    const { remember, ...user } = dataForm;
    login(user, remember);
  };

  return (
    <Container component="main" maxWidth="xs" className={classes.root}>
      <Paper variant="outlined" className={classes.paper}>
        <Box
          component="form"
          className={classes.form}
          onSubmit={handleSubmit(onSubmit)}
        >
          <img
            className={classes.logo}
            src="/static/logo.png"
            alt="Opennebula"
          />
          <TextField
            autoFocus
            fullWidth
            required
            name="user"
            error={Boolean(errors.user)}
            helperText={errors.user?.message}
            label={Tr(Username)}
            variant="outlined"
            inputRef={register}
            inputProps={{ 'data-cy': 'login-username' }}
          />
          <TextField
            fullWidth
            required
            name="pass"
            type="password"
            error={Boolean(errors.password)}
            helperText={errors.password?.message}
            label={Tr(Password)}
            variant="outlined"
            inputRef={register}
            inputProps={{ 'data-cy': 'login-password' }}
          />
          <FormControlLabel
            control={
              <Checkbox
                name="remember"
                defaultValue={false}
                color="primary"
                inputRef={register}
              />
            }
            label={Tr(keepLoggedIn)}
            labelPlacement="end"
          />
          <ButtonSubmit
            data-cy="login-button"
            isSubmitting={isLoading}
            label={<Translate word={SignIn} />}
          />
        </Box>
      </Paper>
    </Container>
  );
}

Login.propTypes = {};

Login.defaultProps = {};

export default Login;
