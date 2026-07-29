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

import { createContext, useContext } from 'react'

export const DetailsDrawerStackContext = createContext({
  entries: [],
  activeIndex: 0,
  index: 0,
  isActive: true,
  breadcrumbs: [],
  goBack: undefined,
  goForward: undefined,
  goTo: undefined,
})

export const DetailsDrawerStackProvider = DetailsDrawerStackContext.Provider

/**
 * Returns current details drawer stack metadata.
 *
 * @returns {object} Details drawer stack metadata
 */
export const useDetailsDrawerStack = () => useContext(DetailsDrawerStackContext)
