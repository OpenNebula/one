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
import { DS_THRESHOLD, RESOURCE_NAMES, T } from '@ConstantsModule'
import { getResourceLabels } from '@UtilsModule'
import { DatastoreAPI, useAuth, useViews } from '@FeaturesModule'
import {
  getColorFromString,
  getDatastoreCapacityInfo,
  getDatastoreState,
  getDatastoreType,
} from '@ModelsModule'
import MultipleTags from '@modules/components/MultipleTags'
import {
  LinearProgressWithLabel,
  StatusCircle,
} from '@modules/components/Status'
import DatastoreColumns from '@modules/components/Tables/Datastores/columns'
import DatastoreRow from '@modules/components/Tables/Datastores/row'
import EnhancedTable, {
  createColumns,
} from '@modules/components/Tables/Enhanced'
import {
  areArraysEqual,
  sortStateTables,
} from '@modules/components/Tables/Enhanced/Utils/DataTableUtils'
import WrapperRow from '@modules/components/Tables/Enhanced/WrapperRow'
import { ReactElement, useCallback, useEffect, useMemo, useState } from 'react'
import { useFormContext } from 'react-hook-form'

const DEFAULT_DATA_CY = 'datastores'

/**
 * @param {object} props - Props
 * @returns {ReactElement} Datastores table
 */
const DatastoresTable = (props) => {
  const { labels = {} } = useAuth()
  const {
    rootProps = {},
    searchProps = {},
    useQuery = DatastoreAPI.useGetDatastoresQuery,
    vdcDatastores,
    zoneId,
    dependOf,
    filter,
    reSelectRows,
    value,
    RowComponent,
    ...rest
  } = props ?? {}
  rootProps['data-cy'] ??= DEFAULT_DATA_CY
  searchProps['data-cy'] ??= `search-${DEFAULT_DATA_CY}`

  const { view, getResourceView } = useViews()

  let values

  if (typeof filter === 'function' && dependOf) {
    const { watch } = useFormContext()

    const getDataForDepend = useCallback(
      (n) => {
        let dependName = n
        // removes character '$'
        if (n.startsWith('$')) dependName = n.slice(1)

        return watch(dependName)
      },
      [dependOf]
    )

    const valuesOfDependField = () => {
      if (!dependOf) return null

      return Array.isArray(dependOf)
        ? dependOf.map(getDataForDepend)
        : getDataForDepend(dependOf)
    }
    values = valuesOfDependField()
  }

  const {
    data = [],
    isFetching,
    refetch,
  } = useQuery(
    { zone: zoneId },
    {
      selectFromResult: (result) => {
        const rtn = { ...result }
        if (vdcDatastores) {
          const dataRequest = result.data ?? []
          rtn.data = dataRequest.filter((ds) => vdcDatastores.includes(ds?.ID))
        } else if (typeof filter === 'function') {
          rtn.data = filter(result.data ?? [], values ?? [])
        }

        return rtn
      },
    }
  )

  const fmtData = useMemo(
    () =>
      data?.map((row) => ({
        ...row,
        TEMPLATE: {
          ...(row?.TEMPLATE ?? {}),
          LABELS: getResourceLabels(
            labels,
            row?.ID,
            RESOURCE_NAMES.DATASTORE,
            true
          ),
        },
      })),
    [data, labels]
  )

  const columns = useMemo(
    () =>
      createColumns({
        filters: getResourceView(RESOURCE_NAMES.DATASTORE)?.filters,
        columns: DatastoreColumns,
      }),
    [view]
  )

  const [stateData, setStateData] = useState(data)

  const updateSelectedRows = () => {
    if (Array.isArray(values) && typeof reSelectRows === 'function') {
      const datastores = data
        .filter((dataObject) => value.includes(dataObject.ID))
        .map((dataObject) => dataObject.ID)

      const sortedDatastores = sortStateTables(datastores)
      const sortedValue = sortStateTables(value)
      if (!areArraysEqual(sortedValue, sortedDatastores)) {
        reSelectRows(sortedDatastores)
        setStateData(data)
      }
    }
  }

  useEffect(() => {
    updateSelectedRows()
  }, [dependOf])

  useEffect(() => {
    if (JSON.stringify(data) !== JSON.stringify(stateData)) {
      updateSelectedRows()
    }
  })

  const listHeader = [
    {
      header: T.Status,
      id: 'status',
      accessor: (template) => {
        const { color: stateColor, name: stateName } =
          getDatastoreState(template)

        return <StatusCircle color={stateColor} tooltip={stateName} />
      },
    },
    { header: T.ID, id: 'id', accessor: 'ID' },
    { header: T.Name, id: 'name', accessor: 'NAME' },
    {
      header: T.Capacity,
      id: 'capacity',
      accessor: (template) => {
        const capacity = useMemo(
          () => getDatastoreCapacityInfo(template),
          [template]
        )
        const { percentOfUsed, percentLabel } = capacity

        return (
          <LinearProgressWithLabel
            value={percentOfUsed}
            label={percentLabel}
            high={DS_THRESHOLD.CAPACITY.high}
            low={DS_THRESHOLD.CAPACITY.low}
            title={T.UsedOfTotal}
          />
        )
      },
    },
    {
      header: T.Cluster,
      id: 'cluster',
      accessor: ({ CLUSTERS }) => {
        const clusters = useMemo(
          () => [CLUSTERS?.ID ?? []].flat(),
          [CLUSTERS?.ID]
        )

        return clusters.length && clusters[0]
      },
    },
    {
      header: T.Type,
      id: 'type',
      accessor: (template) => getDatastoreType(template),
    },
    { header: T.Owner, id: 'owner', accessor: 'UNAME' },
    { header: T.Group, id: 'group', accessor: 'GNAME' },
    {
      header: T.Labels,
      id: 'labels',
      accessor: ({ TEMPLATE: { LABELS = [] } }) => {
        const fmtLabels = LABELS?.map((label) => ({
          text: label,
          dataCy: `label-${label}`,
          stateColor: getColorFromString(label),
        }))

        return <MultipleTags tags={fmtLabels} truncateText={10} />
      },
    },
  ]
  const { component, header } = WrapperRow(RowComponent ?? DatastoreRow)

  return (
    <EnhancedTable
      columns={columns}
      data={fmtData}
      rootProps={rootProps}
      searchProps={searchProps}
      refetch={refetch}
      isLoading={isFetching}
      getRowId={(row) => String(row.ID)}
      dataDepend={values}
      RowComponent={component}
      headerList={header && listHeader}
      resourceType={RESOURCE_NAMES.DATASTORE}
      {...rest}
    />
  )
}

DatastoresTable.propTypes = { ...EnhancedTable.propTypes }
DatastoresTable.displayName = 'DatastoresTable'

export default DatastoresTable
