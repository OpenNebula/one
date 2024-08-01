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
import { useFormContext } from 'react-hook-form'

import { DatastoresTable } from 'client/components/Tables'
import { SCHEMA } from 'client/components/Forms/Vm/BackupForm/Steps/DatastoresTable/schema'

import { Step } from 'client/utils'
import { T, VM_EXTENDED_POOL } from 'client/constants'

export const STEP_ID = 'datastore'

const Content = ({ data, app }) => {
  const { NAME } = data?.[0] ?? {}
  const { setValue } = useFormContext()

  const handleSelectedRows = (rows) => {
    const { original = {} } = rows?.[0] ?? {}

    setValue(STEP_ID, original.ID !== undefined ? [original] : [])
  }

  // Create initial state and only add select rows if there is value in NAME (if not, there is no value selected)
  const initialState = {
    filters: [{ id: 'TYPE', value: 'BACKUP_DS' }],
  }
  NAME && (initialState.selectedRowIds = { [NAME]: true })

  return (
    <DatastoresTable
      singleSelect
      disableGlobalSort
      displaySelectedRows
      pageSize={5}
      getRowId={(row) => String(row.NAME)}
      filter={(DATA) => DATA.filter((ds) => ds.TYPE === '3')}
      initialState={initialState}
      onSelectedRowsChange={handleSelectedRows}
    />
  )
}

/**
 * Step to select the Datastore.
 *
 * @param {object} app - Marketplace App resource
 * @returns {Step} Datastore step
 */
const DatastoreStep = (app) => ({
  id: STEP_ID,
  label: T.SelectDatastoreImage,
  resolver: SCHEMA,
  defaultDisabled: {
    statePaths: [
      `oneApi.queries.getVms({"extended":${VM_EXTENDED_POOL}}).data`,
      'general.selectedIds',
    ],
    condition: (vmsData, selectedIds) =>
      selectedIds
        .map((id) => vmsData?.find((vmData) => vmData.ID === id))
        .filter(Boolean)
        .every((vm) => {
          const { BACKUPS } = vm
          const { LAST_INCREMENT_ID, MODE } = BACKUPS?.BACKUP_CONFIG || {}

          return LAST_INCREMENT_ID !== '-1' && MODE === 'INCREMENT'
        }),
  },
  content: (props) => Content({ ...props, app }),
})

Content.propTypes = {
  data: PropTypes.any,
  setFormData: PropTypes.func,
  app: PropTypes.object,
}

export default DatastoreStep
