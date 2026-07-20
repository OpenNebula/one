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
import { EditPencil } from 'iconoir-react'
import {
  CAPACITY_ACTION_GROUP_SX,
  CAPACITY_ACTION_SX,
  getStyles,
} from '@modules/componentsv2/composed/Panels/Capacity/styles'
import { ToggleGroup } from '@modules/componentsv2/primitives/Buttons/Toggle/Group'
import { SkeletonLoading } from '@modules/componentsv2/primitives/Loaders'
import { T } from '@ConstantsModule'

/**
 * CapacityPanel component.
 *
 * @param {object} root0 - Params
 * @returns {Component} - CapacityPanel component
 */
export const CapacityPanel = forwardRef(
  (
    {
      title,
      options = [],
      isLoading = false,
      actions = {},
      handleEdit,
      isDisabled = false,
    },
    ref
  ) => (
    <Box
      sx={(theme) =>
        getStyles({
          theme,
        })
      }
      ref={ref}
    >
      {title && (
        <Box className="capacity-header">
          <Box className="capacity-title">{title}</Box>
          {actions?.resize === true && (
            <ToggleGroup
              size="small"
              isOutlined={false}
              isSelectable={false}
              sx={CAPACITY_ACTION_GROUP_SX}
              options={[
                [
                  {
                    startIcon: <EditPencil width="16px" height="16px" />,
                    onClick: handleEdit,
                    tooltip: T.Resize,
                    value: 'resize',
                    isDisabled,
                    sx: CAPACITY_ACTION_SX,
                  },
                ],
              ]}
            />
          )}
        </Box>
      )}
      <Box className="capacity-container">
        {[].concat(options)?.map(([label, value], idx) => (
          <Box key={idx} className="capacity-detail--row">
            <SkeletonLoading
              className="capacity-loading-row"
              loading={isLoading}
              width="100%"
              borderRadius="lg"
            >
              <>
                <Box className="capacity-detail--label">{label}</Box>
                <Box className="capacity-detail--value">{value}</Box>
              </>
            </SkeletonLoading>
          </Box>
        ))}
      </Box>
    </Box>
  )
)

CapacityPanel.propTypes = {
  title: PropTypes.string,
  options: PropTypes.array,
  isLoading: PropTypes.bool,
  actions: PropTypes.object,
  handleEdit: PropTypes.func,
  isDisabled: PropTypes.bool,
}

CapacityPanel.displayName = 'CapacityPanel'
