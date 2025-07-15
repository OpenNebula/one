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
import MultipleTags from '@modules/components/MultipleTags'
import { Component, useMemo, useCallback } from 'react'
import { CloudDownload } from 'iconoir-react'

import {
  useAuth,
  useViews,
  useModalsApi,
  VrTemplateAPI,
  MarketplaceAppAPI,
} from '@FeaturesModule'
import { getResourceLabels } from '@UtilsModule'
import { getColorFromString, timeToString } from '@ModelsModule'
import { RESOURCE_NAMES, T, STYLE_BUTTONS } from '@ConstantsModule'
import { Box } from '@mui/material'
import EnhancedTable, {
  createColumns,
} from '@modules/components/Tables/Enhanced'
import WrapperRow from '@modules/components/Tables/Enhanced/WrapperRow'
import VrTemplateColumns from '@modules/components/Tables/VrTemplates/columns'
import VrTemplateRow from '@modules/components/Tables/VrTemplates/row'
import SubmitButton from '@modules/components/FormControl/SubmitButton'
import { ExportForm } from '@modules/components/Forms/MarketplaceApp'

const DEFAULT_DATA_CY = 'vrouter-templates'

/**
 * @param {object} props - Table props
 * @returns {Component} - Vr Templates table
 */
const VrTemplatesTable = (props) => {
  const { showModal } = useModalsApi()
  const [exportApp] = MarketplaceAppAPI.useExportAppMutation()
  const { data: defaultVrApp = [], isFetching: loadingApps } =
    MarketplaceAppAPI.useGetMarketplaceAppsQuery(undefined, {
      selectFromResult: ({ data: result = [] }) => ({
        data: result?.find(
          (app) =>
            app?.MARKETPLACE === 'OpenNebula Public' &&
            app?.NAME === 'Service Virtual Router'
        ),
      }),
    })
  const { rootProps = {}, searchProps = {}, ...rest } = props ?? {}
  const { labels = {} } = useAuth()

  rootProps['data-cy'] ??= DEFAULT_DATA_CY
  searchProps['data-cy'] ??= `search-${DEFAULT_DATA_CY}`

  const { view, getResourceView } = useViews()
  const {
    data = [],
    isFetching: loadingTemplates,
    refetch,
  } = VrTemplateAPI.useGetVrTemplatesQuery()

  const loading = loadingTemplates || loadingApps

  const fmtData = useMemo(
    () =>
      data?.map((row) => ({
        ...row,
        TEMPLATE: {
          ...(row?.TEMPLATE ?? {}),
          LABELS: getResourceLabels(
            labels,
            row?.ID,
            RESOURCE_NAMES.VM_TEMPLATE,
            true
          ),
        },
      })),
    [data, labels]
  )

  const columns = useMemo(
    () =>
      createColumns({
        filters: getResourceView(RESOURCE_NAMES.VM_TEMPLATE)?.filters,
        columns: VrTemplateColumns,
      }),
    [view]
  )

  const handleSubmit = useCallback(
    async (formData) => {
      await exportApp({ id: defaultVrApp.ID, ...formData })
      refetch()
    },
    [defaultVrApp]
  )

  const handleExportApp = () => {
    showModal({
      id: 'export-default-vr',
      dialogProps: {
        title: T.DownloadDefaultImage,
        dataCy: 'modal-download-vr-app',
      },
      form: ExportForm({
        initialValues: defaultVrApp,
        stepProps: defaultVrApp,
      }),
      onSubmit: handleSubmit,
    })
  }

  const NoDataAvailable = () => (
    <Box
      sx={{
        width: 'fit-content',
        height: 'fit-content',
      }}
    >
      <SubmitButton
        dataCy="download-vr-app"
        icon=<CloudDownload />
        label={T.DownloadDefaultImage}
        importance={STYLE_BUTTONS.IMPORTANCE.MAIN}
        size={STYLE_BUTTONS.SIZE.MEDIUM}
        type={STYLE_BUTTONS.TYPE.FILLED}
        disabled={loading}
        onClick={handleExportApp}
      />
    </Box>
  )

  const listHeader = [
    { header: T.ID, id: 'id', accessor: 'ID' },
    { header: T.Name, id: 'name', accessor: 'NAME' },
    {
      header: T.RegistrationTime,
      id: 'registration-time',
      accessor: (template) => timeToString(template.REGTIME),
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

  const { component, header } = WrapperRow(VrTemplateRow)

  return (
    <EnhancedTable
      columns={columns}
      data={fmtData}
      rootProps={rootProps}
      searchProps={searchProps}
      refetch={refetch}
      isLoading={loading}
      getRowId={(row) => String(row.ID)}
      noDataCustomRenderer={<NoDataAvailable />}
      RowComponent={component}
      headerList={header && listHeader}
      resourceType={RESOURCE_NAMES.VM_TEMPLATE}
      {...rest}
    />
  )
}

VrTemplatesTable.propTypes = { ...EnhancedTable.propTypes }
VrTemplatesTable.displayName = 'VrTemplatesTable'

export default VrTemplatesTable
