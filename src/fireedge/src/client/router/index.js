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
import PropTypes from 'prop-types'
import { JSXElementConstructor } from 'react'

import { LinearProgress } from '@mui/material'
import { Redirect, Route, Switch } from 'react-router-dom'
import { TransitionGroup } from 'react-transition-group'

import {
  ENDPOINTS as COMMON_ENDPOINTS,
  PATH as COMMON_PATH,
} from 'client/router/common'

import { InternalLayout, NoAuthRoute, ProtectedRoute } from '@ComponentsModule'

const flattenRoutes = (routes) =>
  routes.flatMap((r) => {
    const current = {
      title: r.title || r.path,
      path: r.path,
    }

    return r.routes ? [current, ...flattenRoutes(r.routes)] : [current]
  })

const renderRoute = (endpoints) => {
  const RouteRenderer = ({ Component, ...route }) => {
    if (route?.path) {
      const flat = flattenRoutes(endpoints)
      const segments = route.path
        .split('/')
        .filter(Boolean)
        .map((_, i, arr) => '/' + arr.slice(0, i + 1).join('/'))

      route.breadcrumb = segments
        .map((seg) => flat.find((r) => r.path === seg))
        .filter(Boolean)
    }

    return (
      <ProtectedRoute key={route.path} exact {...route}>
        <InternalLayout {...route}>
          <Component fallback={<LinearProgress />} />
        </InternalLayout>
      </ProtectedRoute>
    )
  }
  RouteRenderer.propTypes = {
    Component: PropTypes.any,
  }
  RouteRenderer.displayName = 'RouteRenderer'

  return RouteRenderer
}

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
          ? subRoutes?.map(renderRoute(endpoints))
          : renderRoute(endpoints)(rest, index)
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
