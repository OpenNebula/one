/* ------------------------------------------------------------------------- *
 * Copyright 2002-2024, OpenNebula Project, OpenNebula Systems               *
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
import { ReactElement } from 'react'
import PropTypes from 'prop-types'

import { Redirect, Route } from 'react-router-dom'
import { useAuth } from 'client/features/Auth'

/**
 * Public route.
 *
 * @param {object} props - Route props
 * @param {ReactElement} props.redirectWhenAuth
 * - Route to redirect in case of user is authenticated
 * @returns {Redirect|Route}
 * - If current user is authenticated, then redirect to private route
 */
const NoAuthRoute = ({ redirectWhenAuth, ...props }) => {
  const { isLogged: isAuthenticated } = useAuth()

  return isAuthenticated ? (
    <Redirect to={redirectWhenAuth} />
  ) : (
    <Route exact {...props} />
  )
}

NoAuthRoute.propTypes = {
  redirectWhenAuth: PropTypes.string,
}

export default NoAuthRoute
