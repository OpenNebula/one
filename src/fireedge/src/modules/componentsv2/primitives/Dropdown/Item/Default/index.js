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

import React from 'react'
import PropTypes from 'prop-types'
import { MenuItem, Typography } from '@mui/material'

import { getStyles } from '@modules/componentsv2/primitives/Dropdown/Item/Default/styles'
import { useTranslation } from '@ProvidersModule'

/**
 * Dropdown item component.
 *
 * @param {object} props - Component properties.
 * @param {React.ElementType} [props.icon] - Icon.
 * @param {string} [props.label] - Label.
 * @param {React.ElementType} [props.control] - control element.
 * @param {Function} [props.onClick] - onClick callback.
 * @param {string} [props.dataCy] - Cypress selector.
 * @returns {React.ReactElement} - Dropdown item component.
 */
export const DropdownItem = ({
  icon: Icon,
  label,
  onClick,
  control = null,
  dataCy,
}) => {
  const { translateText } = useTranslation()

  return (
    <MenuItem
      className="dropdown-item"
      data-cy={dataCy}
      onClick={onClick}
      sx={(theme) => getStyles({ theme })}
    >
      <Icon className="icon" />
      <Typography className="label">{translateText(label)}</Typography>
      {control}
    </MenuItem>
  )
}

DropdownItem.propTypes = {
  expanded: PropTypes.bool,
  icon: PropTypes.elementType,
  label: PropTypes.string,
  onClick: PropTypes.func,
  control: PropTypes.node,
  dataCy: PropTypes.string,
}

DropdownItem.displayName = 'MenuDropdown'
