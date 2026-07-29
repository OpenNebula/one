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
import { RESOURCE_NAMES, T } from '@ConstantsModule'
import { DatastoreAPI } from '@FeaturesModule'
import { datastoreTable } from '@ModelsModule'

/**
 * @param {object} value - Resource ids
 * @returns {string[]} Resource ids
 */
const getResourceIds = (value) =>
  [value ?? []].flat().filter(Boolean).map(String)

/**
 * Cluster datastores tab.
 *
 * @param {object} root0 - Params
 * @param {object} root0.data - Cluster tab data
 * @returns {Component} Cluster datastores tab
 */
export const Datastores = ({ data }) => {
  const { selected = {} } = data
  const { data: datastores = [], isFetching } =
    DatastoreAPI.useGetDatastoresQuery()

  const clusterDatastoreIds = useMemo(
    () => getResourceIds(selected?.DATASTORES?.ID),
    [selected]
  )

  const datastoreData = useMemo(
    () =>
      []
        .concat(datastores ?? [])
        .filter((datastore) =>
          clusterDatastoreIds.includes(String(datastore?.ID))
        ),
    [datastores, clusterDatastoreIds]
  )

  const columns = useMemo(
    () =>
      datastoreTable
        .columns()
        .filter(({ id }) => !['owner', 'group', 'labels'].includes(id)),
    []
  )

  return (
    <Table
      dataCy={datastoreTable.dataCy}
      columns={columns}
      data={datastoreData}
      isRowsSelectable={false}
      isLoading={isFetching}
      openRowDetailsOnClick
      rowDetailsResourceId={RESOURCE_NAMES.DATASTORE}
    />
  )
}

Datastores.propTypes = {
  data: PropTypes.object,
  config: PropTypes.object,
}

Datastores.id = 'datastore'
Datastores.title = T.Datastores
