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

import {
  Box,
  FormControlLabel,
  Switch as MUISwitch,
  useTheme,
} from '@mui/material'
import { forwardRef, Component } from 'react'
import { useControllableState } from '@HooksModule'
import { getStyles } from '@modules/componentsv2/primitives/Buttons/Switch/Default/styles'
import { ThumbSvg } from '@modules/componentsv2/primitives/Buttons/Switch/Default/thumbSvg'
import { Tooltip } from '@modules/componentsv2/primitives/Tooltip/Default'
import { HelpCircle } from 'iconoir-react'
import PropTypes from 'prop-types'
import { useTranslation } from '@ProvidersModule'

const getDimensions = ({ scale, size }) => {
  const sizeMap = {
    switchRoot: {
      small: { height: scale[550], width: 36 },
      medium: { height: scale[600], width: 46 },
    },
    switchKnob: {
      small: { height: scale[500], width: scale[500] },
      medium: { height: scale[550], width: scale[550] },
    },
  }

  const root = sizeMap.switchRoot?.[size] ?? sizeMap?.switchRoot?.medium
  const knob = sizeMap.switchKnob?.[size] ?? sizeMap?.switchKnob?.medium

  const insetV = (root.height - knob.height) / 2
  const insetH = (root.height - knob.height) / 2
  const checkedTranslateX = root.width - knob.width - insetH * 2

  return {
    root: { height: `${root.height}px`, width: `${root.width}px` },
    knob: { height: knob.height, width: knob.width },
    insetV: `${insetV}px`,
    insetH: `${insetH}px`,
    checkedTranslateX: `${checkedTranslateX}px`,
  }
}

/**
 * @param {object} root0 - Params
 * @param {string} root0.size - Size of the switch
 * @param {string} root0.label - Label
 * @param {string} root0.tooltip - Tooltip
 * @returns {Component} - Custom MUI Switch component
 */
export const Switch = forwardRef(
  (
    {
      size = 'medium',
      label = '',
      tooltip,
      isDisabled = false,
      isChecked,
      onChange,
      switchProps = {},
      inputProps,
      ...opts
    },
    ref
  ) => {
    const { translate } = useTranslation()
    const theme = useTheme()
    const hasLabel = !!label
    const { knob, ...dimensions } = getDimensions({ scale: theme.scale, size })
    const { inputProps: switchInputProps, ...restSwitchProps } = switchProps

    const [isCheckedInternal, setIsCheckedInternal] = useControllableState({
      value: isChecked,
      defaultValue: isChecked ?? false,
      onChange,
    })

    return (
      <Box
        sx={getStyles({ theme, size, dimensions, hasLabel })}
        ref={ref}
        {...opts}
      >
        <FormControlLabel
          label={typeof label === 'string' ? translate(label) : label}
          className={'switch-container'}
          control={
            <MUISwitch
              disableFocusRipple
              disableRipple
              disableTouchRipple
              disabled={isDisabled}
              checked={isCheckedInternal}
              icon={<ThumbSvg knob={knob} />}
              checkedIcon={<ThumbSvg knob={knob} />}
              classes={{
                root: 'switch-root',
                switchBase: 'switch-base',
                track: 'switch-track',
                input: 'switch-input',
              }}
              {...restSwitchProps}
              inputProps={{ ...switchInputProps, ...inputProps }}
              onChange={(_, val) => {
                const next = isCheckedInternal === null ? false : val
                setIsCheckedInternal(next)
              }}
            />
          }
        />
        {tooltip && (
          <Tooltip title={tooltip}>
            <HelpCircle className="switch-tooltip" />
          </Tooltip>
        )}
      </Box>
    )
  }
)

const SwitchPropTypes = {
  size: PropTypes.string,
  label: PropTypes.node,
  tooltip: PropTypes.node,
  isDisabled: PropTypes.bool,
  isChecked: PropTypes.bool,
  switchProps: PropTypes.object,
  inputProps: PropTypes.object,
  onChange: PropTypes.func,
}

Switch.propTypes = SwitchPropTypes

Switch.displayName = 'Switch'
