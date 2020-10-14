import React from 'react'
import { func } from 'prop-types'

import { Box, Button } from '@material-ui/core'
import { useForm, Controller } from 'react-hook-form'

import GroupSelect from 'client/components/FormControl/GroupSelect'
import ButtonSubmit from 'client/components/FormControl/SubmitButton'
import { Tr } from 'client/components/HOC'
import loginStyles from 'client/containers/Login/styles'
import { Next } from 'client/constants/translates'

function FormGroup ({ onBack, onSubmit }) {
  const classes = loginStyles()
  const { control, handleSubmit } = useForm()

  return (
    <Box
      component="form"
      className={classes.form}
      onSubmit={handleSubmit(onSubmit)}
    >
      <Controller as={GroupSelect} name="group" control={control} />
      <Button onClick={onBack}>Logout</Button>
      <ButtonSubmit
        data-cy="login-group-button"
        isSubmitting={false}
        label={Tr(Next)}
      />
    </Box>
  )
}

FormGroup.propTypes = {
  onBack: func.isRequired,
  onSubmit: func.isRequired
}

FormGroup.defaultProps = {
  onBack: () => undefined,
  onSubmit: () => undefined
}

FormGroup.propTypes = {}

FormGroup.defaultProps = {}

export default FormGroup
