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
import PropTypes from 'prop-types'
import { ReactElement } from 'react'

import { List } from 'client/components/Tabs/Common'
import { T, Zone } from 'client/constants'

/**
 * Renders server pool information tab.
 *
 * @param {object} props - Props
 * @param {Zone} props.zone - Zone resource
 * @returns {ReactElement} Information tab
 */
const ServerPoolPanel = ({ zone = {} }) => {
  const { SERVER_POOL, ID, NAME } = zone
  let serverPool = []

  if (SERVER_POOL?.SERVER) {
    serverPool = SERVER_POOL?.SERVER.map((element) => ({
      name: element?.ID || '-',
      value: element?.NAME || '-',
      dataCy: `server-pool-${element?.ID || ''}`,
    }))
  } else {
    serverPool = [
      {
        name: ID || '-',
        value: NAME || '-',
        dataCy: `server-pool-${ID || ''}`,
      },
    ]
  }

  return (
    <>
      <List title={T.ServerPool} list={serverPool} />
    </>
  )
}

ServerPoolPanel.propTypes = {
  zone: PropTypes.object,
}

ServerPoolPanel.displayName = 'ServerPoolPanel'

export default ServerPoolPanel
