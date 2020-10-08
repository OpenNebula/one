/* Copyright 2002-2020, OpenNebula Project, OpenNebula Systems                */
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

import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { useLocation, Redirect } from 'react-router-dom';

import useAuth from 'client/hooks/useAuth';
import useOpennebula from 'client/hooks/useOpennebula';

import LoadingScreen from 'client/components/LoadingScreen';
import Sidebar from 'client/components/Sidebar';
import Notifier from 'client/components/Notifier';
import { PATH, findRouteByPathname } from 'client/router/endpoints';

const MainLayout = ({ children }) => {
  const { pathname } = useLocation();
  const { groups } = useOpennebula();
  const {
    isLogged,
    isLoginInProcess,
    getAuthInfo,
    authUser,
    firstRender
  } = useAuth();

  useEffect(() => {
    if (isLogged && !isLoginInProcess) {
      getAuthInfo();
    }
  }, [isLogged, isLoginInProcess]);

  const { authenticated } = findRouteByPathname(pathname);
  const authRoute = Boolean(authenticated);

  // PENDING TO AUTHENTICATING OR FIRST RENDERING
  if (firstRender || (isLogged && authRoute && !authUser && !groups?.length)) {
    return <LoadingScreen />;
  }

  // PROTECTED ROUTE
  if (authRoute && !isLogged && !isLoginInProcess) {
    return <Redirect to={PATH.LOGIN} />;
  }

  // PUBLIC ROUTE
  if (!authRoute && isLogged && !isLoginInProcess) {
    return <Redirect to={PATH.DASHBOARD} />;
  }

  return (
    <>
      {authRoute && isLogged && <Sidebar />}
      {children}
      <Notifier />
    </>
  );
};

MainLayout.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node,
    PropTypes.string
  ])
};

MainLayout.defaultProps = {
  children: ''
};

export default MainLayout;
