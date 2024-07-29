/* ------------------------------------------------------------------------- *
 * Copyright 2002-2024, OpenNebula Project, OpenNebula Systems               *
 *                                                                           *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may   *
 * not use this file except in compliance with the License. You may obtain   *
 * a copy of the License at                                                  *
 *                                                                           *
 * http://www.apache.org/licenses/LICENSE-2.0                                *
 *                                                                           *
 * Unless required by applicable law or agreed to in writing, software       *
 * distributed under the License is distributed on an "AS IS" BASIS,         *
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  *
 * See the License for the specific language governing permissions and       *
 * limitations under the License.                                            *
 * ------------------------------------------------------------------------- */
import { memo, useState, useCallback } from 'react'
import PropTypes from 'prop-types'

import { InputAdornment, IconButton } from '@mui/material'
import { EyeEmpty as Visibility, EyeOff as VisibilityOff } from 'iconoir-react'

import { TextController } from 'client/components/FormControl'

const PasswordController = memo(
  ({ fieldProps, ...props }) => {
    const [showPassword, setShowPassword] = useState(() => false)

    const handleClickShowPassword = useCallback(() => {
      setShowPassword((prev) => !prev)
    }, [setShowPassword])

    return (
      <TextController
        {...props}
        type={showPassword ? 'text' : 'password'}
        fieldProps={{
          InputProps: {
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label="toggle password visibility"
                  onClick={handleClickShowPassword}
                >
                  {showPassword ? <Visibility /> : <VisibilityOff />}
                </IconButton>
              </InputAdornment>
            ),
          },
          ...fieldProps,
        }}
      />
    )
  },
  (prevProps, nextProps) => prevProps.type === nextProps.type
)

PasswordController.propTypes = {
  fieldProps: PropTypes.object,
}

PasswordController.defaultProps = {
  fieldProps: undefined,
}

PasswordController.displayName = 'PasswordController'

export default PasswordController
