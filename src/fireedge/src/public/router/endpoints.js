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

import Login from 'client/containers/Login';
import Dashboard from 'client/containers/Dashboard';
import Settings from 'client/containers/Settings';
import TestApi from 'client/containers/TestApi';
import Webconsole from 'client/containers/Webconsole';
import {
  ApplicationCreate,
  ApplicationDeploy,
  ApplicationManage
} from 'client/containers/Application';

export const PATH = {
  LOGIN: '/',
  DASHBOARD: '/dashboard',
  APPLICATION: {
    CREATE: '/application/create',
    MANAGE: '/application/manage',
    DEPLOY: '/application/deploy'
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
    icon: BallotIcon,
    component: TestApi
  },
  {
    label: 'Webconsole',
    path: '/webconsole',
    authenticated: true,
    devMode: true,
    icon: BallotIcon,
    component: Webconsole
  },
  {
    label: 'Create Application',
    path: PATH.APPLICATION.CREATE,
    authenticated: true,
    icon: PaletteIcon,
    component: ApplicationCreate
  },
  {
    label: 'Deploy Application',
    path: PATH.APPLICATION.DEPLOY,
    authenticated: true,
    icon: RedditIcon,
    component: ApplicationDeploy
  },
  {
    label: 'Manage Application',
    path: PATH.APPLICATION.MANAGE,
    authenticated: true,
    icon: BuildIcon,
    component: ApplicationManage
  }
];

export const findRouteByPathname = pathname =>
  ENDPOINTS.flatMap(({ routes, ...item }) => routes ?? item)?.find(
    ({ path }) => path === pathname
  ) ?? {};

export default ENDPOINTS;
