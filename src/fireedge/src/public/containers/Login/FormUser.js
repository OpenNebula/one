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
import { Box, Checkbox, TextField, FormControlLabel } from '@material-ui/core';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers';
import * as yup from 'yup';

import { SignIn, Username, Password, keepLoggedIn } from 'client/constants';
import { Translate, Tr } from 'client/components/HOC';
import ButtonSubmit from 'client/components/FormControl/SubmitButton';
import ErrorHelper from 'client/components/FormControl/ErrorHelper';

function FormUser({ classes, onSubmit, error }) {
  const { register, handleSubmit, errors } = useForm({
    reValidateMode: 'onSubmit',
    resolver: yupResolver(
      yup.object().shape({
        user: yup.string().required('Username is a required field'),
        pass: yup.string().required('Password is a required field'),
        remember: yup.boolean()
      })
    )
  });

  const userError = Boolean(errors.user || error);
  const passError = Boolean(errors.pass);

  return (
    <Box
      component="form"
      className={classes?.form}
      onSubmit={handleSubmit(onSubmit)}
    >
      <TextField
        autoFocus
        fullWidth
        required
        name="user"
        label={Tr(Username)}
        variant="outlined"
        inputRef={register}
        inputProps={{ 'data-cy': 'login-username' }}
        error={userError}
        helperText={
          userError && <ErrorHelper label={errors.user?.message || error} />
        }
        FormHelperTextProps={{ 'data-cy': 'login-username-error' }}
      />
      <TextField
        fullWidth
        required
        name="pass"
        type="password"
        autoComplete="current-password"
        label={Tr(Password)}
        variant="outlined"
        inputRef={register}
        inputProps={{ 'data-cy': 'login-password' }}
        error={passError}
        helperText={passError && <ErrorHelper label={errors.pass?.message} />}
        FormHelperTextProps={{ 'data-cy': 'login-password-error' }}
      />
      <FormControlLabel
        control={
          <Checkbox
            name="remember"
            defaultValue={false}
            color="primary"
            inputRef={register}
            inputProps={{ 'data-cy': 'login-remember' }}
          />
        }
        label={Tr(keepLoggedIn)}
        labelPlacement="end"
      />
      <ButtonSubmit
        data-cy="login-button"
        isSubmitting={false}
        label={<Translate word={SignIn} />}
      />
    </Box>
  );
}

FormUser.propTypes = {};

FormUser.defaultProps = {};

export default FormUser;
