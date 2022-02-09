/* ------------------------------------------------------------------------- *
 * Copyright 2002-2022, OpenNebula Project, OpenNebula Systems               *
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
/* eslint-disable jsdoc/require-jsdoc */
import { useEffect, createContext, useState } from 'react'
import PropTypes from 'prop-types'

export const TabContext = createContext(null)

const TabProvider = ({ initialState = {}, children }) => {
  const [information, setTabInformation] = useState(() => initialState)
  const { data } = initialState

  useEffect(() => {
    data && setTabInformation((prev) => ({ ...prev, data }))
  }, [data])

  return (
    <TabContext.Provider value={{ ...information, setTabInformation }}>
      {children}
    </TabContext.Provider>
  )
}

TabProvider.propTypes = {
  initialState: PropTypes.object,
  children: PropTypes.oneOfType([
    PropTypes.node,
    PropTypes.arrayOf(PropTypes.node),
  ]),
}

export default TabProvider
