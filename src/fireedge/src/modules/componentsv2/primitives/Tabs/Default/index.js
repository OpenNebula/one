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

import { Component, forwardRef, useState } from 'react'
import PropTypes from 'prop-types'
import { Box, Tabs as MUITabs, Tab as MUITab } from '@mui/material'
import { WarningCircle } from 'iconoir-react'
import { getStyles } from '@modules/componentsv2/primitives/Tabs/Default/styles'
import { renderIcon } from '@UtilsModule'
import { useTranslation } from '@ProvidersModule'

/**
 * @param {object} root0 - Params
 * @param {string} root0.type - Tab group style
 * @param {Array} root0.options - Array of tab props
 * @returns {Component} - Custom MUI Tabs component
 */
export const Tabs = forwardRef(
  ({ type = 'default', options = [], defaultSelect = null, onChange }, ref) => {
    const { translateText } = useTranslation()
    const [selected, setSelected] = useState(defaultSelect)
    const handleChange = (_, newValue) => {
      setSelected(newValue)
      onChange?.(newValue)
      const tab = options.find((t, i) => (t.value ?? i) === newValue)
      tab?.onClick?.()
    }

    return (
      <Box ref={ref} sx={(theme) => ({ ...getStyles({ theme, type }) })}>
        <MUITabs
          value={selected}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          className="tabbar"
          onChange={handleChange}
        >
          {options?.map(
            (
              {
                startIcon,
                id,
                dataCy,
                title,
                onClick = () => {},
                endIcon,
                error = false,
                value,
                disabled = false,
              },
              idx
            ) => {
              const translatedTitle =
                typeof title === 'string' ? translateText(title) : title

              return (
                <MUITab
                  key={value ?? idx}
                  value={value ?? idx}
                  data-cy={dataCy ?? (id ? `tab-${id}` : undefined)}
                  aria-invalid={error || undefined}
                  disabled={disabled}
                  onClick={onClick}
                  disableRipple
                  disableFocusRipple
                  label={
                    <Box className="tab-label" data-text={translatedTitle}>
                      {(error || startIcon) &&
                        renderIcon(error ? WarningCircle : startIcon, {
                          className: 'tab-starticon',
                        })}
                      <Box
                        component="span"
                        className="tab-title"
                        data-text={translatedTitle}
                      >
                        {translatedTitle}
                      </Box>
                      {endIcon &&
                        renderIcon(endIcon, { className: 'tab-endicon' })}
                    </Box>
                  }
                  className={`tab${error ? ' tab-error' : ''}`}
                />
              )
            }
          )}
        </MUITabs>
      </Box>
    )
  }
)

Tabs.propTypes = {
  type: PropTypes.string,
  options: PropTypes.array,
  defaultSelect: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func,
}

Tabs.displayName = 'Tabs'
