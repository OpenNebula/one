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
import { AlertNotification, Button, Image, TablePanel } from '@ComponentsModule'
import { Box, Typography } from '@mui/material'
import { Plus } from 'iconoir-react'
import PropTypes from 'prop-types'
import { Component } from 'react'
import { generatePath, useHistory } from 'react-router-dom'

import { PATH, RESOURCE_NAMES, T } from '@ConstantsModule'
import { useResourceSingleViewContext } from '@ProvidersModule'
import { scale } from '@StylesModule'
import {
  getApplicationDescription,
  getApplicationImage,
  getApplicationName,
  oneksApplicationTable,
} from '@ModelsModule'
import { ApplicationImagePlaceholder } from '@modules/resources/OneKs/ApplicationImagePlaceholder'
import { getStyles } from '@modules/resources/OneKs/Tabs/Applications/styles'

const columns = oneksApplicationTable.columns().map((column) =>
  column.id === 'application'
    ? {
        ...column,
        cell: ({ row }) => {
          const application = row.original
          const name = getApplicationName(application) ?? ''
          const description =
            getApplicationDescription(application) ??
            (name !== application?.id ? application?.id : undefined)

          return (
            <Box
              sx={(theme) => ({
                display: 'flex',
                alignItems: 'center',
                gap: `${theme.scale[400]}px`,
                minWidth: 0,
              })}
            >
              <Image
                src={getApplicationImage(application)}
                alt={`${name}-logo`}
                width={scale[600]}
                height={scale[600]}
                aspectRatio="1/1"
                fallback={<ApplicationImagePlaceholder />}
              />
              <Box
                sx={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}
              >
                <Typography variant="body2" noWrap>
                  {name}
                </Typography>
                {description && (
                  <Typography variant="caption" color="text.secondary" noWrap>
                    {description}
                  </Typography>
                )}
              </Box>
            </Box>
          )
        },
      }
    : column
)

/**
 * Render applications tab.
 *
 * @param {object} root0 - Params
 * @param {object} root0.data - Tab data
 * @returns {Component} Applications tab
 */
const Applications = ({ data }) => {
  const history = useHistory()
  const { closeResourceSingleView, openResourceSingleView, stack } =
    useResourceSingleViewContext()
  const activeEntry = stack.entries[stack.activeIndex]
  const selectedRelease =
    activeEntry?.resource === RESOURCE_NAMES.ONEKS_APPLICATION &&
    String(activeEntry?.data?.cluster_id) ===
      String(data?.selected?.ID ?? data?.id)
      ? activeEntry.data.release_name
      : undefined
  const id = data?.selected?.ID ?? data?.id
  const {
    data: applications = [],
    isFetching,
    isError,
  } = oneksApplicationTable.useData({ id }, { skip: !id })
  const openApplication = (application) => {
    const releaseName = application?.release_name
    if (!id || !releaseName) return

    const clusterName = data?.selected?.NAME ?? id
    const applicationName = getApplicationName(application) ?? releaseName

    openResourceSingleView(
      RESOURCE_NAMES.ONEKS_APPLICATION,
      {
        ...application,
        ID: `${id}:${releaseName}`,
        NAME: applicationName,
        cluster_id: id,
        release_name: releaseName,
      },
      {
        breadcrumbs: [
          {
            label: T.KubernetesClusters,
            onClick: () => {
              closeResourceSingleView()
              history.push(PATH.ONEKS.LIST)
            },
          },
          {
            label: clusterName,
            onClick: () => {
              closeResourceSingleView()
              history.push(PATH.ONEKS.LIST, { selectedClusterId: id })
            },
          },
          { label: applicationName },
        ],
      }
    )
  }
  const openInstallForm = () =>
    history.push(generatePath(PATH.ONEKS.INSTALL_APPLICATION, { id }))

  return (
    <Box sx={(theme) => getStyles({ theme })}>
      <Box className="applications-actions">
        <Button
          dataCy="install-oneks-application"
          startIcon={<Plus />}
          title={T.InstallApplication}
          type="secondary"
          isDisabled={!id}
          onClick={openInstallForm}
        />
      </Box>
      <Box className="applications-table">
        {isError && (
          <AlertNotification
            type="primary"
            status="error"
            description={T.SomethingWrong}
            isDismissible={false}
          />
        )}
        <TablePanel
          dataCy={oneksApplicationTable.dataCy}
          columns={columns}
          data={applications}
          isLoading={isFetching}
          getRowId={(row) =>
            row.release_name ?? `missing-${applications.indexOf(row)}`
          }
          onRowClick={openApplication}
          isRowsSelectable={(row) => Boolean(row.original?.release_name)}
          rowSelection={selectedRelease ? { [selectedRelease]: true } : {}}
          onRowSelectionChange={() => undefined}
          isCopyColumn={false}
          emptyContentProps={{ title: T.NoDataAvailable }}
          isFullHeight
          isEnableSearchBar
          isEnableFilters
          isEnableSort
        />
      </Box>
    </Box>
  )
}

Applications.propTypes = {
  data: PropTypes.object,
  config: PropTypes.object,
}

Applications.displayName = 'Applications'
Applications.id = 'applications'
Applications.title = T.Applications

export default Applications
