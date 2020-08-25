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

import Login from 'client/containers/Login';
import { Clusters, Hosts, Zones } from 'client/containers/Infrastructure';
import { Users, Groups } from 'client/containers/System';
import Settings from 'client/containers/Settings';
import TestApi from 'client/containers/TestApi';
import Dashboard from 'client/containers/Dashboard';

export const PATH = {
  LOGIN: '/',
  DASHBOARD: '/dashboard',
  SETTINGS: '/settings',
  TEST_API: '/test-api',
  INFRASTRUCTURE: {
    CLUSTERS: '/clusters',
    HOSTS: '/hosts',
    ZONES: '/zones'
  },
  SYSTEM: {
    USERS: '/users',
    GROUPS: '/groups'
  },
  NETWORKS: {
    VNETS: '/vnets',
    VNETS_TEMPLATES: '/vnets-templates',
    VNETS_TOPOLOGY: '/vnets-topology',
    SEC_GROUPS: '/secgroups'
  }
};

export default [
  {
    label: 'login',
    path: PATH.LOGIN,
    authenticated: false,
    component: Login
  },
  {
    label: 'dashboard',
    path: PATH.DASHBOARD,
    component: Dashboard
  },
  {
    label: 'settings',
    path: PATH.SETTINGS,
    header: true,
    component: Settings
  },
  {
    label: 'test api',
    path: PATH.TEST_API,
    devMode: true,
    component: TestApi
  },
  {
    label: 'infrastructure',
    routes: [
      {
        label: 'clusters',
        path: PATH.INFRASTRUCTURE.CLUSTERS,
        component: Clusters
      },
      {
        label: 'hosts',
        path: PATH.INFRASTRUCTURE.HOSTS,
        component: Hosts
      },
      {
        label: 'zones',
        path: PATH.INFRASTRUCTURE.ZONES,
        component: Zones
      }
    ]
  },
  {
    label: 'system',
    routes: [
      {
        label: 'users',
        path: PATH.SYSTEM.USERS,
        component: Users
      },
      {
        label: 'groups',
        path: PATH.SYSTEM.GROUPS,
        component: Groups
      }
    ]
  },
  {
    label: 'networks',
    routes: [
      {
        label: 'vnets',
        path: PATH.NETWORKS.VNETS
      },
      {
        label: 'vnets templates',
        path: PATH.NETWORKS.VNETS_TEMPLATES
      },
      {
        label: 'vnets topology',
        path: PATH.NETWORKS.VNETS_TOPOLOGY
      },
      {
        label: 'vnets secgroup',
        path: PATH.NETWORKS.SEC_GROUPS
      }
    ]
  }
];
