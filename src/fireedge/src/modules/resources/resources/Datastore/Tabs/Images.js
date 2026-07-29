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
import { Component, useMemo } from 'react'

import { Table } from '@ComponentsV2Module'
import {
  DATASTORE_TYPES,
  IMAGE_TYPES_FOR_BACKUPS,
  RESOURCE_NAMES,
  T,
} from '@ConstantsModule'
import { imageTable } from '@ModelsModule'

/**
 * @param {object} root0 - Params
 * @param {object} root0.data - Tab specific data
 * @returns {Component} - Datastore images tab
 */
export const Images = ({ data: tabData }) => {
  const datastore = [].concat(tabData?.selected).filter(Boolean)?.[0]
  const datastoreId = datastore?.ID
  const isBackupDatastore = +datastore?.TYPE === DATASTORE_TYPES.BACKUP.id

  const { data = [], isFetching } = imageTable.useData(
    isBackupDatastore ? { imageTypes: IMAGE_TYPES_FOR_BACKUPS } : undefined,
    {
      selectFromResult: (result) => ({
        ...result,
        data: result?.data?.filter((image) => {
          if (datastoreId !== undefined && datastoreId !== null) {
            return String(image?.DATASTORE_ID) === String(datastoreId)
          }

          return true
        }),
      }),
    }
  )

  const columns = useMemo(
    () =>
      imageTable
        .columns()
        .filter(
          ({ id }) =>
            ![
              'locked',
              'labels',
              'disk_type',
              'persistent',
              'registration_time',
              'size',
            ].includes(id)
        ),
    []
  )

  return (
    <Table
      columns={columns}
      data={[].concat(data)}
      getRowId={(row) => String(row.ID)}
      isLoading={isFetching}
      isRowsSelectable={false}
      isEnableSearchBar={true}
      isEnableSort={true}
      isEnableFilters={true}
      size="medium"
      openRowDetailsOnClick
      rowDetailsResourceId={
        isBackupDatastore ? RESOURCE_NAMES.BACKUP : RESOURCE_NAMES.IMAGE
      }
    />
  )
}

Images.propTypes = {
  data: PropTypes.object,
  config: PropTypes.object,
}

Images.id = 'images'
Images.title = T.Images

export default Images
