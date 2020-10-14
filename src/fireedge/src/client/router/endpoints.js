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

import {
  Dashboard as DashboardIcon,
  Settings as SettingsIcon,
  Ballot as BallotIcon,
  Palette as PaletteIcon,
  Reddit as RedditIcon,
  Build as BuildIcon
} from '@material-ui/icons';
import { matchPath } from 'react-router-dom';

import Login from 'client/containers/Login';
import Dashboard from 'client/containers/Dashboard';
import Settings from 'client/containers/Settings';
import TestApi from 'client/containers/TestApi';
import Webconsole from 'client/containers/Webconsole';
import { ApplicationsTemplatesCreate } from 'client/containers/ApplicationsTemplates';
import {
  ApplicationsList,
  ApplicationsManage
} from 'client/containers/Applications';

export const PATH = {
  LOGIN: '/',
  DASHBOARD: '/dashboard',
  APPLICATION_TEMPLATE: {
    CREATE: '/applications-templates/create',
    EDIT: '/applications-templates/edit/:id'
  },
  APPLICATION: {
    LIST: '/applications',
    MANAGE: '/applications/manage'
  },
  SETTINGS: '/settings',
  TEST_API: '/test-api'
};

const ENDPOINTS = [
  {
    label: 'Login',
    path: PATH.LOGIN,
    authenticated: false,
    component: Login
  },
  {
    label: 'Dashboard',
    path: PATH.DASHBOARD,
    authenticated: true,
    sidebar: true,
    icon: DashboardIcon,
    component: Dashboard
  },
  {
    label: 'Settings',
    path: PATH.SETTINGS,
    authenticated: true,
    header: true,
    icon: SettingsIcon,
    component: Settings
  },
  {
    label: 'Test API',
    path: PATH.TEST_API,
    authenticated: true,
    devMode: true,
    sidebar: true,
    icon: BallotIcon,
    component: TestApi
  },
  {
    label: 'Webconsole',
    path: '/webconsole',
    authenticated: true,
    devMode: true,
    sidebar: true,
    icon: BallotIcon,
    component: Webconsole
  },
  {
    label: 'Create Application template',
    path: PATH.APPLICATION_TEMPLATE.CREATE,
    authenticated: true,
    icon: PaletteIcon,
    component: ApplicationsTemplatesCreate
  },
  {
    label: 'Edit Application template',
    path: PATH.APPLICATION_TEMPLATE.EDIT,
    authenticated: true,
    icon: PaletteIcon,
    component: ApplicationsTemplatesCreate
  },
  {
    label: 'Applications',
    path: PATH.APPLICATION.LIST,
    authenticated: true,
    sidebar: true,
    icon: RedditIcon,
    component: ApplicationsList
  },
  {
    label: 'Manage Application',
    path: PATH.APPLICATION.MANAGE,
    authenticated: true,
    sidebar: true,
    icon: BuildIcon,
    component: ApplicationsManage
  }
];

export const findRouteByPathname = pathname => {
  const routes = ENDPOINTS.flatMap(
    ({ endpoints, ...item }) => endpoints ?? item
  );

  const route = routes?.find(({ path }) =>
    matchPath(pathname, { path, exact: true })
  );

  return route ?? {};
};

export default ENDPOINTS;
