/* Copyright 2002-2019, OpenNebula Project, OpenNebula Systems                */
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

import * as endpoints from 'client/router/endpoints'
import { InternalLayout, MainLayout } from 'client/components/HOC'
import { APPS } from 'client/constants'

const Router = ({ app }) => {
  const { ENDPOINTS, PATH } = useMemo(() => ({
    ...endpoints[app],
    ...(process?.env?.NODE_ENV === 'development' &&
      { ENDPOINTS: endpoints[app].ENDPOINTS.concat(endpoints.dev.ENDPOINTS) }
    )
  }), [app])

  const renderRoute = useCallback(({
    label = '',
    path = '',
    authenticated = true,
    component: Component,
    ...route
  }) => (
    <Route
      key={`key-${label.replace(' ', '-')}`}
      exact
      path={path}
      component={() => (
        <InternalLayout
          label={label}
          endpoints={ENDPOINTS}
          authRoute={authenticated}
        >
          <Component />
        </InternalLayout>
      )}
      {...route}
    />
  ), [ENDPOINTS])

  return (
    <MainLayout endpoints={{ ENDPOINTS, PATH }}>
      <TransitionGroup>
        <Switch>
          {ENDPOINTS?.map(({ routes, ...endpoint }) =>
            endpoint.path ? renderRoute(endpoint) : routes?.map(renderRoute)
          )}
          <Route component={() => <Redirect to={PATH.LOGIN} />} />
        </Switch>
      </TransitionGroup>
    </MainLayout>
  )
}

Router.propTypes = {
  app: PropTypes.oneOf([undefined, ...Object.keys(APPS)])
}

Router.defaultProps = {
  app: undefined
}

export default Router
