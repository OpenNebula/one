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

import React, { useEffect } from 'react'
import PropTypes from 'prop-types'
import { useLocation, Redirect, matchPath } from 'react-router-dom'

import { useAuth, useOpennebula } from 'client/hooks'
import Sidebar from 'client/components/Sidebar'
import Notifier from 'client/components/Notifier'
import LoadingScreen from 'client/components/LoadingScreen'

const findRouteByPathname = (endpoints = [], pathname = '') => {
  const route = endpoints?.find(({ path }) =>
    matchPath(pathname, { path, exact: true })
  )

  return route ?? {}
}

const MainLayout = ({ endpoints, children }) => {
  const { PATH, ENDPOINTS } = endpoints
  const { pathname } = useLocation()
  const { groups } = useOpennebula()
  const {
    isLogged,
    isLoginInProcess,
    getAuthInfo,
    authUser,
    firstRender,
    isLoading
  } = useAuth()

  useEffect(() => {
    if (isLogged && !isLoginInProcess && !isLoading) {
      getAuthInfo()
    }
  }, [isLogged, isLoginInProcess, pathname])

  const { authenticated } = findRouteByPathname(ENDPOINTS, pathname)
  const authRoute = Boolean(authenticated)

  // PENDING TO AUTHENTICATING OR FIRST RENDERING
  if (firstRender || (isLogged && authRoute && !authUser && !groups?.length)) {
    return <LoadingScreen />
  }

  // PROTECTED ROUTE
  if (authRoute && !isLogged && !isLoginInProcess) {
    return <Redirect to={PATH.LOGIN} />
  }

  // PUBLIC ROUTE
  if (!authRoute && isLogged && !isLoginInProcess) {
    return <Redirect to={PATH.DASHBOARD} />
  }

  return (
    <>
      {authRoute && isLogged && (
        <>
          <Sidebar endpoints={ENDPOINTS} />
          <Notifier />
        </>
      )}
      {children}
    </>
  )
}

MainLayout.propTypes = {
  endpoints: PropTypes.shape({
    PATH: PropTypes.object,
    ENDPOINTS: PropTypes.array
  }),
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node,
    PropTypes.string
  ])
}

MainLayout.defaultProps = {
  endpoints: {
    PATH: {},
    ENDPOINTS: []
  },
  children: ''
}

export default MainLayout
