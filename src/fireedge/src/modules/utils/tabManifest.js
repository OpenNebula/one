/* ------------------------------------------------------------------------- *
 * Copyright 2002-2025, OpenNebula Project, OpenNebula Systems               *
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

const moduleCache = {}

const loadIcon = (iconName = '') => TabIcons[iconName] || TabIcons.NewTab

const loadComponent = (componentName, moduleId = 'ContainersModule') =>
  loadable(
    async () => {
      try {
        if (!moduleCache[moduleId]) {
          const remoteModule = window[moduleId]

          if (!remoteModule || typeof remoteModule.get !== 'function') {
            throw new Error(
              `Module: ${moduleId} not found or not properly initialized`
            )
          }

          // Initialize shared dependencies
          if (typeof remoteModule.init === 'function') {
            // eslint-disable-next-line no-undef
            await remoteModule.init(__webpack_share_scopes__.default)
          }

          // Get the exposed path from the module
          // All modules should expose '.', by default, pointing to a global barrel file for all exports
          const factory = await remoteModule.get('.')
          moduleCache[moduleId] = factory()
        }

        const Component = moduleCache[moduleId][componentName]
        if (!Component) {
          throw new Error(
            `Component ${componentName} not found in module ${moduleId}.`
          )
        }

        return Component
      } catch (error) {
        console.error('Tab-Manifest loading error: ', error)

        window.location.href = '/dashboard'

        return null
      }
    },
    { ssr: false }
  )

const processRoute = ({ icon, Component, moduleId, ...rest }) => ({
  ...rest,
  icon: loadIcon(icon),
  ...(Component && { Component: loadComponent(Component, moduleId) }),
})

/**
 * @param {object} tabManifest - Fetched tab manifest JSON
 * @returns {object} Formatted endpoints object
 */
export const processTabManifest = (tabManifest = []) =>
  Array.isArray(tabManifest) && tabManifest.length > 0
    ? tabManifest.map(({ icon, Component, routes, moduleId, ...entry }) => ({
        ...entry,
        icon: loadIcon(icon),
        ...(Component && { Component: loadComponent(Component, moduleId) }),
        ...(routes && { routes: routes.map(processRoute) }),
      }))
    : []
