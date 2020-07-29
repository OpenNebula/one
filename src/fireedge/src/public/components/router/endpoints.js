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

import React from 'react';
import Login from './login';
import Settings from '../containers/Settings';
import TestApi from '../containers/TestApi';
import Dashboard from '../containers/Dashboard';
import { Clusters, Hosts, Zones } from '../containers/Infrastructure';

const endpoints = {
  login: {
    path: '/',
    authenticated: false,
    menu: false,
    component: Login
  },
  dashboard: {
    path: '/dashboard',
    component: () => <Dashboard />
  },
  settings: {
    path: '/settings',
    component: () => <Settings />
  },
  test_api: {
    path: '/test-api',
    component: () => <TestApi />
  },
  // infrastructure
  infrastructure: {
    clusters: {
      path: '/clusters',
      component: () => <Clusters />
    },
    hosts: {
      path: '/hosts',
      component: () => <Hosts />
    },
    zones: {
      path: '/zones',
      component: () => <Zones />
    }
  },
  // networks
  networks: {
    vnets: {
      path: '/vnets'
    },
    vnets_templates: {
      path: '/vnets-templates'
    },
    vnets_topology: {
      path: '/vnets-topology'
    },
    vnets_secgroup: {
      path: '/secgroup'
    }
  }
};

export default endpoints;
