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

import devRoutes from 'client/router/dev'
import commonRoutes from 'client/router/common'

import { ProtectedRoute, NoAuthRoute } from 'client/components/Route'
import { InternalLayout } from 'client/components/HOC'
import Sidebar from 'client/components/Sidebar'
import Notifier from 'client/components/Notifier'
import { isDevelopment } from 'client/utils'

const Router = ({ routes }) => {
  const ENDPOINTS = React.useMemo(() => [
    ...routes.ENDPOINTS,
    ...(isDevelopment() ? devRoutes.ENDPOINTS : [])
  ], [])

  return (
    <TransitionGroup>
      <Switch>
        {ENDPOINTS?.map(({ Component, ...rest }, index, endpoints) =>
          <ProtectedRoute key={index} exact {...rest}>
            <Sidebar endpoints={endpoints} />
            <Notifier />
            <InternalLayout>
              <Component />
            </InternalLayout>
          </ProtectedRoute>
        )}
        {commonRoutes.ENDPOINTS?.map(({ Component, ...rest }, index) =>
          <NoAuthRoute key={index} exact {...rest}>
            <Component />
          </NoAuthRoute>
        )}
        <Route component={() => <Redirect to={commonRoutes.PATH.LOGIN} />} />
      </Switch>
    </TransitionGroup>
  )
}

Router.propTypes = {
  routes: PropTypes.shape({
    PATH: PropTypes.object,
    ENDPOINTS: PropTypes.arrayOf(
      PropTypes.shape({
        Component: PropTypes.object.isRequired,
        icon: PropTypes.object,
        label: PropTypes.string.isRequired,
        path: PropTypes.string.isRequired,
        sidebar: PropTypes.bool
      })
    )
  })
}

Router.defaultProps = {
  routes: {
    PATH: {},
    ENDPOINTS: []
  }
}

Router.displayName = 'Router'

export default Router
