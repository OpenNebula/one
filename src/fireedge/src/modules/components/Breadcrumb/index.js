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
import Breadcrumbs from '@mui/material/Breadcrumbs'
import { Typography, Link, useTheme } from '@mui/material'
import breadcrumbStyles from '@modules/components/Breadcrumb/styles'
import { useMemo } from 'react'
import { useHistory } from 'react-router-dom'
import { useGeneral } from '@FeaturesModule'
import PropTypes from 'prop-types'

/**
 * Displays breadcrumb in Sunstone.
 *
 * @param {object} params - Object with route
 * @param {object} params.route - Route of the page
 * @returns {object} - Breadcrumb
 */
const SunstoneBreadcrumb = ({ route }) => {
  const theme = useTheme()
  const classes = useMemo(() => breadcrumbStyles(theme), [theme])

  const history = useHistory()

  const { breadcrumb } = useGeneral()

  const handleOnClick = (routeToNavigate) => {
    history.push(routeToNavigate)
  }

  return (
    <div>
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
