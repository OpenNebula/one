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

import React, { useCallback, useMemo } from 'react'
import PropTypes from 'prop-types'

import { Redirect, Route, Switch } from 'react-router-dom'
import { TransitionGroup } from 'react-transition-group'

import devRoutes from 'client/router/dev'
import { InternalLayout, MainLayout } from 'client/components/HOC'

const Router = ({ title, routes }) => {
  const { ENDPOINTS, PATH } = useMemo(() => ({
    ...routes,
    ...(process?.env?.NODE_ENV === 'development' &&
      {
        PATH: { ...routes.PATH, ...devRoutes.PATH },
        ENDPOINTS: routes.ENDPOINTS.concat(devRoutes.ENDPOINTS)
      }
    )
  }), [])

  const renderRoute = useCallback(({
    label = '',
    path = '',
    authenticated = true,
    Component,
    ...route
  }) => (
    <Route
      key={`key-${label.replace(' ', '-')}`}
      exact
      path={path}
      component={() => (
        <InternalLayout label={title} authRoute={authenticated}>
          <Component />
        </InternalLayout>
      )}
      {...route}
    />
  ), [title])

  return (
    <MainLayout endpoints={{ ENDPOINTS, PATH }}>
      <TransitionGroup>
        <Switch>
          {React.useMemo(() => ENDPOINTS?.map(renderRoute), [])}
          <Route component={() => <Redirect to={PATH.LOGIN} />} />
        </Switch>
      </TransitionGroup>
    </MainLayout>
  )
}

Router.propTypes = {
  title: PropTypes.string,
  routes: PropTypes.shape({
    PATH: PropTypes.object,
    ENDPOINTS: PropTypes.arrayOf(
      PropTypes.shape({
        label: PropTypes.string.isRequired,
        path: PropTypes.string.isRequired,
        authenticated: PropTypes.bool.isRequired,
        sidebar: PropTypes.bool,
        icon: PropTypes.object,
        Component: PropTypes.func.isRequired
      })
    )
  })
}

Router.defaultProps = {
  title: undefined,
  routes: {
    PATH: {},
    ENDPOINTS: []
  }
}

Router.displayName = 'Router'

export default Router
