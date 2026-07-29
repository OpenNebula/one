/* ------------------------------------------------------------------------- *
 * Copyright 2002-2026, OpenNebula Project, OpenNebula Systems               *
 *                                                                           *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may   *
 * not use this file except in compliance with the License. You may obtain   *
 * a copy of the License at                                                  *
 *                                                                           *
 * http://www.apache.org/licenses/LICENSE-2.0                                *
 *                                                                           *
 * Unless required by applicable law or agreed to in writing, software       *
 * distributed under the License is distributed on an "AS IS" BASIS,         *
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  *
 * See the License for the specific language governing permissions and       *
 * limitations under the License.                                            *
 * ------------------------------------------------------------------------- */
import PropTypes from 'prop-types'
import { JSXElementConstructor, useEffect, useMemo } from 'react'
import { useLocation, Redirect, Route, Switch } from 'react-router-dom'
import { buildBreadcrumbMap } from '@UtilsModule'
import { LinearProgress } from '@mui/material'
import { TransitionGroup } from 'react-transition-group'
import { PATH } from '@ConstantsModule'
import { useFunctionalityApi, useSupportAuth } from '@FeaturesModule'
import { ResourceSingleViewHost } from '@ContainersModule'
import {
  ENDPOINTS as COMMON_ENDPOINTS,
  PATH as COMMON_PATH,
} from 'client/router/common'

import { InternalLayout, NoAuthRoute, ProtectedRoute } from '@ResourcesModule'

const renderRoute = () => {
  const RouteRenderer = ({ Component, ...route }) => (
    <ProtectedRoute key={route.path} exact {...route}>
      <ResourceSingleViewHost>
        <InternalLayout {...route}>
          <Component fallback={<LinearProgress />} />
        </InternalLayout>
      </ResourceSingleViewHost>
    </ProtectedRoute>
  )
  RouteRenderer.propTypes = {
    Component: PropTypes.any,
  }
  RouteRenderer.displayName = 'RouteRenderer'

  return RouteRenderer
}

const getResourceFromLocationState = (state) => {
  if (!state) return null

  if (Array.isArray(state)) {
    return state.find(
      (item) => item && typeof item === 'object' && 'ID' in item
    )
  }

  return typeof state === 'object' ? state : null
}

const getResourceBreadcrumbLabel = (state) => {
  const resource = getResourceFromLocationState(state)
  const id = resource?.ID ?? resource?.DOCUMENT?.ID

  if (id === undefined || id === null || id === '') return null

  const name = resource?.NAME ?? resource?.DOCUMENT?.NAME

  return [`#${id}`, name].filter(Boolean).join(' ')
}

const appendResourceToLastBreadcrumb = (breadcrumbs, state) => {
  const resourceLabel = getResourceBreadcrumbLabel(state)

  if (!resourceLabel) return breadcrumbs

  return breadcrumbs?.map((breadcrumb, index) =>
    index === breadcrumbs.length - 1
      ? { ...breadcrumb, label: `${breadcrumb.label} - ${resourceLabel}` }
      : { ...breadcrumb }
  )
}

const normalizeRoutePath = (path = '') => {
  const normalized = `/${String(path).replace(/^\/+|\/+$/g, '')}`

  return normalized === '/' ? normalized : normalized.replace(/\/+$/g, '')
}

const getEndpointPaths = (endpoints = []) => {
  const paths = []
  const collect = (route) => {
    if (route.path) paths.push(route.path)
    route.routes?.forEach(collect)
  }

  endpoints.forEach(collect)

  return paths
}

const getExactResourceActionRoutePath = (paths = [], pathname = '') => {
  const basePath = normalizeRoutePath(pathname)
  const getActionPath = (action) =>
    `${basePath === '/' ? '' : basePath}/${action}`
  const actionPaths = ['create', 'instantiate'].map(getActionPath)

  return (
    actionPaths
      .map((actionPath) =>
        paths.find((path) => normalizeRoutePath(path) === actionPath)
      )
      .find(Boolean) ?? null
  )
}

/**
 * @param {object} props - Props
 * @param {string} props.redirectWhenAuth
 * - Pathname to redirect when user isn authenticated
 * @param {object[]} props.endpoints - App endpoints
 * @returns {JSXElementConstructor} Router
 */
const Router = ({ redirectWhenAuth, endpoints }) => {
  const { pathname, state } = useLocation()
  const { user: supportUser } = useSupportAuth()
  const getBreadcrumbs = useMemo(
    () => buildBreadcrumbMap(endpoints),
    [endpoints]
  )
  const endpointPaths = useMemo(() => getEndpointPaths(endpoints), [endpoints])

  const { setBreadcrumbs, setResourceCreatePath } = useFunctionalityApi()

  useEffect(() => {
    const breadCrumbs = appendResourceToLastBreadcrumb(
      getBreadcrumbs(pathname),
      state
    )
    setBreadcrumbs(breadCrumbs)
    const actionPath = getExactResourceActionRoutePath(endpointPaths, pathname)
    const createPath = actionPath
      ? getBreadcrumbs(actionPath)?.at(-1) ?? null
      : null
    const isSupportPath = pathname === PATH.SUPPORT
    setResourceCreatePath(isSupportPath && !supportUser ? null : createPath)
  }, [endpointPaths, getBreadcrumbs, pathname, state, supportUser])

  return (
    <TransitionGroup>
      <Switch>
        {endpoints?.map(({ routes: subRoutes, ...rest }, index) =>
          Array.isArray(subRoutes)
            ? subRoutes?.map(renderRoute(endpoints))
            : renderRoute(endpoints)(rest, index)
        )}
        {COMMON_ENDPOINTS?.map(({ Component, ...rest }, index) => (
          <NoAuthRoute
            key={index}
            exact
            redirectWhenAuth={redirectWhenAuth}
            {...rest}
          >
            <Component />
          </NoAuthRoute>
        ))}
        <Route component={() => <Redirect to={COMMON_PATH.LOGIN} />} />
      </Switch>
    </TransitionGroup>
  )
}

Router.propTypes = {
  redirectWhenAuth: PropTypes.string,
  endpoints: PropTypes.arrayOf(
    PropTypes.shape({
      Component: PropTypes.object,
      icon: PropTypes.object,
      label: PropTypes.string,
      path: PropTypes.string,
      sidebar: PropTypes.bool,
      disableLayout: PropTypes.bool,
      routes: PropTypes.array,
    })
  ),
}

Router.defaultProps = {
  redirectWhenAuth: '/dashboard',
  endpoints: [],
}

Router.displayName = 'Router'

export default Router
