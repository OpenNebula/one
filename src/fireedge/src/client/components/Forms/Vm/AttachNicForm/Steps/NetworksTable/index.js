/* ------------------------------------------------------------------------- *
 * Copyright 2002-2023, OpenNebula Project, OpenNebula Systems               *
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

import { useListForm } from 'client/hooks'
import { VNetworksTable } from 'client/components/Tables'

import { SCHEMA } from 'client/components/Forms/Vm/AttachNicForm/Steps/NetworksTable/schema'
import { T } from 'client/constants'

export const STEP_ID = 'network'

const Content = ({ data, setFormData }) => {
  const { ID } = data?.[0] ?? {}

  const { handleSelect, handleClear } = useListForm({
    key: STEP_ID,
    setList: setFormData,
    modifiedFields: ['NETWORK', 'NETWORK_UNAME'],
    fieldKey: 'general',
  })

  const handleSelectedRows = (rows) => {
    const { original = {} } = rows?.[0] ?? {}

    original.ID !== undefined ? handleSelect(original) : handleClear()
  }

  return (
    <VNetworksTable
      singleSelect
      disableGlobalSort
      displaySelectedRows
      pageSize={5}
      getRowId={(row) => String(row.ID)}
      initialState={{ selectedRowIds: { [ID]: true } }}
      onSelectedRowsChange={handleSelectedRows}
    />
  )
}

const NetworkStep = () => ({
  id: STEP_ID,
  label: T.SelectNetwork,
  resolver: SCHEMA,
  content: Content,
})

Content.propTypes = {
  data: PropTypes.any,
  setFormData: PropTypes.func,
}

export default NetworkStep
