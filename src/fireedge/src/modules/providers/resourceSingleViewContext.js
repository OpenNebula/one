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

const contextValue = {
  clearResourceSingleViewBase: () => undefined,
  closeResourceSingleView: () => undefined,
  goBackResourceSingleView: () => undefined,
  goForwardResourceSingleView: () => undefined,
  goToResourceSingleView: () => undefined,
  openResourceSingleView: () => false,
  popResourceSingleView: () => undefined,
  registerResourceSingleViewBase: () => false,
  stack: { entries: [], activeIndex: -1 },
}

const ResourceSingleViewContext = createContext(contextValue)

/**
 * @returns {object} Resource single view context value
 */
export const useResourceSingleViewContext = () =>
  useContext(ResourceSingleViewContext)

export const ResourceSingleViewContextProvider =
  ResourceSingleViewContext.Provider
