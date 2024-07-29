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
import { ReactElement } from 'react'
import PropTypes from 'prop-types'

import EmptyTab from 'client/components/Tabs/EmptyTab'
import Information from 'client/components/Tabs/Host/Numa/information'

import { getHostNuma } from 'client/models/Host'
import { useGetHostQuery } from 'client/features/OneApi/host'

import UpdatePinPolicyForm from 'client/components/Tabs/Host/Numa/UpdatePinPolicy'
import UpdateIsolatedCPUSForm from 'client/components/Tabs/Host/Numa/UpdateIsolatedCPUS'

/**
 * Renders mainly information tab.
 *
 * @param {object} props - Props
 * @param {string} props.id - Host id
 * @returns {ReactElement} Information tab
 */
const NumaInfoTab = ({ id }) => {
  const { data: host = {} } = useGetHostQuery({ id })
  const numa = getHostNuma(host)

  return (
    <>
      <UpdatePinPolicyForm host={host} />
      <UpdateIsolatedCPUSForm host={host} />
      {numa?.length > 0 ? (
        numa.map((node) => (
          <Information key={node.NODE_ID} node={node} host={host} />
        ))
      ) : (
        <EmptyTab />
      )}
    </>
  )
}

NumaInfoTab.propTypes = {
  tabProps: PropTypes.object,
  id: PropTypes.string,
}

NumaInfoTab.displayName = 'NumaInfoTab'

export default NumaInfoTab
