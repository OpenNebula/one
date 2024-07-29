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

import { SCHEMA } from 'client/components/Forms/BackupJob/CreateForm/Steps/DatastoreTable/schema'
import { DatastoresTable } from 'client/components/Tables'

import { DATASTORE_TYPES, T } from 'client/constants'
import { Step } from 'client/utils'

export const STEP_ID = 'datastores'

const Content = ({ data }) => {
  const { NAME } = data?.[0] ?? {}
  const { setValue } = useFormContext()

  const handleSelectedRows = (rows) => {
    const dataRows = rows?.map?.(({ original }) => original)
    setValue(STEP_ID, dataRows)
  }

  return (
    <DatastoresTable
      singleSelect
      disableGlobalSort
      displaySelectedRows
      pageSize={5}
      getRowId={(row) => String(row.NAME)}
      initialState={{
        selectedRowIds: { [NAME]: true },
      }}
      filter={(dataToFilter) =>
        dataToFilter.filter(
          (datastore) =>
            datastore?.TEMPLATE?.TYPE === DATASTORE_TYPES.BACKUP.value
        )
      }
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
const DatastoresStep = (app) => ({
  id: STEP_ID,
  label: T.SelectDatastores,
  resolver: SCHEMA,
  content: (props) => Content({ ...props, app }),
})

Content.propTypes = {
  data: PropTypes.any,
  setFormData: PropTypes.func,
  app: PropTypes.object,
}

export default DatastoresStep
