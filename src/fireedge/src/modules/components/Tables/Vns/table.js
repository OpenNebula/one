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
import { RESOURCE_NAMES, T, VNET_THRESHOLD } from '@ConstantsModule'
import { VnAPI, useAuth, useViews } from '@FeaturesModule'
import { getResourceLabels } from '@UtilsModule'
import {
  getColorFromString,
  getLeasesInfo,
  getVirtualNetworkState,
} from '@ModelsModule'
import { Tr } from '@modules/components/HOC'
import MultipleTags from '@modules/components/MultipleTags'
import {
  LinearProgressWithLabel,
  StatusCircle,
} from '@modules/components/Status'
import EnhancedTable, {
  createColumns,
} from '@modules/components/Tables/Enhanced'
import {
  areArraysEqual,
  sortStateTables,
} from '@modules/components/Tables/Enhanced/Utils/DataTableUtils'
import WrapperRow from '@modules/components/Tables/Enhanced/WrapperRow'
import VNetworkColumns from '@modules/components/Tables/Vns/columns'
import VNetworkRow from '@modules/components/Tables/Vns/row'
import { ReactElement, useCallback, useEffect, useMemo, useState } from 'react'
import { useFormContext } from 'react-hook-form'

const DEFAULT_DATA_CY = 'vnets'

/**
 * @param {object} props - Props
 * @returns {ReactElement} Virtual networks table
 */
const VnsTable = (props) => {
  const { labels = {} } = useAuth()
  const {
    rootProps = {},
    searchProps = {},
    useQuery = VnAPI.useGetVNetworksQuery,
    vdcVnets,
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
        if (vdcVnets) {
          const dataRequest = result.data ?? []
          rtn.data = dataRequest.filter((vnet) => vdcVnets.includes(vnet?.ID))
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
          LABELS: getResourceLabels(labels, row?.ID, RESOURCE_NAMES.VNET, true),
        },
      })),
    [data]
  )

  const columns = useMemo(
    () =>
      createColumns({
        filters: getResourceView(RESOURCE_NAMES.VNET)?.filters,
        columns: VNetworkColumns,
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
  useEffect(() => refetch(), [])

  const listHeader = [
    {
      header: '',
      id: 'status-icon',
      accessor: (template) => {
        const { color: stateColor, name: stateName } =
          getVirtualNetworkState(template)

        return <StatusCircle color={stateColor} tooltip={stateName} />
      },
    },
    { header: T.ID, id: 'id', accessor: 'ID' },
    { header: T.Name, id: 'name', accessor: 'NAME' },
    {
      header: T.Clusters,
      id: 'clusters',
      accessor: ({ CLUSTERS }) => {
        const clusters = useMemo(
          () => [CLUSTERS?.ID ?? []].flat(),
          [CLUSTERS?.ID]
        )

        return clusters.length && clusters[0]
      },
    },
    {
      header: T.Leases,
      id: 'leases',
      accessor: (template) => {
        const leasesInfo = useMemo(() => getLeasesInfo(template), [template])
        const { percentOfUsed, percentLabel } = leasesInfo

        return (
          <LinearProgressWithLabel
            value={percentOfUsed}
            high={VNET_THRESHOLD.LEASES.high}
            low={VNET_THRESHOLD.LEASES.low}
            label={percentLabel}
            title={`${Tr(T.Used)} / ${Tr(T.TotalLeases)}`}
          />
        )
      },
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

  const { component, header } = WrapperRow(RowComponent ?? VNetworkRow)

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
      resourceType={RESOURCE_NAMES.VNET}
      {...rest}
    />
  )
}

VnsTable.propTypes = { ...EnhancedTable.propTypes }
VnsTable.displayName = 'VirtualNetworksTable'

export default VnsTable
