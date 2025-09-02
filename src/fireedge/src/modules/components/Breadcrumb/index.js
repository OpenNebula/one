/* ------------------------------------------------------------------------- *
 * Copyright 2002-2025, OpenNebula Project, OpenNebula Systems               *
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
import { useGeneral } from '@FeaturesModule'
import breadcrumbStyles from '@modules/components/Breadcrumb/styles'
import { Link, Typography, useTheme } from '@mui/material'
import Breadcrumbs from '@mui/material/Breadcrumbs'
import clsx from 'clsx'
import { Home, NavArrowRight } from 'iconoir-react'
import PropTypes from 'prop-types'
import { useMemo } from 'react'
import { Link as RouterLink, useHistory, useParams } from 'react-router-dom'

function resolvePath(path, params) {
  return path.replace(/:([a-zA-Z0-9_]+)/g, (_, key) => params[key] || `:${key}`)
}

const NavigateBreadcrumb = ({ route, breadcrumbClass = {} }) => {
  const { navigate, link, linkActive } = breadcrumbClass
  const params = useParams()

  return (
    <Breadcrumbs
      aria-label="breadcrumb"
      separator={<NavArrowRight />}
      className={navigate}
    >
      <Link component={RouterLink} color="inherit" to="/" className={link}>
        <Home />
      </Link>
      {route.breadcrumb.map(({ title, path }, index) => {
        const isLast = index === route.breadcrumb.length - 1

        return (
          <Link
            key={path}
            component={RouterLink}
            color="inherit"
            to={resolvePath(path, params)}
            className={!isLast ? link : clsx(link, linkActive)}
          >
            {title || path}
          </Link>
        )
      })}
    </Breadcrumbs>
  )
}
NavigateBreadcrumb.propTypes = {
  route: PropTypes.object,
  breadcrumbClass: PropTypes.object,
}
NavigateBreadcrumb.displayName = 'NavigateBreadcrumb'

/**
 * Displays breadcrumb in Sunstone.
 *
 * @param {object} params - Object with route
 * @param {object} params.route - Route of the page
 * @returns {object} - Breadcrumb
 */
const SunstoneBreadcrumb = ({ route }) => {
  const hasBreadcrumbs =
    Array.isArray(route?.breadcrumb) && route?.breadcrumb?.length > 1
  const theme = useTheme()
  const classes = useMemo(
    () => breadcrumbStyles(theme, hasBreadcrumbs),
    [theme]
  )

  const history = useHistory()

  const { breadcrumb } = useGeneral()

  const handleOnClick = (routeToNavigate) => {
    history.push(routeToNavigate)
  }

  return (
    <div>
      {hasBreadcrumbs && (
        <NavigateBreadcrumb route={route} breadcrumbClass={classes} />
      )}
      <Breadcrumbs
        separator=""
        className={classes.item}
        aria-label="breadcrumb"
      >
        <Link
          className={classes.title}
          onClick={() => handleOnClick(route?.path)}
        >
          {route?.title && route?.title}
        </Link>
        <Typography>
          {breadcrumb?.subsection && breadcrumb?.subsection}
        </Typography>
      </Breadcrumbs>
    </div>
  )
}

SunstoneBreadcrumb.propTypes = {
  route: PropTypes.object,
}

SunstoneBreadcrumb.displayName = 'SunstoneBreadcrumb'

export { SunstoneBreadcrumb }
