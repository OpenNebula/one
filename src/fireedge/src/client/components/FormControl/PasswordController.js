import React, { memo, useState, useCallback } from 'react'
import PropTypes from 'prop-types'

import { InputAdornment, IconButton } from '@material-ui/core'
import { EyeEmpty as Visibility, EyeOff as VisibilityOff } from 'iconoir-react'

import { TextController } from 'client/components/FormControl'

const PasswordController = memo(({ fieldProps, ...props }) => {
  const [showPassword, setShowPassword] = useState(() => false)

  const handleClickShowPassword = useCallback(() => {
    setShowPassword(prev => !prev)
  }, [setShowPassword])

  return (
    <TextController
      {...props}
      type={showPassword ? 'text' : 'password'}
      fieldProps={{
        InputProps: {
          endAdornment: <InputAdornment position="end">
            <IconButton
              aria-label="toggle password visibility"
              onClick={handleClickShowPassword}
            >
              {showPassword ? <Visibility /> : <VisibilityOff />}
            </IconButton>
          </InputAdornment>
        },
        ...fieldProps
      }}
    />
  )
},
(prevProps, nextProps) =>
  prevProps.error === nextProps.error && prevProps.type === nextProps.type
)

PasswordController.propTypes = {
  fieldProps: PropTypes.object
}

PasswordController.defaultProps = {
  fieldProps: undefined
}

PasswordController.displayName = 'PasswordController'

export default PasswordController
