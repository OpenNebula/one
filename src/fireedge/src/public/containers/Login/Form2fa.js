import React from 'react';
import { func, string } from 'prop-types';

import { Box, Button, TextField } from '@material-ui/core';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers';
import * as yup from 'yup';

import { Token2FA, Next } from 'client/constants';
import loginStyles from 'client/containers/Login/styles';

import { Tr } from 'client/components/HOC';
import ButtonSubmit from 'client/components/FormControl/SubmitButton';
import ErrorHelper from 'client/components/FormControl/ErrorHelper';

const Form2fa = ({ onBack, onSubmit, error }) => {
  const classes = loginStyles();

  const { register, handleSubmit, errors } = useForm({
    reValidateMode: 'onSubmit',
    resolver: yupResolver(
      yup.object().shape({
        token: yup.string().required('Authenticator is a required field')
      })
    )
  });

  const tokenError = Boolean(errors.token || error);

  return (
    <Box
      component="form"
      className={classes.form}
      onSubmit={handleSubmit(onSubmit)}
    >
      <TextField
        autoFocus
        fullWidth
        required
        name="token"
        label={Tr(Token2FA)}
        variant="outlined"
        inputRef={register}
        inputProps={{ 'data-cy': 'login-token' }}
        error={tokenError}
        helperText={
          tokenError && <ErrorHelper label={errors.token?.message || error} />
        }
        FormHelperTextProps={{ 'data-cy': 'login-username-error' }}
      />
      <Box>
        <Button onClick={onBack} color="primary">
          Back
        </Button>
        <ButtonSubmit
          data-cy="login-2fa-button"
          isSubmitting={false}
          label={Tr(Next)}
        />
      </Box>
    </Box>
  );
};

Form2fa.propTypes = {
  onBack: func.isRequired,
  onSubmit: func.isRequired,
  error: string
};

Form2fa.defaultProps = {
  onBack: () => undefined,
  onSubmit: () => undefined,
  error: null
};

export default Form2fa;
