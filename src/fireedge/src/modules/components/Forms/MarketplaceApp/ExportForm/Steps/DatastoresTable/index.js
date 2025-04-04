/* ------------------------------------------------------------------------- *
 * Copyright 2002-2025, OpenNebula Project, OpenNebula Systems               *
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
import { useMemo } from 'react'

import { DATASTORE_TYPES, T } from '@ConstantsModule'
import { useListForm } from '@HooksModule'
import { Step, decodeBase64 } from '@UtilsModule'
import { SCHEMA } from '@modules/components/Forms/MarketplaceApp/ExportForm/Steps/DatastoresTable/schema'
import { DatastoresTable } from '@modules/components/Tables'

export const STEP_ID = 'datastore'

const Content = ({ data, app, setFormData }) => {
  const { ID } = data?.[0] ?? {}

  const { handleSelect, handleClear } = useListForm({
    key: STEP_ID,
    setList: setFormData,
  })

  const isKernelType = useMemo(() => {
    const appTemplate = String(decodeBase64(app?.TEMPLATE?.APPTEMPLATE64, ''))

    return appTemplate.includes('TYPE="KERNEL"')
  }, [])

  const handleSelectedRows = (rows) => {
    const { original = {} } = rows?.[0] ?? {}

    original.ID !== undefined ? handleSelect(original) : handleClear()
  }

  return (
    <DatastoresTable.Table
      singleSelect
      disableGlobalSort
      displaySelectedRows
      pageSize={5}
      getRowId={(row) => String(row.ID)}
      initialState={{
        selectedRowIds: { [ID]: true },
        filters: [{ id: 'TYPE', value: isKernelType ? 'FILE' : 'IMAGE' }],
      }}
      onSelectedRowsChange={handleSelectedRows}
      // Filter data by type IMAGE_DS B#6213 when export an app
      filter={(dataToFilter) =>
        dataToFilter.filter(
          (datastore) =>
            datastore?.TEMPLATE?.TYPE &&
            isKernelType !==
              (datastore.TEMPLATE.TYPE === DATASTORE_TYPES.IMAGE.value)
        )
      }
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
  label: T.SelectDatastore,
  resolver: SCHEMA,
  content: (props) => Content({ ...props, app }),
})

Content.propTypes = {
  data: PropTypes.any,
  setFormData: PropTypes.func,
  app: PropTypes.object,
}

export default DatastoreStep
