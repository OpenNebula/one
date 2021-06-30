/* Copyright 2002-2021, OpenNebula Project, OpenNebula Systems                */
/*                                                                            */
/* Licensed under the Apache License, Version 2.0 (the "License"); you may    */
/* not use this file except in compliance with the License. You may obtain    */
/* a copy of the License at                                                   */
/*                                                                            */
/* http://www.apache.org/licenses/LICENSE-2.0                                 */
/*                                                                            */
/* Unless required by applicable law or agreed to in writing, software        */
/* distributed under the License is distributed on an "AS IS" BASIS,          */
/* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.   */
/* See the License for the specific language governing permissions and        */
/* limitations under the License.                                             */
/* -------------------------------------------------------------------------- */

import * as React from 'react'
import PropTypes from 'prop-types'

import { Redirect, Route, Switch } from 'react-router-dom'
import { TransitionGroup } from 'react-transition-group'
import { LinearProgress } from '@material-ui/core'

import devRoutes from 'client/router/dev'
import commonRoutes from 'client/router/common'

import { ProtectedRoute, NoAuthRoute } from 'client/components/Route'
import { InternalLayout } from 'client/components/HOC'
import Sidebar from 'client/components/Sidebar'
import Notifier from 'client/components/Notifier'
import { isDevelopment } from 'client/utils'

const Router = ({ isLogged, routes }) => {
  const ENDPOINTS = React.useMemo(() => [
    ...routes.ENDPOINTS,
    ...(isDevelopment() ? devRoutes.ENDPOINTS : [])
  ], [])

  const renderRoute = React.useCallback(
    ({ Component, ...rest }, index) => (
      <ProtectedRoute key={index} exact {...rest}>
        <InternalLayout>
          <Component fallback={<LinearProgress color='secondary' />} />
        </InternalLayout>
      </ProtectedRoute>
    ), [])

  return (
    <>
      {isLogged && (
        <>
          <Sidebar endpoints={ENDPOINTS} />
          <Notifier />
        </>
      )}
      <TransitionGroup>
        <Switch>
          {ENDPOINTS?.map(({ routes: subRoutes, ...rest }, index) =>
            Array.isArray(subRoutes)
              ? subRoutes?.map(renderRoute)
              : renderRoute(rest, index)
          )}
          {commonRoutes.ENDPOINTS?.map(({ Component, ...rest }, index) =>
            <NoAuthRoute key={index} exact {...rest}>
              <Component />
            </NoAuthRoute>
          )}
          <Route component={() => <Redirect to={commonRoutes.PATH.LOGIN} />} />
        </Switch>
      </TransitionGroup>
    </>
  )
}

Router.propTypes = {
  isLogged: PropTypes.bool,
  routes: PropTypes.shape({
    PATH: PropTypes.object,
    ENDPOINTS: PropTypes.arrayOf(
      PropTypes.shape({
        Component: PropTypes.object,
        icon: PropTypes.object,
        label: PropTypes.string.isRequired,
        path: PropTypes.string,
        sidebar: PropTypes.bool,
        routes: PropTypes.array
      })
    )
  })
}

Router.defaultProps = {
  isLogged: false,
  routes: {
    PATH: {},
    ENDPOINTS: []
  }
}

Router.displayName = 'Router'

export default Router
