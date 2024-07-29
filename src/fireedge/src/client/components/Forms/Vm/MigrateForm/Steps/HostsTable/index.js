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

import { useListForm } from 'client/hooks'
import { HostsTable } from 'client/components/Tables'

import { SCHEMA } from 'client/components/Forms/Vm/MigrateForm/Steps/HostsTable/schema'
import { T } from 'client/constants'

export const STEP_ID = 'host'

const Content = ({ data, setFormData }) => {
  const { ID } = data?.[0] ?? {}

  const { handleSelect, handleClear } = useListForm({
    key: STEP_ID,
    setList: setFormData,
  })

  const handleSelectedRows = (rows) => {
    const { original = {} } = rows?.[0] ?? {}

    original.ID !== undefined ? handleSelect(original) : handleClear()
  }

  return (
    <HostsTable
      singleSelect
      disableGlobalSort
      displaySelectedRows
      pageSize={5}
      initialState={{ selectedRowIds: { [ID]: true } }}
      onSelectedRowsChange={handleSelectedRows}
    />
  )
}

const HostsTableStep = () => ({
  id: STEP_ID,
  label: T.SelectHost,
  resolver: SCHEMA,
  content: Content,
})

Content.propTypes = {
  data: PropTypes.any,
  setFormData: PropTypes.func,
}

export default HostsTableStep
