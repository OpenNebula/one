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

import { forwardRef, Component, ReactNode } from 'react'
import PropTypes from 'prop-types'
import { Box } from '@mui/material'
import { getStyles } from '@modules/componentsv2/composed/Cards/Default/slots/title/styles'
import { Badge } from '@modules/componentsv2/primitives/Badge'
import { StatusTag } from '@modules/componentsv2/composed/Status'

/**
 * TitleSlot component.
 *
 * @param {object} root0 - Params
 * @param {ReactNode} root0.title - Title content
 * @param {string} root0.status - Badge status
 * @param {string} root0.statusName - Status label
 * @returns {Component} - TextField component
 */
export const TitleSlot = forwardRef(
  ({ status, statusName, title = '' }, ref) => (
    <Box
      sx={(theme) =>
        getStyles({
          theme,
        })
      }
      ref={ref}
    >
      <Box className="title">{title}</Box>
      {status &&
        (statusName ? (
          <StatusTag statusColor={status} statusName={statusName} />
        ) : (
          <Badge status={status} type="dot" />
        ))}
    </Box>
  )
)

TitleSlot.propTypes = {
  title: PropTypes.node,
  status: PropTypes.string,
  statusName: PropTypes.string,
}

TitleSlot.displayName = 'TitleSlot'
