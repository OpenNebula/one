import React from 'react';

import { Box, Button, TextField } from '@material-ui/core';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers';
import * as yup from 'yup';

import { Token2FA } from 'client/constants';
import { Tr } from 'client/components/HOC';
import ButtonSubmit from 'client/components/FormControl/SubmitButton';
import ErrorHelper from 'client/components/FormControl/ErrorHelper';

const Form2fa = ({ classes, onBack, onSubmit, error }) => {
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
      className={classes?.form}
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
          label="Next"
        />
      </Box>
    </Box>
  );
};

export default Form2fa;
