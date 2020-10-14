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

import React from 'react'
import { Route, Switch } from 'react-router-dom'
import { TransitionGroup } from 'react-transition-group'

import { InternalLayout, MainLayout } from 'client/components/HOC'
import Error404 from 'client/containers/Error404'
import endpoints from 'client/router/endpoints'

const renderRoute = ({
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
      <InternalLayout label={label} authRoute={authenticated}>
        <Component />
      </InternalLayout>
    )}
    {...route}
  />
)

const Router = () => (
  <MainLayout>
    <TransitionGroup>
      <Switch>
        {endpoints?.map(({ routes, ...endpoint }) =>
          endpoint.path ? renderRoute(endpoint) : routes?.map(renderRoute)
        )}
        <Route component={Error404} />
      </Switch>
    </TransitionGroup>
  </MainLayout>
)

export default Router
