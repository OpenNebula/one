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
/* eslint-disable no-unused-vars */
/* eslint-disable jsdoc/valid-types */
import { useRef } from 'react'

import GuacamoleClient, {
  GuacamoleClientType,
} from '@modules/components/Consoles/Guacamole/client'
import {
  GuacamoleDisplayPlugin,
  GuacamoleKeyboardPlugin,
  GuacamoleMousePlugin,
} from '@modules/components/Consoles/Guacamole/plugins'
import { reducePlugin, useGetLatest } from '@modules/components/Consoles/utils'

/**
 * Creates guacamole session.
 *
 * @param {object} options - Options
 * @param {string} options.id - Session includes type and VM id. Eg: '6-vnc'
 * @param {...any} [plugins] - Plugins
 * @returns {GuacamoleClientType &
 * GuacamoleDisplayPlugin &
 * GuacamoleKeyboardPlugin &
 * GuacamoleMousePlugin} session
 */
const useGuacamoleSession = (options, ...plugins) => {
  // Create the guacamole instance
  const instanceRef = useRef({})
  const getInstance = useGetLatest(instanceRef.current)

  // Assign the options to the instance
  Object.assign(getInstance(), { ...options })

  // Assign the session and plugins to the instance
  Object.assign(
    getInstance(),
    [GuacamoleClient, ...plugins].reduce(reducePlugin, getInstance())
  )

  return getInstance()
}

export * from '@modules/components/Consoles/Guacamole/buttons'
export * from '@modules/components/Consoles/Guacamole/plugins'
export { useGuacamoleSession }
