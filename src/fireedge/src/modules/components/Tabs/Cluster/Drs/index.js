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

import { Tr } from '@modules/components/HOC'
import { useEffect, ReactElement, useState, useRef } from 'react'
import PropTypes from 'prop-types'
import {
  Box,
  Paper,
  Stack,
  Button,
  ButtonGroup,
  ClickAwayListener,
  MenuItem,
  MenuList,
  Popper,
} from '@mui/material'
import { partition, isEmpty } from 'lodash'

import { ClusterAPI, useGeneralApi, useSystemData } from '@FeaturesModule'
import ButtonToTriggerForm from '@modules/components/Forms/ButtonToTriggerForm'
import { UpdatePlanConfigurationForm } from '@modules/components/Forms/Cluster'

import { NavArrowDown as DropdownIcon } from 'iconoir-react'
import { jsonToXml } from '@ModelsModule'
import { T, DRS_CONFIG_ATTRIBUTES, DRS_AUTOMATION } from '@ConstantsModule'
import { sentenceCase } from '@UtilsModule'
import { List } from '@modules/components/Tabs/Common'
import ExecutionTimeline from './timeline'

/**
 * Renders configuration tab.
 *
 * @param {object} props - Props
 * @param {string} props.id - Virtual machine id
 * @returns {ReactElement} Configuration tab
 */
const PlanOptimization = ({ id }) => {
  const { enqueueSuccess } = useGeneralApi()
  const [updateConf] = ClusterAPI.useUpdateClusterMutation()
  const [applyPlan] = ClusterAPI.useApplyPlanMutation()
  const [deletePlan] = ClusterAPI.useDeletePlanMutation()
  const { oneConfig: { DRS_INTERVAL = -1 } = {} } = useSystemData()

  const anchorRef = useRef(null)
  const [open, setOpen] = useState(false)

  const [
    fetchCluster,
    { data: clusterData = {}, isFetching: fetchingCluster },
  ] = ClusterAPI.useLazyGetClusterQuery()
  const [
    optimize,
    { isFetching: fetchingOptimizationPlan, isSuccess: planGenerated },
  ] = ClusterAPI.useOptimizeClusterMutation()

  const { data: { TEMPLATE: { ONE_DRS = {} } } = {}, isFetching } =
    ClusterAPI.useGetClusterQuery({
      id,
    })

  const { PLAN: optimizationPlan = {} } = clusterData

  const handleUpdateConf = async (newConfiguration) => {
    const xml = jsonToXml(newConfiguration)
    await updateConf({ id, template: xml, replace: 1 }) // Merge with existing
  }

  const handleApplyPlan = () => {
    applyPlan({ id })
  }

  const handleDeletePlan = () => {
    deletePlan({ id })
  }

  const handleDisableDrs = async () => {
    const {
      PLAN,
      TEMPLATE: { ONE_DRS: _oneDrs, ...template },
    } = clusterData
    PLAN && handleDeletePlan()
    const xml = jsonToXml(template)
    await updateConf({ id, template: xml, replace: 0 }) // Merge with existing
    setOpen(false)
  }

  useEffect(() => {
    if (planGenerated) {
      enqueueSuccess(T.OptimizationPlanGenerated)
      fetchCluster({ id })
    }
  }, [planGenerated])

  const handleOptimization = () => {
    optimize({ id })
  }

  // Loads initial plan data if any
  useEffect(() => {
    fetchCluster({ id })
  }, [])

  const [weights, rest] = partition(
    Object.values(DRS_CONFIG_ATTRIBUTES),
    (name) => name?.endsWith('_WEIGHT')
  )

  const isDrsEnabled =
    !isEmpty(ONE_DRS) || !![].concat(optimizationPlan?.ACTION || [])?.length

  const formatListAttributes = [
    ...rest?.map((name) => ({
      name:
        name?.toLowerCase() === 'predictive'
          ? 'Predictive DRS'
          : sentenceCase(name),
      canCopy: true,
      showActionsOnHover: true,
      value: ONE_DRS?.[name],
    })),
    ...(Object.entries(ONE_DRS)?.filter(([name, _value]) =>
      name?.endsWith('_WEIGHT')
    )?.length
      ? [
          {
            name: T.LoadBalanceWeights,
            canCopy: true,
            showActionsOnHover: true,
            value: Object.fromEntries(
              weights?.map((name) => [
                sentenceCase(name)?.replace(/\s+weight/g, ''),
                ONE_DRS?.[name] ?? '',
              ])
            ),
          },
        ]
      : []),
  ]

  isDrsEnabled &&
    formatListAttributes?.unshift({
      name:
        DRS_INTERVAL !== '-1'
          ? `${T.DrsInterval} ${DRS_INTERVAL} ${T.Seconds}`
          : `${T.DrsManualInterval}`,
      titleOnly: true,
      isDisabled: true,
      fullWidth: true,
      canCopy: true,
      showActionsOnHover: true,
    })

  const isSubmitting = isFetching || fetchingOptimizationPlan
  const isDisabled = !isDrsEnabled || isFetching || fetchingOptimizationPlan
  const isApplyDisabled =
    ONE_DRS?.[DRS_CONFIG_ATTRIBUTES?.AUTOMATION] === DRS_AUTOMATION?.FULL &&
    DRS_INTERVAL !== '-1'

  const isApplyHidden =
    DRS_INTERVAL === '-1' &&
    ONE_DRS?.[DRS_CONFIG_ATTRIBUTES?.AUTOMATION] === DRS_AUTOMATION?.FULL

  const timelineProps = {
    handleApplyPlan,
    handleDeletePlan,
    handleOptimization,
    isDisabled,
    isSubmitting,
    isDrsEnabled,
    isApplyDisabled,
    isApplyHidden,
  }

  return (
    <Box
      padding={{
        sm: '0.8em',
      }}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: '500px',
      }}
    >
      <Stack
        display="grid"
        gap="1em"
        gridTemplateColumns="30% auto"
        marginTop="1em"
        height="100%"
        minHeight="500px"
      >
        <Box
          sx={{
            minHeight: '500px',
            gridColumn: 1,
            gap: '1em',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <ButtonGroup ref={anchorRef} sx={{ width: '100%' }}>
            <>
              <ButtonToTriggerForm
                buttonProps={{
                  color: 'secondary',
                  'data-cy': 'update-conf',
                  label: isDrsEnabled ? T.UpdatePlanConfiguration : T.EnableDrs,
                  variant: isDrsEnabled ? 'outlined' : 'contained',
                  disabled: isFetching,
                  sx: { width: '100%' },
                }}
                options={[
                  {
                    dialogProps: {
                      title: T.UpdatePlanConfiguration,
                      dataCy: 'modal-update-conf',
                    },
                    form: () =>
                      UpdatePlanConfigurationForm({
                        stepProps: { ONE_DRS },
                        initialValues: ONE_DRS,
                      }),
                    onSubmit: handleUpdateConf,
                  },
                ]}
              />
            </>
            {isDrsEnabled && (
              <>
                <Button size="small" onClick={() => setOpen((prev) => !prev)}>
                  <DropdownIcon />
                </Button>
                <Popper
                  open={open}
                  anchorEl={anchorRef.current}
                  placement={'bottom-end'}
                >
                  <ClickAwayListener onClickAway={() => setOpen(false)}>
                    <Paper>
                      <MenuList
                        sx={{
                          padding: 0,
                          width: anchorRef?.current
                            ? `${anchorRef.current.clientWidth}px`
                            : 'inherit',
                        }}
                      >
                        <MenuItem
                          key="disable-drs-option"
                          disableGutters
                          sx={{
                            padding: 0,
                            width: anchorRef?.current
                              ? `${anchorRef.current.clientWidth}px`
                              : 'inherit',
                          }}
                        >
                          <ButtonToTriggerForm
                            buttonProps={{
                              color: 'error',
                              'data-cy': 'disable-drs',
                              label: T.DisableDrs,
                              variant: 'contained',
                              disabled: !isDrsEnabled,
                              sx: {
                                width: '100%',
                              },
                            }}
                            options={[
                              {
                                isConfirmDialog: true,
                                dialogProps: {
                                  title: T.DisableDrs,
                                  children: <p>{Tr(T.DoYouWantDisableDRS)}</p>,
                                },
                                onSubmit: handleDisableDrs,
                              },
                            ]}
                          />
                        </MenuItem>
                      </MenuList>
                    </Paper>
                  </ClickAwayListener>
                </Popper>
              </>
            )}
          </ButtonGroup>
          <List
            title={T.OptimizationPlanConfiguration}
            list={formatListAttributes}
            containerProps={{ sx: { height: '100%' } }}
          />
        </Box>
        <Box
          sx={{
            gridColumn: 2,
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <ExecutionTimeline
            data={optimizationPlan}
            isLoading={fetchingCluster || fetchingOptimizationPlan}
            {...timelineProps}
          />
        </Box>
      </Stack>
    </Box>
  )
}

PlanOptimization.propTypes = {
  tabProps: PropTypes.object,
  id: PropTypes.string,
  oneConfig: PropTypes.object,
  adminGroup: PropTypes.bool,
}

PlanOptimization.displayName = 'PlanOptimization'
PlanOptimization.label = 'OneDRS'

export default PlanOptimization
