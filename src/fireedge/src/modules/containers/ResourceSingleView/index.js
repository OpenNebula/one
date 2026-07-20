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

import { useMemo } from 'react'
import PropTypes from 'prop-types'
import { ResourceSingleViewContextProvider } from '@ProvidersModule'
import { useResourceSingleView } from '@modules/containers/ResourceSingleView/useResourceSingleView'

export {
  RESOURCE_SINGLE_VIEW,
  hasResourceSingleView,
} from '@modules/containers/ResourceSingleView/registry'
export { useResourceSingleView }

/**
 * Hosts the resource single view drawer API and renderer.
 *
 * @param {object} props - Host props
 * @param {Component} props.children - Nested content
 * @returns {Component} Resource single view host
 */
export const ResourceSingleViewHost = ({ children }) => {
  const {
    ResourceSingleView,
    clearResourceSingleViewBase,
    goBackResourceSingleView,
    goForwardResourceSingleView,
    goToResourceSingleView,
    openResourceSingleView,
    registerResourceSingleViewBase,
    stack,
  } = useResourceSingleView()
  const value = useMemo(
    () => ({
      clearResourceSingleViewBase,
      goBackResourceSingleView,
      goForwardResourceSingleView,
      goToResourceSingleView,
      openResourceSingleView,
      registerResourceSingleViewBase,
      stack,
    }),
    [
      clearResourceSingleViewBase,
      goBackResourceSingleView,
      goForwardResourceSingleView,
      goToResourceSingleView,
      openResourceSingleView,
      registerResourceSingleViewBase,
      stack,
    ]
  )

  return (
    <ResourceSingleViewContextProvider value={value}>
      {children}
      <ResourceSingleView />
    </ResourceSingleViewContextProvider>
  )
}

ResourceSingleViewHost.propTypes = {
  children: PropTypes.node,
}

/**
 * Adds the resource single view API and renderer to a component.
 *
 * @param {Component} Component - Component to wrap
 * @returns {Component} Wrapped component
 */
export const withResourceSingleView = (Component) => {
  /**
   * Wrapped component with resource single view support.
   *
   * @param {object} props - Component props
   * @returns {Component} Component with resource single view drawer
   */
  const WithResourceSingleView = (props) => {
    const resourceSingleView = useResourceSingleView()
    const { ResourceSingleView } = resourceSingleView

    return (
      <>
        <Component {...props} {...resourceSingleView} />
        <ResourceSingleView />
      </>
    )
  }

  WithResourceSingleView.displayName = `withResourceSingleView(${
    Component.displayName || Component.name || 'Component'
  })`

  return WithResourceSingleView
}
