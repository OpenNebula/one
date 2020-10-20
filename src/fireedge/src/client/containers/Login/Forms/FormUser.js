import React from 'react'
import { func, string } from 'prop-types'
import { Box, Checkbox, TextField, FormControlLabel } from '@material-ui/core'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers'
import * as yup from 'yup'

import {
  SignIn,
  Username,
  Password,
  KeepLoggedIn
} from 'client/constants/translates'
import { Tr } from 'client/components/HOC'
import ButtonSubmit from 'client/components/FormControl/SubmitButton'
import ErrorHelper from 'client/components/FormControl/ErrorHelper'
import loginStyles from 'client/containers/Login/styles'

function FormUser ({ onSubmit, error }) {
  const classes = loginStyles()

  const { register, handleSubmit, errors } = useForm({
    reValidateMode: 'onSubmit',
    resolver: yupResolver(
      yup.object().shape({
        user: yup.string().required('Username is a required field'),
        token: yup.string().required('Password is a required field'),
        remember: yup.boolean()
      })
    )
  })

  const userError = Boolean(errors.user || error)
  const passError = Boolean(errors.pass)

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
        name="user"
        autoComplete="username"
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
        name="token"
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
        label={Tr(KeepLoggedIn)}
        labelPlacement="end"
      />
      <ButtonSubmit
        data-cy="login-button"
        isSubmitting={false}
        label={Tr(SignIn)}
        className={classes.submit}
      />
    </Box>
  )
}

FormUser.propTypes = {
  onSubmit: func.isRequired,
  error: string
}

FormUser.defaultProps = {
  onSubmit: () => undefined,
  error: null
}

export default FormUser
