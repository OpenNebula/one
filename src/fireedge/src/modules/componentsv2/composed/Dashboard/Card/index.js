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
import { Box } from '@mui/material'
import PropTypes from 'prop-types'
import { Component, forwardRef } from 'react'
import { Link as RouterLink } from 'react-router-dom'

import { Text } from '@modules/componentsv2/primitives/Text/Default'
import { getStyles } from '@modules/componentsv2/composed/Dashboard/Card/styles'
import { TEXT_VARIANTS, TEXT_WEIGHTS } from '@ConstantsModule'

const CARD_TYPES = ['small', 'big']

const getTitleStyle = (type) => {
  switch (type) {
    case 'big':
      return { variant: TEXT_VARIANTS.H6, weight: TEXT_WEIGHTS.SEMIBOLD }
    default:
      return {
        variant: TEXT_VARIANTS.BODY_SMALL,
        weight: TEXT_WEIGHTS.MEDIUM,
      }
  }
}

/**
 * Generic visual wrapper for dashboard cards.
 *
 * It owns the shared card frame and header while leaving its content free.
 *
 * @param {object} props - Component properties
 * @param {'small'|'big'} props.type - Card visual type
 * @param {Component} props.title - Card title
 * @param {Component} props.titleTag - Tag rendered next to the title
 * @param {Component} props.adornment - Element rendered next to the title
 * @param {Component} props.children - Free card content
 * @param {string|object} props.to - Optional internal navigation target
 * @param {object} ref - Forwarded ref
 * @returns {Component} Dashboard card wrapper
 */
export const DashboardCard = forwardRef(
  (
    {
      type = 'small',
      title,
      titleTag,
      adornment,
      children,
      className = '',
      to,
      ...opts
    },
    ref
  ) => {
    const isLink = to !== undefined && to !== null
    const linkProps = isLink ? { component: RouterLink, to } : {}

    return (
      <Box
        ref={ref}
        className={`dashboard-card dashboard-card-${type} ${className}`}
        {...opts}
        {...linkProps}
        sx={(theme) => getStyles({ theme, type, isLink })}
      >
        <Box className="dashboard-card-header">
          <Box className="dashboard-card-title-container">
            <Text
              className="dashboard-card-title"
              value={title}
              {...getTitleStyle(type)}
            />
            {titleTag && (
              <Box className="dashboard-card-title-tag">{titleTag}</Box>
            )}
          </Box>
          {adornment && (
            <Box className="dashboard-card-adornment">{adornment}</Box>
          )}
        </Box>
        <Box className="dashboard-card-content">{children}</Box>
      </Box>
    )
  }
)

DashboardCard.propTypes = {
  type: PropTypes.oneOf(CARD_TYPES),
  title: PropTypes.node.isRequired,
  titleTag: PropTypes.node,
  adornment: PropTypes.node,
  to: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  className: PropTypes.string,
  children: PropTypes.node,
}

DashboardCard.displayName = 'DashboardCard'
