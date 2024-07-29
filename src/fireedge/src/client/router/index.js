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
import { JSXElementConstructor } from 'react'
import PropTypes from 'prop-types'

import { Redirect, Route, Switch } from 'react-router-dom'
import { TransitionGroup } from 'react-transition-group'
import { LinearProgress } from '@mui/material'

import {
  PATH as COMMON_PATH,
  ENDPOINTS as COMMON_ENDPOINTS,
} from 'client/router/common'

import { ProtectedRoute, NoAuthRoute } from 'client/components/Route'
import { InternalLayout } from 'client/components/HOC'

const renderRoute = ({ Component, ...route }) => (
  <ProtectedRoute key={route.path} exact {...route}>
    <InternalLayout {...route}>
      <Component fallback={<LinearProgress color="secondary" />} />
    </InternalLayout>
  </ProtectedRoute>
)

/**
 * @param {object} props - Props
 * @param {string} props.redirectWhenAuth
 * - Pathname to redirect when user isn authenticated
 * @param {object[]} props.endpoints - App endpoints
 * @returns {JSXElementConstructor} Router
 */
const Router = ({ redirectWhenAuth, endpoints }) => (
  <TransitionGroup>
    <Switch>
      {endpoints?.map(({ routes: subRoutes, ...rest }, index) =>
        Array.isArray(subRoutes)
          ? subRoutes?.map(renderRoute)
          : renderRoute(rest, index)
      )}
      {COMMON_ENDPOINTS?.map(({ Component, ...rest }, index) => (
        <NoAuthRoute
          key={index}
          exact
          redirectWhenAuth={redirectWhenAuth}
          {...rest}
        >
          <Component />
        </NoAuthRoute>
      ))}
      <Route component={() => <Redirect to={COMMON_PATH.LOGIN} />} />
    </Switch>
  </TransitionGroup>
)

Router.propTypes = {
  redirectWhenAuth: PropTypes.string,
  endpoints: PropTypes.arrayOf(
    PropTypes.shape({
      Component: PropTypes.object,
      icon: PropTypes.object,
      label: PropTypes.string,
      path: PropTypes.string,
      sidebar: PropTypes.bool,
      disableLayout: PropTypes.bool,
      routes: PropTypes.array,
    })
  ),
}

Router.defaultProps = {
  redirectWhenAuth: '/dashboard',
  endpoints: [],
}

Router.displayName = 'Router'

export default Router
