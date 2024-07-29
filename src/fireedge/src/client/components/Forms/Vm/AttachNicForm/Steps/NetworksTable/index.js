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
/* eslint-disable jsdoc/require-jsdoc */
import PropTypes from 'prop-types'
import { VNetworksTable } from 'client/components/Tables'
import { SCHEMA } from 'client/components/Forms/Vm/AttachNicForm/Steps/NetworksTable/schema'
import { T } from 'client/constants'
import { useGeneralApi } from 'client/features/General'

export const STEP_ID = 'network'

const Content = ({ data, setFormData }) => {
  const { setModifiedFields } = useGeneralApi()

  const handleSelectedRows = (rows) => {
    const { original = {} } = rows?.[0] ?? {}

    if (original.ID !== undefined) {
      setModifiedFields({
        network: {
          NETWORK: true,
          NETWORK_UID: true,
          NETWORK_UNAME: true,
          SECURITY_GROUPS: true,
        },
      })

      setFormData((prevList) => ({
        ...prevList,
        [STEP_ID]: {
          NETWORK: original?.NAME,
          NETWORK_UID: original?.UID,
          NETWORK_UNAME: original?.UNAME,
          SECURITY_GROUPS: original?.SECURITY_GROUPS,
        },
      }))
    } else {
      setFormData((prevList) => ({
        ...prevList,
        [STEP_ID]: {
          NETWORK: undefined,
          NETWORK_UID: undefined,
          NETWORK_UNAME: undefined,
          SECURITY_GROUPS: undefined,
        },
      }))
    }
  }

  return (
    <VNetworksTable
      singleSelect
      disableGlobalSort
      displaySelectedRows
      pageSize={5}
      getRowId={(row) => String(row.NAME)}
      initialState={{ selectedRowIds: { [data?.NETWORK]: true } }}
      onSelectedRowsChange={handleSelectedRows}
    />
  )
}

const NetworkStep = (props) => ({
  id: STEP_ID,
  label: T.SelectNetwork,
  resolver: SCHEMA,
  content: Content,
  defaultDisabled: {
    condition: () => props?.defaultData?.NETWORK_MODE === 'auto',
  },
})

Content.propTypes = {
  data: PropTypes.any,
  setFormData: PropTypes.func,
}

export default NetworkStep
