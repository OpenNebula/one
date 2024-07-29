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
import { useRef } from 'react'

import { useGetLatest, reducePlugin } from 'client/components/Consoles/utils'
import WebMKSClient from 'client/components/Consoles/WebMKS/client'

/**
 * Creates Web MKS session.
 *
 * @param {object} options - Options
 * @param {string} options.token - Session token to VMRC
 * @returns {object} session
 */
const useWebMKSSession = (options) => {
  // Create the wmks instance
  const instanceRef = useRef({})
  const getInstance = useGetLatest(instanceRef.current)

  // Assign the options to the instance
  Object.assign(getInstance(), { ...options })

  // Assign the session and plugins to the instance
  Object.assign(
    getInstance(),
    [WebMKSClient].reduce(reducePlugin, getInstance())
  )

  return getInstance()
}

export * from 'client/components/Consoles/WebMKS/buttons'
export { useWebMKSSession }
