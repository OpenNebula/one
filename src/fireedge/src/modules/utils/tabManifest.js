/* ------------------------------------------------------------------------- *
 * Copyright 2002-2024, OpenNebula Project, OpenNebula Systems               *
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
import * as TabIcons from 'iconoir-react'
import loadable from '@loadable/component'

const loadIcon = (iconName = '') => TabIcons[iconName] || TabIcons.NewTab

const loadComponent = (componentName) =>
  loadable(
    () =>
      import('@ContainersModule').then((module) => {
        const Component = module?.[componentName]
        if (!Component) {
          console.error(
            `Component ${componentName} not found in @ContainersModule`
          )

          return module.SunstoneDashboard
        }

        return Component
      }),
    { ssr: false }
  )

const processRoute = ({ icon, Component, ...rest }) => ({
  ...rest,
  icon: loadIcon(icon),
  ...(Component && { Component: loadComponent(Component) }),
})

/**
 * @param {object} tabManifest - Fetched tab manifest JSON
 * @returns {object} Formatted endpoints object
 */
export const processTabManifest = (tabManifest = []) =>
  Array.isArray(tabManifest) && tabManifest.length > 0
    ? tabManifest.map(({ icon, Component, routes, ...entry }) => ({
        ...entry,
        icon: loadIcon(icon),
        ...(Component && { Component: loadComponent(Component) }),
        ...(routes && { routes: routes.map(processRoute) }),
      }))
    : []
