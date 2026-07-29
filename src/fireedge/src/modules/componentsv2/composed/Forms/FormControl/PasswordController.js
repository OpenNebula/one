/* ------------------------------------------------------------------------- *
 * Copyright 2002-2026, OpenNebula Project, OpenNebula Systems               *
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
import PropTypes from 'prop-types'
import { memo, useCallback, useState } from 'react'

import { InputAdornment } from '@mui/material'
import {
  EyeSvg as Visibility,
  CloseEyeSvg as VisibilityOff,
} from '@modules/componentsv2/composed/Forms/FormControl/PasswordVisibilitySvgIcons'

import { TextController } from '@modules/componentsv2/composed/Forms/FormControl/TextController'
import { Button } from '@modules/componentsv2/primitives/Buttons'

export const PasswordController = memo(
  ({ fieldProps, ...props }) => {
    const [showPassword, setShowPassword] = useState(() => false)

    const handleClickShowPassword = useCallback(() => {
      setShowPassword((prev) => !prev)
    }, [setShowPassword])

    return (
      <TextController
        {...props}
        type={showPassword ? 'text' : 'password'}
        sx={{
          ...fieldProps?.sx,
        }}
        fieldProps={{
          ...fieldProps,
          InputProps: {
            ...fieldProps?.InputProps,
            endAdornment: (
              <InputAdornment position="end">
                <Button
                  iconOnly={showPassword ? <Visibility /> : <VisibilityOff />}
                  onClick={handleClickShowPassword}
                  type="transparent"
                  htmlType="button"
                  aria-label="toggle password visibility"
                  aria-pressed={showPassword}
                  sx={{
                    minWidth: 0,
                    width: 32,
                    height: 32,
                    p: 0,
                    marginRight: '4px',
                    transition: 'none',
                    border: 'none',
                    bgcolor: 'transparent',
                    color: 'icon.primary',
                    '.textfield-input-wrapper:hover &': {
                      border: 'none',
                      bgcolor: 'transparent',
                      color: 'text.actionHover2',
                    },
                    '.textfield-input-wrapper:has(.textfield-input:focus) &': {
                      color: 'icon.primary',
                    },
                    '&:focus-visible': {
                      border: 'none',
                    },
                    '& svg': {
                      width: 16,
                      height: 16,
                    },
                  }}
                />
              </InputAdornment>
            ),
          },
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
