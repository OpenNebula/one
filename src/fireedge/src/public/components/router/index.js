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

import React, { createElement } from 'react';
import { Route, Switch } from 'react-router-dom';
import { AuthLayout } from '../HOC';
import Error404 from '../containers/Error404';
import InternalLayout from '../HOC/InternalLayout';
import endpoints from './endpoints';

const routeElement = (
  title = '',
  { path = '/', authenticated = true, component }
) => (
  <Route
    key={`key-${title.replace(' ', '-')}`}
    exact
    path={path}
    component={({ match, history }) =>
      authenticated ? (
        <AuthLayout history={history} match={match}>
          <InternalLayout title={title.replace('_', ' ')}>
            {createElement(component)}
          </InternalLayout>
        </AuthLayout>
      ) : (
        createElement(component, { history, match })
      )
    }
  />
);

function Routes() {
  return (
    <Switch>
      {Object.entries(endpoints)?.map(([title, routes]) =>
        routes.component
          ? routeElement(title, routes)
          : Object.entries(routes)?.map(([internalTitle, route]) =>
              routeElement(internalTitle, route)
            )
      )}
      <Route component={() => <Error404 />} />
    </Switch>
  );
}

export default Routes;
export { endpoints };
