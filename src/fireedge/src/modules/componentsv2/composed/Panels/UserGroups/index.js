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
import { Component, forwardRef } from 'react'
import { Box, Typography } from '@mui/material'

import { T } from '@ConstantsModule'
import { getStyles } from '@modules/componentsv2/composed/Panels/UserGroups/styles'
import { useTranslation } from '@ProvidersModule'

/**
 * Displays user groups using the Components V2 design system.
 *
 * @param {object} props - Component props
 * @param {object} props.actions - Action buttons node
 * @param {object} props.primaryGroup - Primary group card node
 * @param {object} props.primaryTitle - Primary section title
 * @param {Array} props.secondaryGroups - Secondary group card nodes
 * @param {object} props.secondaryTitle - Secondary section title
 * @param {object} ref - Forwarded ref
 * @returns {Component} User groups tab
 */
export const UserGroupsTab = forwardRef(
  (
    {
      actions,
      primaryGroup,
      primaryTitle = T.PrimaryGroup,
      secondaryGroups = [],
      secondaryTitle = T.SecondaryGroups,
    },
    ref
  ) => {
    const { translate } = useTranslation()

    return (
      <Box sx={(theme) => getStyles({ theme })} ref={ref}>
        {actions && <Box className="user-groups-actions">{actions}</Box>}

        <Box className="user-groups-section">
          {primaryTitle && (
            <Typography component="h3" className="user-groups-section-title">
              {typeof primaryTitle === 'string'
                ? translate(primaryTitle)
                : primaryTitle}
            </Typography>
          )}
          <Box className="user-groups-card">{primaryGroup}</Box>
        </Box>

        {secondaryGroups.length > 0 && (
          <Box className="user-groups-section">
            <Typography component="h3" className="user-groups-section-title">
              {typeof secondaryTitle === 'string'
                ? translate(secondaryTitle)
                : secondaryTitle}
            </Typography>
            <Box className="user-groups-list">
              {secondaryGroups.map(({ id, content }) => (
                <Box key={id} className="user-groups-card">
                  {content}
                </Box>
              ))}
            </Box>
          </Box>
        )}
      </Box>
    )
  }
)

UserGroupsTab.propTypes = {
  actions: PropTypes.node,
  primaryGroup: PropTypes.node,
  primaryTitle: PropTypes.node,
  secondaryGroups: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      content: PropTypes.node,
    })
  ),
  secondaryTitle: PropTypes.node,
}

UserGroupsTab.displayName = 'UserGroupsTab'
