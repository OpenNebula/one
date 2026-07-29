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

import { Component, forwardRef } from 'react'
import PropTypes from 'prop-types'
import { Box } from '@mui/material'
import { getStyles } from '@modules/componentsv2/composed/Cards/Default/styles'
import { Checkbox } from '@modules/componentsv2/primitives/Buttons'
import { DEFAULT_IMAGE } from '@ConstantsModule'
import { Image } from '@modules/componentsv2/primitives/Images/Default'

/**
 * Card component.
 *
 * @param {object} root0 - Params
 * @param {object} root0.icon - Card icon
 * @param {string} root0.iconAspectRatio - Card icon aspect ratio
 * @param {number} root0.iconSize - Card icon size
 * @param {Function} root0.onCheck - Check handler
 * @param {Function} root0.onClick - Click handler
 * @param {boolean} root0.isSelected - Card is selected
 * @param {boolean} root0.isRemoveCheckbox - Remove checkbox from card
 * @param {Array} root0.slots - Component card slots
 * @param {object|Array|Function} root0.sx - Custom SX styles
 * @returns {Component} - TextField component
 */
export const Card = forwardRef(
  (
    {
      icon,
      iconAspectRatio,
      iconSize = 24,
      isSelected = false,
      onCheck = () => {},
      slots = [],
      onClick = () => {},
      isRemoveCheckbox = false,
      dataCy,
      sx,
    },
    ref
  ) => (
    <Box
      sx={[
        (theme) =>
          getStyles({
            theme,
            isSelected,
            hasIcon: Boolean(icon),
          }),
        ...(Array.isArray(sx) ? sx : [sx]),
      ].filter(Boolean)}
      ref={ref}
      data-cy={dataCy}
      onClick={onClick}
    >
      <Box className="card-info">
        {!isRemoveCheckbox && (
          <Checkbox
            className="card-checkbox"
            checked={isSelected}
            onChange={onCheck}
          />
        )}
        <Box className="card-details">
          {icon && (
            <Image
              width={iconSize}
              height={iconSize}
              aspectRatio={iconAspectRatio}
              src={`${icon}`}
              alt=""
              onError={(e) => {
                e.target.onerror = null
                e.target.src = DEFAULT_IMAGE
              }}
            />
          )}
          <Box className="card-slots">
            {slots
              ?.filter(Boolean)
              ?.map(([Slot, slotProps = {}, containerSx = {}], idx) => (
                <Box
                  key={idx}
                  className={`card-slot card-slot--${idx}`}
                  sx={{
                    ...containerSx,
                  }}
                >
                  <Slot {...slotProps} />
                </Box>
              ))}
          </Box>
        </Box>
      </Box>
    </Box>
  )
)

Card.propTypes = {
  isSelected: PropTypes.bool,
  isRemoveCheckbox: PropTypes.bool,
  icon: PropTypes.node,
  iconAspectRatio: PropTypes.string,
  iconSize: PropTypes.number,
  slots: PropTypes.array,
  onCheck: PropTypes.func,
  onClick: PropTypes.func,
  dataCy: PropTypes.string,
  sx: PropTypes.oneOfType([PropTypes.object, PropTypes.array, PropTypes.func]),
}

Card.displayName = 'Card'
