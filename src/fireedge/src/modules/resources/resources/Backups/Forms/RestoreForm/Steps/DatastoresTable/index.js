/* ------------------------------------------------------------------------- *
 * Copyright 2002-2026, OpenNebula Project, OpenNebula Systems               *
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
import { useCallback } from 'react'
import { useFormContext, useWatch } from 'react-hook-form'

import { Table } from '@ComponentsV2Module'
import { datastoreTable } from '@ModelsModule'
import { SCHEMA } from '@modules/resources/resources/Backups/Forms/RestoreForm/Steps/DatastoresTable/schema'

import { Step } from '@UtilsModule'
import { T, DATASTORE_TYPES } from '@ConstantsModule'

export const STEP_ID = 'datastore'

const Content = ({ data }) => {
  const { clearErrors, control, setValue } = useFormContext()
  const watchedData = useWatch({ control, name: STEP_ID }) ?? data

  const {
    data: datastores = [],
    isFetching,
    refetch,
  } = datastoreTable.useData(undefined, {
    selectFromResult: (result) => ({
      ...result,
      data:
        result?.data?.filter(
          ({ TYPE }) => +TYPE === DATASTORE_TYPES.IMAGE.id
        ) ?? [],
    }),
  })

  const selectedDatastore = [].concat(watchedData ?? []).filter(Boolean)?.[0]
  const selectedDatastoreId =
    typeof selectedDatastore === 'object'
      ? selectedDatastore?.ID
      : selectedDatastore
  const rowSelection =
    selectedDatastoreId !== undefined
      ? { [String(selectedDatastoreId)]: true }
      : {}

  const setSelectedDatastore = useCallback(
    (datastore) => {
      setValue(STEP_ID, datastore?.ID !== undefined ? [datastore] : [], {
        shouldDirty: true,
        shouldValidate: true,
      })
      clearErrors(STEP_ID)
    },
    [clearErrors, setValue]
  )

  const handleRowSelectionChange = useCallback(
    (updater) => {
      const nextSelection =
        typeof updater === 'function' ? updater(rowSelection) : updater
      const selectedIds = Object.keys(nextSelection ?? {})
      const selectedId = selectedIds[selectedIds.length - 1]
      const datastore = datastores.find(
        ({ ID }) => String(ID) === String(selectedId)
      )

      setSelectedDatastore(datastore)
    },
    [datastores, rowSelection, setSelectedDatastore]
  )

  return (
    <Table
      columns={datastoreTable
        .columns()
        .filter(({ id }) => !['owner', 'group', 'labels'].includes(id))}
      data={datastores}
      defaultPageSize={5}
      getRowId={(row) => String(row.ID)}
      isEnableFilters={true}
      isEnableSearchBar={true}
      isEnableSort={true}
      isLoading={isFetching}
      isMultiRowSelection={false}
      isRowsSelectable={true}
      isRefreshing={isFetching}
      onRefresh={refetch}
      onRowClick={setSelectedDatastore}
      onRowSelectionChange={handleRowSelectionChange}
      rowSelection={rowSelection}
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
