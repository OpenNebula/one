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

import { Component } from 'react'
import { Typography, Link, Box, Divider, useTheme } from '@mui/material'
import MUIBreadcrumbs from '@mui/material/Breadcrumbs'
import { Home, NavArrowRight } from 'iconoir-react'
import PropTypes from 'prop-types'
import { Link as RouterLink, useHistory } from 'react-router-dom'
import { useFunctionality } from '@FeaturesModule'
import { Button } from '@modules/componentsv2/primitives/Buttons/Default'
import { useTranslation } from '@ProvidersModule'

const translateBreadcrumbLabel = (label, translate) => {
  if (typeof label !== 'string') return label

  const [section, ...resource] = label.split(' - ')

  return [translate(section), ...resource].join(' - ')
}

/**
 * @param {object} params - Params
 * @param {object[]} params.breadcrumbs - Breadcrumbs to render
 * @param {string} params.className - Classname override
 * @param {boolean} params.showHome - Whether to render home button
 * @returns {Component} - Breadcrumb trail
 */
export const BreadcrumbTrail = ({ breadcrumbs = [], className, showHome }) => {
  const history = useHistory()
  const theme = useTheme()
  const { translate } = useTranslation()

  if (!breadcrumbs?.length) return null

  return (
    <Box className={className}>
      {showHome && (
        <>
          <Button
            iconOnly={<Home />}
            type="transparent"
            size="small"
            data-cy="breadcrumb-home"
            onClick={() => history.push('/')}
            className={'header-home-button'}
          />

          <Divider
            orientation="vertical"
            flexItem
            className={'header-divider'}
          />
        </>
      )}

      <MUIBreadcrumbs
        aria-label="breadcrumb"
        separator={
          <NavArrowRight
            color={theme.palette.icon.primary}
            height={theme.scale[500]}
            width={theme.scale[500]}
          />
        }
        data-cy="breadcrumbs"
        className={'breadcrumb-links'}
      >
        {breadcrumbs.map(({ label, path }, i) => {
          const translatedLabel = translateBreadcrumbLabel(label, translate)

          return path && i < breadcrumbs.length - 1 ? (
            <Link
              key={path}
              underline="hover"
              color="inherit"
              component={RouterLink}
              to={path}
            >
              {translatedLabel}
            </Link>
          ) : (
            <Typography
              className={`breadcrumb-item ${
                i === breadcrumbs?.length - 1 ? 'selected' : ''
              }`}
              key={label}
            >
              {translatedLabel}
            </Typography>
          )
        })}
      </MUIBreadcrumbs>
    </Box>
  )
}

BreadcrumbTrail.propTypes = {
  breadcrumbs: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
      path: PropTypes.string,
    })
  ),
  className: PropTypes.string,
  showHome: PropTypes.bool,
}

BreadcrumbTrail.displayName = 'BreadcrumbTrail'

/**
 * @param {object} params - Params
 * @param {string} params.className - Classname override
 * @returns {Component} - Breadcrumb header
 */
export const Breadcrumbs = ({ className }) => {
  const { breadcrumbs } = useFunctionality()

  return (
    <BreadcrumbTrail breadcrumbs={breadcrumbs} className={className} showHome />
  )
}

Breadcrumbs.propTypes = { className: PropTypes.string }
Breadcrumbs.displayName = 'Breadcrumbs'
