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
import { Box, Grid, useTheme } from '@mui/material'
import { SubmitButton } from '@modules/components/FormControl'
import { Component, useEffect, useMemo, useState } from 'react'
import { DatastoreDialog } from '@modules/components/Tables/VrTemplates/DatastoreSelectionDialog'

import { RESOURCE_NAMES, T, STYLE_BUTTONS } from '@ConstantsModule'
import {
  useViews,
  useGeneralApi,
  MarketplaceAPI,
  VrTemplateAPI,
  MarketplaceAppAPI,
  DatastoreAPI,
} from '@FeaturesModule'
import { BoxIso as DownloadIcon } from 'iconoir-react'

import { Tr, Translate } from '@modules/components/HOC'
import EnhancedTable, {
  createColumns,
} from '@modules/components/Tables/Enhanced'
import WrapperRow from '@modules/components/Tables/Enhanced/WrapperRow'
import VrTemplateColumns from '@modules/components/Tables/VrTemplates/columns'
import VrTemplateRow from '@modules/components/Tables/VrTemplates/row'
import { useStyles } from '@modules/components/Tabs/EmptyTab/styles'
import { timeToString } from '@ModelsModule'
import InfoEmpty from 'iconoir-react/dist/InfoEmpty'
import { debounce } from 'lodash'

const DEFAULT_DATA_CY = 'vrouter-templates'

/**
 * @param {object} props - Table props
 * @returns {Component} - Vr Templates table
 */
const VrTemplatesTable = (props) => {
  const { rootProps = {}, searchProps = {}, ...rest } = props ?? {}

  const theme = useTheme()
  const classes = useMemo(() => useStyles(theme), [theme])

  rootProps['data-cy'] ??= DEFAULT_DATA_CY
  searchProps['data-cy'] ??= `search-${DEFAULT_DATA_CY}`

  const { enqueueError, enqueueSuccess, enqueueInfo } = useGeneralApi()
  const { view, getResourceView } = useViews()
  const [loading, setLoading] = useState(false)
  const [oneMarket, setOneMarket] = useState(null)
  const [defaultImage, setDefaultImage] = useState(null)
  const [disableDownload, setDisableDownload] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [enableMarketplace] = MarketplaceAPI.useEnableMarketplaceMutation()
  const [exportApp] = MarketplaceAppAPI.useExportAppMutation()
  const {
    data = [],
    isFetching,
    refetch,
  } = VrTemplateAPI.useGetVrTemplatesQuery()
  const [
    fetchMarketplaces,
    { data: marketplaces = [], isFetching: fetchingMarketplaces },
  ] = MarketplaceAPI.useLazyGetMarketplacesQuery(undefined, {
    skip: true, // Does not run on initial render
  })

  const [
    fetchDatastores,
    { data: datastores = [], isFetching: fetchingDatastores },
  ] = DatastoreAPI.useLazyGetDatastoresQuery(undefined, {
    skip: true, // Does not run on initial render
  })

  const [
    fetchMarketplaceApps,
    { data: marketplaceApps = [], isFetching: fetchingMarketplaceApps },
  ] = MarketplaceAppAPI.useLazyGetMarketplaceAppsQuery(undefined, {
    skip: true,
  }) // Does not run on initial render

  useEffect(() => {
    setLoading(isFetching || fetchingMarketplaces)
  }, [isFetching, fetchingMarketplaces])

  const columns = useMemo(
    () =>
      createColumns({
        filters: getResourceView(RESOURCE_NAMES.VM_TEMPLATE)?.filters,
        columns: VrTemplateColumns,
      }),
    [view]
  )

  const submitDisabled = useMemo(
    () =>
      !(
        !fetchingMarketplaces &&
        !fetchingMarketplaceApps &&
        !fetchingDatastores
      ),
    [fetchingMarketplaces, fetchingMarketplaceApps, fetchingDatastores]
  )

  const handleDownloadDefaultImage = debounce(
    async () => {
      // Use cache if exists
      setDisableDownload(true)
      await fetchMarketplaces(undefined, true)
      await fetchDatastores(undefined, true)
      if (defaultImage !== null) {
        setDialogOpen(true)
      }
    },
    4000,
    { leading: true }
  )

  useEffect(() => {
    if (marketplaces?.length) {
      const mid =
        marketplaces?.find(
          (marketplace) => marketplace?.NAME === 'OpenNebula Public'
        ) ?? null
      mid !== null &&
        setOneMarket({
          ID: mid?.ID ?? -1,
          STATE: mid?.STATE === '0' ? 'ENABLED' : 'DISABLED',
        })
    }
  }, [marketplaces])

  useEffect(() => {
    // Internal ASYNC funcs -->

    const fetchApps = async () => {
      await fetchMarketplaceApps(undefined, true) // Prefer cache
    }

    const enableMarket = async (marketID) => {
      const response = await enableMarketplace({ id: marketID })
      if (response?.data === parseInt(marketID, 10)) {
        enqueueInfo(T.InfoEnableOpenNebulaMarketplace)
        setOneMarket({ ...oneMarket, STATE: 'ENABLED' })
        fetchApps()
      }

      return response
    }

    // <--Internal ASYNC funcs

    try {
      if (
        oneMarket !== null &&
        oneMarket?.ID !== -1 &&
        oneMarket?.STATE !== 'ENABLED'
      ) {
        enableMarket(oneMarket?.ID).catch(console.error)

        // Prefer cache
      } else if (
        oneMarket !== null &&
        oneMarket?.ID !== -1 &&
        oneMarket?.STATE === 'ENABLED'
      ) {
        fetchApps()
      }
    } catch {}
  }, [oneMarket])

  useEffect(() => {
    if (marketplaceApps?.length && !fetchingMarketplaceApps) {
      const vrTemplate =
        marketplaceApps?.find(
          (app) => app?.NAME === 'Service Virtual Router'
        ) ?? null
      setDefaultImage(vrTemplate)
    }
  }, [marketplaceApps])

  useEffect(() => {
    if (defaultImage !== null && !fetchingDatastores) {
      setDisableDownload(true)
      setDialogOpen(true)
    }
  }, [defaultImage, datastores])

  const handleCloseDialog = () => {
    setDialogOpen(false)
    setDisableDownload(false)
  }

  const handleDownloadApp = async (datastoreId) => {
    await exportApp({
      id: defaultImage?.ID,
      name: 'Service Virtual Router',
      vmname: 'Service Virtual Router',
      datastore: datastoreId,
    })
      .then((res) => {
        if (res?.data) {
          enqueueSuccess(T.SuccessDownloadDefaultImage) && refetch()
        } else if (res?.error) {
          enqueueError(res.error)
        } else {
          throw new Error('Unexpected problem occured')
        }
      })
      .catch((error) => {
        console.error(error)
      })
  }

  const filterDatastores = useMemo(() =>
    datastores?.filter((ds) => ds?.TYPE === '0')
  )

  const NoDataAvailable = () => (
    <>
      <Grid
        container
        sx={{
          alignItems: 'start',
          justifyContent: 'start',
          width: '100%',
          height: '100%',
        }}
      >
        <Grid item xs={12}>
          <Box className={classes.noDataMessage}>
            <InfoEmpty />
            <Translate word={T.NoDataAvailable} />
            <SubmitButton
              importance={STYLE_BUTTONS.IMPORTANCE.MAIN}
              size={STYLE_BUTTONS.SIZE.MEDIUM}
              type={STYLE_BUTTONS.TYPE.FILLED}
              disabled={disableDownload}
              icon={<DownloadIcon />}
              onClick={() => handleDownloadDefaultImage()}
              label={Tr(T.DownloadDefaultImage)}
            />
          </Box>
        </Grid>
      </Grid>

      <DatastoreDialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        datastores={filterDatastores}
        submitDisabled={submitDisabled}
        onSelect={(ds) => handleDownloadApp(ds?.ID ?? -1)}
      />
    </>
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
  ]

  const { component, header } = WrapperRow(VrTemplateRow)

  return (
    <EnhancedTable
      columns={columns}
      data={useMemo(() => data, [data])}
      rootProps={rootProps}
      searchProps={searchProps}
      refetch={refetch}
      isLoading={loading}
      getRowId={(row) => String(row.ID)}
      noDataCustomRenderer={<NoDataAvailable />}
      RowComponent={component}
      headerList={header && listHeader}
      {...rest}
    />
  )
}

VrTemplatesTable.propTypes = { ...EnhancedTable.propTypes }
VrTemplatesTable.displayName = 'VrTemplatesTable'

export default VrTemplatesTable
