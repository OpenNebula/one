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
import {
  AlertDialog,
  AlertNotification,
  Button,
  CodeSnippet,
  Image,
  ProgressBar,
  StatusTag,
  TablePanel,
} from '@ComponentsModule'
import { Box, Link, Stack, Typography } from '@mui/material'
import { ArrowTrSquare, Plus } from 'iconoir-react'
import PropTypes from 'prop-types'
import { Component, useEffect, useMemo, useRef } from 'react'
import { generatePath, useHistory } from 'react-router-dom'

import { PATH, RESOURCE_NAMES, T } from '@ConstantsModule'
import { SystemAPI, useModalsApi } from '@FeaturesModule'
import { useClipboard } from '@HooksModule'
import { useResourceSingleViewContext, useTranslation } from '@ProvidersModule'
import { generateDocLink, sentenceCase } from '@UtilsModule'
import { scale } from '@StylesModule'
import {
  getApplicationDescription,
  getApplicationImage,
  getApplicationName,
  getApplicationStateColor,
  oneksApplicationTable,
} from '@ModelsModule'
import { ApplicationImagePlaceholder } from '@modules/resources/OneKs/ApplicationImagePlaceholder'
import { getStyles } from '@modules/resources/OneKs/Tabs/Applications/styles'

const MONITORING_DOC_PATH =
  'platform_services/oneks/management/configuration/#monitor-configuration'

/**
 * @param {object} props - Dialog properties
 * @param {string} props.releaseName - Application release name
 * @param {Function} props.onClose - Close the dialog
 * @returns {object} Application log instructions dialog
 */
const ApplicationLogInstructions = ({ releaseName, onClose }) => {
  const { translate } = useTranslation()
  const { copy, isCopied } = useClipboard()
  const code = `kubectl -n kube-system logs -f --all-containers=true --tail=-1 -l helmcharts.helm.cattle.io/chart=${releaseName}`

  return (
    <AlertDialog
      title={translate(T.ApplicationLogInstructions)}
      dataCy="oneks-application-log-instructions"
      onClose={onClose}
      actionsProps={{
        cancel: { label: translate(T.Close), onClick: onClose },
        confirm: {
          label: translate(isCopied(code) ? T.Copied : T.Copy),
          onClick: () => copy(code),
        },
      }}
      sx={{
        width: '680px',
        maxWidth: 'calc(100vw - 32px)',
        actions: { justifyContent: 'flex-end' },
      }}
    >
      <Stack
        gap={2}
        sx={{
          '&& .topbar': { py: 0 },
          '&& .code-container': {
            pt: 0,
            whiteSpace: 'pre-wrap',
            wordBreak: 'normal',
            overflowWrap: 'anywhere',
            '& > code': { minWidth: 0 },
          },
        }}
      >
        <Typography variant="body2">
          {translate(T.ApplicationInstallationLogsHint, [releaseName])}
        </Typography>
        <CodeSnippet code={code} />
      </Stack>
    </AlertDialog>
  )
}

ApplicationLogInstructions.propTypes = {
  releaseName: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
}

/**
 * @param {object} props - Table cell properties
 * @param {object} props.row - Application row
 * @returns {object} Application state and component progress
 */
const ApplicationStateCell = ({ row }) => {
  const { translate } = useTranslation()
  const { showModal } = useModalsApi()
  const application = row.original
  const dependencies = application.dependencies ?? []
  const components = [...dependencies, application]
  const ready = components.filter(({ state }) => state === 'ready').length
  const deleting = application.deleting
  const total = application.componentsTotal ?? components.length
  const completed = deleting ? Math.max(0, total - components.length) : ready
  const progress = Math.round((completed / total) * 100)

  return (
    <Stack gap={1}>
      <Stack direction="row" alignItems="center" gap={1}>
        {application.state ? (
          <StatusTag
            statusColor={getApplicationStateColor(application.state)}
            statusName={sentenceCase(application.state)}
          />
        ) : (
          '-'
        )}
      </Stack>
      {(deleting ||
        application.state === 'installing' ||
        dependencies.length > 0) &&
        completed < total && (
          <Stack gap={1}>
            <ProgressBar
              size="extraSmall"
              value={progress}
              label={translate(
                deleting
                  ? T.ApplicationComponentsDeleted
                  : T.ApplicationComponentsReady,
                [completed, total]
              )}
              isLabelVisible
            />
            <Link
              component="button"
              type="button"
              variant="body2"
              underline="hover"
              sx={{
                alignSelf: 'flex-start',
                textAlign: 'left',
                color: 'text.action',
              }}
              onClick={(event) => {
                event.stopPropagation()
                showModal({
                  isCustomDialog: true,
                  form: ApplicationLogInstructions,
                  customDialogProps: { releaseName: application.release_name },
                })
              }}
            >
              {translate(T.ViewLogInstructions)}
            </Link>
          </Stack>
        )}
    </Stack>
  )
}

ApplicationStateCell.propTypes = { row: PropTypes.object }

const columns = oneksApplicationTable.columns().map((column) => {
  if (column.id === 'state') {
    return {
      ...column,
      cell: ApplicationStateCell,
      meta: { ...column.meta, disableCellTooltip: true },
    }
  }

  return column.id === 'application'
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
                  <Typography variant="caption" color="text.body" noWrap>
                    {description}
                  </Typography>
                )}
              </Box>
            </Box>
          )
        },
      }
    : column
})

/**
 * Render applications tab.
 *
 * @param {object} root0 - Params
 * @param {object} root0.data - Tab data, including cluster feature flags
 * @returns {Component} Applications tab
 */
const Applications = ({ data }) => {
  const { translate } = useTranslation()
  const { data: version } = SystemAPI.useGetOneVersionQuery()
  const monitoringDocLink = generateDocLink(version, MONITORING_DOC_PATH)
  const { clusterFeatures = {} } = data
  const isMonitoringEnabled =
    typeof clusterFeatures === 'object' && clusterFeatures?.monitor === true

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
    data: allApplications = [],
    isFetching,
    isError,
  } = oneksApplicationTable.useData(
    { id, all: true, showNotification: false },
    { skip: !id || !isMonitoringEnabled }
  )
  const applicationProgress = useRef(new Map())
  const applications = useMemo(
    () =>
      allApplications
        .filter(({ parent }) => !parent)
        .map((application) => {
          const dependencies = allApplications.filter(
            ({ parent }) => parent === application.release_name
          )
          const previous = applicationProgress.current.get(
            `${id}:${application.release_name}`
          )
          const componentsTotal = Math.max(
            previous?.componentsTotal ?? 0,
            dependencies.length + 1
          )
          const deleting =
            application.state === 'deleting' ||
            dependencies.some(({ state }) => state === 'deleting') ||
            previous?.deleting === true ||
            dependencies.length + 1 < componentsTotal

          return {
            ...application,
            state:
              deleting && application.state !== 'error'
                ? 'deleting'
                : application.state,
            dependencies,
            componentsTotal,
            deleting,
          }
        }),
    [allApplications, id]
  )
  useEffect(() => {
    applicationProgress.current = new Map(
      applications.map((application) => [
        `${id}:${application.release_name}`,
        {
          componentsTotal: application.componentsTotal,
          deleting: application.deleting,
        },
      ])
    )
  }, [applications, id])
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
  const handleOpenMonitoringDocumentation = () => {
    monitoringDocLink &&
      window.open(monitoringDocLink, '_blank', 'noopener,noreferrer')
  }

  return (
    <Box sx={(theme) => getStyles({ theme })}>
      <Box className="applications-actions">
        <Button
          dataCy="install-oneks-application"
          startIcon={<Plus />}
          title={T.InstallApplication}
          type="secondary"
          isDisabled={!id || !isMonitoringEnabled}
          tooltip={
            !isMonitoringEnabled
              ? T.ApplicationInstallationRequiresMonitoring
              : undefined
          }
          tooltipLink={
            !isMonitoringEnabled && monitoringDocLink
              ? { text: translate(T.LearnMore), link: monitoringDocLink }
              : undefined
          }
          onClick={openInstallForm}
        />
      </Box>
      <Box className="applications-table">
        {isMonitoringEnabled && isError && (
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
          data={isMonitoringEnabled ? applications : []}
          isLoading={isMonitoringEnabled && isFetching}
          getRowId={(row) =>
            row.release_name ?? `missing-${applications.indexOf(row)}`
          }
          onRowClick={openApplication}
          isRowsSelectable={(row) => Boolean(row.original?.release_name)}
          rowSelection={selectedRelease ? { [selectedRelease]: true } : {}}
          onRowSelectionChange={() => undefined}
          isCopyColumn={false}
          emptyContentProps={
            isMonitoringEnabled
              ? { title: T.NoDataAvailable }
              : {
                  title: T.ApplicationMonitoringUnavailable,
                  subtitle: T.ApplicationMonitoringUnavailableConcept,
                  action: monitoringDocLink
                    ? handleOpenMonitoringDocumentation
                    : undefined,
                  actionTitle: translate(T.LearnMore),
                  actionProps: {
                    type: 'outline',
                    startIcon: null,
                    endIcon: <ArrowTrSquare />,
                  },
                }
          }
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
