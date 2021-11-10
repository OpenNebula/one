/* ------------------------------------------------------------------------- *
 * Copyright 2002-2021, OpenNebula Project, OpenNebula Systems               *
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
import PropTypes from 'prop-types'

import NetworkItem from 'client/components/Tabs/Vm/Network/Item'

const NetworkList = ({ nics, actions }) => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    gap: '1em',
    paddingBlock: '0.8em'
  }}>
    {nics.map(nic => {
      const { IP, MAC, ADDRESS } = nic
      const key = IP ?? MAC ?? ADDRESS // address only exists form PCI nics

      return <NetworkItem key={key} actions={actions} nic={nic} />
    })}
  </div>
)

NetworkList.propTypes = {
  actions: PropTypes.arrayOf(PropTypes.string),
  nics: PropTypes.array
}

NetworkList.displayName = 'NetworkList'

export default NetworkList
