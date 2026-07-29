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
import { clusterTable } from '@ModelsModule'

/**
 * @param {object} root0 - Params
 * @param {object} root0.data - Tab specific data
 * @returns {Component} - Datastore clusters tab
 */
export const Clusters = ({ data: tabData }) => {
  const datastoreId = [].concat(tabData?.selected).filter(Boolean)?.[0]?.ID

  const { data = [], isFetching } = clusterTable.useData(undefined, {
    selectFromResult: (result) => ({
      ...result,
      data: result?.data?.filter((cluster) => {
        if (datastoreId) {
          return [cluster?.DATASTORES?.ID ?? []]
            .flat()
            .map(String)
            .includes(String(datastoreId))
        }

        return true
      }),
    }),
  })

  const columns = useMemo(() => clusterTable.columns(), [])

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
      rowDetailsResourceId={RESOURCE_NAMES.CLUSTER}
    />
  )
}

Clusters.propTypes = {
  data: PropTypes.object,
  config: PropTypes.object,
}

Clusters.id = 'clusters'
Clusters.title = T.Clusters

export default Clusters
