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
import { Component, useCallback, useMemo } from 'react'

import { Box } from '@mui/material'

import {
  DetailsCard,
  ResourceActionConfirmation,
  SubmitButton,
} from '@ComponentsV2Module'
import { DRS_AUTOMATION, DRS_CONFIG_ATTRIBUTES, T } from '@ConstantsModule'
import {
  ClusterAPI,
  useGeneralApi,
  useModalsApi,
  useSystemData,
} from '@FeaturesModule'
import { UpdatePlanConfigurationForm } from '@modules/resources/resources/Cluster/Forms'
import ExecutionTimeline from '@modules/resources/resources/Cluster/Tabs/Drs/timeline'
import { getStyles } from '@modules/resources/resources/Cluster/Tabs/Drs/styles'
import { jsonToXml } from '@UtilsModule'

const { FULL } = DRS_AUTOMATION

const BASE_CONFIG_ATTRIBUTES = [
  DRS_CONFIG_ATTRIBUTES.MIGRATION_THRESHOLD,
  DRS_CONFIG_ATTRIBUTES.HOST_MIGRATION_THRESHOLD,
  DRS_CONFIG_ATTRIBUTES.DS_MIGRATION_THRESHOLD,
  DRS_CONFIG_ATTRIBUTES.PREDICTIVE,
  DRS_CONFIG_ATTRIBUTES.POLICY,
  DRS_CONFIG_ATTRIBUTES.AUTOMATION,
]

const WEIGHT_ATTRIBUTES = [
  DRS_CONFIG_ATTRIBUTES.CPU_USAGE_WEIGHT,
  DRS_CONFIG_ATTRIBUTES.CPU_WEIGHT,
  DRS_CONFIG_ATTRIBUTES.MEMORY_WEIGHT,
  DRS_CONFIG_ATTRIBUTES.NET_WEIGHT,
  DRS_CONFIG_ATTRIBUTES.DISK_WEIGHT,
]

const DRS_ATTRIBUTE_LABELS = {
  [DRS_CONFIG_ATTRIBUTES.MIGRATION_THRESHOLD]: T.MigrationThreshold,
  [DRS_CONFIG_ATTRIBUTES.HOST_MIGRATION_THRESHOLD]: T.HostMigrationThreshold,
  [DRS_CONFIG_ATTRIBUTES.DS_MIGRATION_THRESHOLD]: T.DsMigrationThreshold,
  [DRS_CONFIG_ATTRIBUTES.PREDICTIVE]: T.Predictive,
  [DRS_CONFIG_ATTRIBUTES.POLICY]: T.Policy,
  [DRS_CONFIG_ATTRIBUTES.AUTOMATION]: T.Automation,
  [DRS_CONFIG_ATTRIBUTES.CPU_USAGE_WEIGHT]: T.CpuUsage,
  [DRS_CONFIG_ATTRIBUTES.CPU_WEIGHT]: T.Cpu,
  [DRS_CONFIG_ATTRIBUTES.MEMORY_WEIGHT]: T.Memory,
  [DRS_CONFIG_ATTRIBUTES.NET_WEIGHT]: T.Network,
  [DRS_CONFIG_ATTRIBUTES.DISK_WEIGHT]: T.Disk,
}

const isEmptyObject = (value) => !value || Object.keys(value)?.length === 0

const getPlanActions = (optimizationPlan = {}) =>
  [].concat(optimizationPlan?.ACTION || []).filter(Boolean)

const formatValue = (value) => value ?? '-'

const formatWeight = (value) => {
  const numericValue = Number(value)

  return Number.isFinite(numericValue) ? numericValue * 100 : '-'
}

const getIntervalValue = (drsInterval) =>
  String(drsInterval) === '-1'
    ? T.DrsManualInterval
    : `${T.DrsInterval} ${drsInterval} ${T.Seconds}`

/**
 * @param {object} root0 - Params
 * @param {object} root0.oneDrs - OneDRS configuration
 * @returns {Component} - Weight details
 */
const WeightDetails = ({ oneDrs }) => (
  <Box className="drs-weights-list">
    {WEIGHT_ATTRIBUTES.map((name) => (
      <Box className="drs-weight-row" key={name}>
        <Box className="drs-weight-label">
          {`${DRS_ATTRIBUTE_LABELS?.[name]} %`}
        </Box>
        <Box className="drs-weight-value">{formatWeight(oneDrs?.[name])}</Box>
      </Box>
    ))}
  </Box>
)

WeightDetails.propTypes = {
  oneDrs: PropTypes.object,
}

/**
 * @param {object} root0 - Params
 * @param {object} root0.oneDrs - OneDRS configuration
 * @param {string|number} root0.drsInterval - OneDRS interval
 * @param {boolean} root0.isDrsEnabled - OneDRS is enabled
 * @returns {Array} - DetailsCard options
 */
const getConfigurationOptions = ({ oneDrs, drsInterval, isDrsEnabled }) => {
  const options = BASE_CONFIG_ATTRIBUTES.map((name) => [
    DRS_ATTRIBUTE_LABELS?.[name],
    formatValue(oneDrs?.[name]),
  ])

  const hasWeights = WEIGHT_ATTRIBUTES.some(
    (name) => oneDrs?.[name] !== undefined
  )

  if (hasWeights) {
    options.push([
      T.LoadBalanceWeights,
      <WeightDetails key="load-balance-weights" oneDrs={oneDrs} />,
    ])
  }

  if (isDrsEnabled) {
    options.unshift([T.Status, getIntervalValue(drsInterval)])
  }

  return options
}

/**
 * Cluster DRS tab.
 *
 * @param {object} root0 - Params
 * @param {object} root0.data - Cluster tab data
 * @returns {Component} Cluster DRS tab
 */
export const Drs = ({ data = {} }) => {
  const {
    selected: selectedCluster = {},
    handleRefresh,
    isActionsDisabled,
  } = data
  const { showModal } = useModalsApi()
  const { enqueueSuccess } = useGeneralApi()
  const { oneConfig: { DRS_INTERVAL = -1 } = {} } = useSystemData()

  const clusterId = selectedCluster?.ID
  const hasClusterId = clusterId !== undefined && clusterId !== null

  const {
    data: fetchedCluster = {},
    isFetching: isFetchingCluster,
    refetch: refetchCluster,
  } = ClusterAPI.useGetClusterQuery({ id: clusterId }, { skip: !hasClusterId })

  const cluster =
    fetchedCluster?.ID !== undefined ? fetchedCluster : selectedCluster
  const { PLAN: optimizationPlan = {}, TEMPLATE = {} } = cluster
  const { ONE_DRS = {} } = TEMPLATE

  const [updateConf, { isLoading: isUpdatingConf }] =
    ClusterAPI.useUpdateClusterMutation()
  const [applyPlan, { isLoading: isApplyingPlan }] =
    ClusterAPI.useApplyPlanMutation()
  const [deletePlan, { isLoading: isDeletingPlan }] =
    ClusterAPI.useDeletePlanMutation()
  const [
    optimize,
    {
      isFetching: isFetchingOptimizationPlan,
      isLoading: isLoadingOptimizationPlan,
    },
  ] = ClusterAPI.useOptimizeClusterMutation()

  const isOptimizing =
    isFetchingOptimizationPlan || isLoadingOptimizationPlan || false

  const refreshDrs = useCallback(async () => {
    if (!hasClusterId) return

    await refetchCluster?.()
    await handleRefresh?.()
  }, [clusterId, handleRefresh, hasClusterId, refetchCluster])

  const recommendations = useMemo(
    () => getPlanActions(optimizationPlan),
    [optimizationPlan]
  )

  const isDrsEnabled = !isEmptyObject(ONE_DRS) || !!recommendations?.length
  const isManualInterval = String(DRS_INTERVAL) === '-1'
  const isFullAutomation = ONE_DRS?.[DRS_CONFIG_ATTRIBUTES.AUTOMATION] === FULL

  const isSubmitting =
    isFetchingCluster ||
    isUpdatingConf ||
    isApplyingPlan ||
    isDeletingPlan ||
    isOptimizing

  const isDisabled = !isDrsEnabled || isSubmitting || isActionsDisabled
  const isApplyDisabled = isFullAutomation && !isManualInterval
  const isApplyHidden = isFullAutomation && isManualInterval

  const configurationOptions = useMemo(
    () =>
      getConfigurationOptions({
        oneDrs: ONE_DRS,
        drsInterval: DRS_INTERVAL,
        isDrsEnabled,
      }),
    [DRS_INTERVAL, ONE_DRS, isDrsEnabled]
  )

  const handleUpdateConf = async (newConfiguration) => {
    if (!hasClusterId) return

    const template = jsonToXml(newConfiguration)
    await updateConf({ id: clusterId, template, replace: 1 })
    await refreshDrs()
  }

  const handleApplyPlan = async () => {
    if (!hasClusterId) return

    await applyPlan({ id: clusterId })
    await refreshDrs()
  }

  const handleDeletePlan = async () => {
    if (!hasClusterId) return

    await deletePlan({ id: clusterId })
    await refreshDrs()
  }

  const handleOptimization = async () => {
    if (!hasClusterId) return

    await optimize({ id: clusterId }).unwrap()
    enqueueSuccess(T.OptimizationPlanGenerated)
    await refreshDrs()
  }

  const handleDisableDrs = async () => {
    if (!hasClusterId) return

    if (cluster?.PLAN) {
      await deletePlan({ id: clusterId })
    }

    const template = Object.fromEntries(
      Object.entries(TEMPLATE).filter(([key]) => key !== 'ONE_DRS')
    )

    await updateConf({
      id: clusterId,
      template: jsonToXml(template),
      replace: 0,
    })
    await refreshDrs()
  }

  const handleOpenForm = () =>
    showModal({
      dialogProps: {
        title: T.UpdatePlanConfiguration,
        dataCy: 'modal-update-conf',
      },
      onSubmit: handleUpdateConf,
      form: UpdatePlanConfigurationForm({
        stepProps: { ONE_DRS },
        initialValues: ONE_DRS,
      }),
    })

  const handleOpenDisableDrsForm = () =>
    showModal({
      isConfirmDialog: true,
      dialogProps: {
        title: T.DisableDrs,
        description: (
          <ResourceActionConfirmation
            description={T.DoYouWantDisableDRS}
            resourceType={T.Drs}
          />
        ),
        confirmLabel: T.Disable,
      },
      onSubmit: handleDisableDrs,
    })

  return (
    <Box sx={(theme) => getStyles({ theme })}>
      <Box className="drs-configuration">
        <Box className="drs-actions">
          <SubmitButton
            type={'secondary'}
            data-cy="update-conf"
            label={isDrsEnabled ? T.UpdatePlanConfiguration : T.EnableDrs}
            isDisabled={
              isFetchingCluster || isUpdatingConf || isActionsDisabled
            }
            onClick={handleOpenForm}
          />
          {isDrsEnabled && (
            <SubmitButton
              data-cy="disable-drs"
              label={T.DisableDrs}
              type="secondary"
              isDestructive
              isDisabled={isDisabled}
              onClick={handleOpenDisableDrsForm}
            />
          )}
        </Box>
        <DetailsCard
          title={T.OptimizationPlanConfiguration}
          options={configurationOptions}
        />
      </Box>
      <ExecutionTimeline
        data={optimizationPlan}
        isLoading={isFetchingCluster || isOptimizing}
        handleApplyPlan={handleApplyPlan}
        handleDeletePlan={handleDeletePlan}
        handleOptimization={handleOptimization}
        isDisabled={isDisabled}
        isSubmitting={isSubmitting}
        isApplyDisabled={isApplyDisabled}
        isApplyHidden={isApplyHidden}
      />
    </Box>
  )
}

Drs.propTypes = {
  data: PropTypes.object,
}

Drs.id = 'drs'
Drs.title = T.Drs
