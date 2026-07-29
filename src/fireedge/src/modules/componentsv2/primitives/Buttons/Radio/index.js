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

import { Box, FormControlLabel, IconButton } from '@mui/material'
import { forwardRef, useState, Component } from 'react'
import { getStyles } from '@modules/componentsv2/primitives/Buttons/Radio/styles'
import PropTypes from 'prop-types'
import { useTranslation } from '@ProvidersModule'

/**
 * @param {object} root0 - Params
 * @param {Array} root0.options - List of options [{text,value}]
 * @param {Function} root0.onClick - OnClick handler when value is selected
 * @param {string} root0.size - Circle size
 * @param {string} root0.direction - Direction of radio buttons
 * @returns {Component} - Custom MUI Button component
 */
export const RadioButton = forwardRef(
  (
    {
      options = [],
      onClick = () => {},
      size = 'small',
      direction = 'row',
      ...opts
    },
    ref
  ) => {
    const { translate } = useTranslation()
    const [selected, setSelected] = useState(null)

    /* eslint-disable-next-line jsdoc/require-jsdoc */
    const handleSelect = (value, args) => {
      setSelected(value)
      onClick?.(value, args)
    }

    return (
      <Box
        sx={(theme) => getStyles({ theme, size, direction })}
        ref={ref}
        {...opts}
      >
        {[].concat(options)?.map(({ text, value }) => (
          <FormControlLabel
            key={value}
            value={value}
            label={translate(text)}
            className={'radiogroup-container'}
            control={
              <IconButton
                aria-label={`${translate('select')} ${translate(text)}`}
                disableFocusRipple
                disableRipple
                onClick={(...args) => handleSelect(value, args)}
              >
                <Box
                  className={`radiocircle${
                    value === selected ? ' selected' : ''
                  }`}
                />
              </IconButton>
            }
          />
        ))}
      </Box>
    )
  }
)

const RadioButtonPropTypes = {
  options: PropTypes.array,
  onClick: PropTypes.func,
  size: PropTypes.string,
  direction: PropTypes.string,
}

RadioButton.propTypes = RadioButtonPropTypes

RadioButton.displayName = 'RadioButton'
