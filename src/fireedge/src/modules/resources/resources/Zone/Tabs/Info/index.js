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
/* eslint-disable react/prop-types */
import { Box } from '@mui/material'
import PropTypes from 'prop-types'
import { ReactElement } from 'react'

import { AttributesPanel, Table } from '@ComponentsV2Module'

import { getStyles } from '@modules/resources/resources/Host/Tabs/Info/styles'

import { T } from '@ConstantsModule'

/**
 * Renders mainly information tab.
 *
 * @param {object} props - Props
 * @param {object} props.data - Tab specific data
 * @param {object} props.config - Tab view configuration
 * @returns {ReactElement} Information tab
 */
export const ZoneInfoTab = ({ data, config }) => {
  const { selected } = data

  const formattedAttributes = Object.entries(selected?.TEMPLATE ?? {}).map(
    ([key, value]) => ({ key, value })
  )

  const {
    server_pool_panel: serverPoolPanel,
    attributes_panel: attributesPanel,
  } = config

  const serverPool = selected?.SERVER_POOL?.SERVER
  const formattedServerPool = (
    Array.isArray(serverPool) ? serverPool : serverPool ? [serverPool] : []
  ).map((element) => ({
    ID: element?.ID || '-',
    NAME: element?.NAME || '-',
    ENDPOINT: element?.ENDPOINT ?? element?.TEMPLATE?.ENDPOINT ?? '-',
  }))

  const serverPoolColumns = [
    { header: T.ID, accessorKey: 'ID', grow: false },
    { header: T.Name, accessorKey: 'NAME', truncate: true },
    { header: T.Endpoint, accessorKey: 'ENDPOINT' },
  ]

  return (
    <Box sx={(theme) => getStyles({ theme })}>
      {serverPoolPanel?.enabled && formattedServerPool?.length > 0 && (
        <Table
          title={T.ServerPool}
          columns={serverPoolColumns}
          data={formattedServerPool}
          isRowsSelectable={false}
          isDisablePagination
        />
      )}

      {attributesPanel?.enabled && formattedAttributes && (
        <AttributesPanel
          title={T.Attributes}
          attributes={formattedAttributes}
          actions={attributesPanel?.actions}
        />
      )}
    </Box>
  )
}

ZoneInfoTab.propTypes = {
  data: PropTypes.object,
  config: PropTypes.object,
}

ZoneInfoTab.displayName = 'ZoneInfoTab'
ZoneInfoTab.id = 'info'
ZoneInfoTab.title = T.Info
