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
import * as React from 'react'
import PropTypes from 'prop-types'

import { useVmApi } from 'client/features/One'
import { Permissions, Ownership } from 'client/components/Tabs/Common'
import Information from 'client/components/Tabs/Vm/Info/information'

const VmInfoTab = ({ tabProps, handleRefetch, ...data }) => {
  const { ID, UNAME, UID, GNAME, GID, PERMISSIONS } = data
  const { changeOwnership } = useVmApi()

  const handleChangeOwnership = async newOwnership => {
    const response = await changeOwnership(ID, newOwnership)

    String(response) === String(ID) && await handleRefetch?.()
  }

  return (
    <div style={{
      display: 'grid',
      gap: '1em',
      gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))',
      padding: '0.8em'
    }}>
      {tabProps?.information_panel?.enabled &&
        <Information {...data} />
      }
      {tabProps?.permissions_panel?.enabled &&
        <Permissions id={ID} {...PERMISSIONS} />
      }
      {tabProps?.ownership_panel?.enabled &&
        <Ownership
          userId={UID}
          userName={UNAME}
          groupId={GID}
          groupName={GNAME}
          handleEdit={handleChangeOwnership}
        />
      }
    </div>
  )
}

VmInfoTab.propTypes = {
  tabProps: PropTypes.object,
  handleRefetch: PropTypes.func
}

VmInfoTab.displayName = 'VmInfoTab'

export default VmInfoTab
