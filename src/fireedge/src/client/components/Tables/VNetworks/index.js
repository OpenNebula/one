/* ------------------------------------------------------------------------- *
 * Copyright 2002-2021, OpenNebula Project, OpenNebula Systems               *
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
/* eslint-disable jsdoc/require-jsdoc */
import React, { useEffect } from 'react'

import { useFetch } from 'client/hooks'
import { useVNetwork, useVNetworkApi } from 'client/features/One'

import { SkeletonTable, EnhancedTable } from 'client/components/Tables'
import VNetworkColumns from 'client/components/Tables/VNetworks/columns'
import VNetworkRow from 'client/components/Tables/VNetworks/row'

const VNetworksTable = () => {
  const columns = React.useMemo(() => VNetworkColumns, [])

  const vNetworks = useVNetwork()
  const { getVNetworks } = useVNetworkApi()

  const { status, fetchRequest, loading, reloading, STATUS } = useFetch(getVNetworks)
  const { INIT, PENDING } = STATUS

  useEffect(() => { fetchRequest() }, [])

  if (vNetworks?.length === 0 && [INIT, PENDING].includes(status)) {
    return <SkeletonTable />
  }

  return (
    <EnhancedTable
      columns={columns}
      data={vNetworks}
      isLoading={loading || reloading}
      getRowId={row => String(row.ID)}
      RowComponent={VNetworkRow}
    />
  )
}

export default VNetworksTable
