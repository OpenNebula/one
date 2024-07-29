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
import { SCHEMA } from 'client/components/Forms/Backup/RestoreForm/Steps/DatastoresTable/schema'

import { Step } from 'client/utils'
import { T, DATASTORE_TYPES } from 'client/constants'

export const STEP_ID = 'datastore'

const Content = ({ data, app }) => {
  const { NAME } = data?.[0] ?? {}
  const { setValue } = useFormContext()

  const handleSelectedRows = (rows) => {
    const { original = {} } = rows?.[0] ?? {}

    setValue(STEP_ID, original.ID !== undefined ? [original] : [])
  }

  return (
    <DatastoresTable
      singleSelect
      disableGlobalSort
      displaySelectedRows
      pageSize={5}
      getRowId={(row) => String(row.NAME)}
      filter={
        (datastores) =>
          datastores?.filter(
            ({ TYPE }) => +TYPE === DATASTORE_TYPES.IMAGE.id
          ) ?? []
        // 0 = image
      }
      initialState={{
        selectedRowIds: { [NAME]: true },
        filters: [{ id: 'TYPE', value: 'IMAGE' }],
      }}
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
const DatastoreStep = (app) => {
  const { disableImageSelection } = app

  return {
    id: STEP_ID,
    label: T.SelectDatastoreImage,
    resolver: SCHEMA,
    content: (props) => Content({ ...props, app }),
    defaultDisabled: {
      // Disabled when image selection is enabled, aka when in restore operation
      condition: () => !disableImageSelection,
    },
  }
}

Content.propTypes = {
  data: PropTypes.any,
  setFormData: PropTypes.func,
  app: PropTypes.object,
}

export default DatastoreStep
