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
import { ReactElement, useMemo, useEffect, useCallback } from 'react'
import { Alert, useTheme, Stack, Box } from '@mui/material'
import { prettyBytes } from '@UtilsModule'
import Chartist from '@modules/components/Charts/Chartist'

import PropTypes from 'prop-types'
import {
  getActionsAvailable,
  jsonToXml,
  getPcis,
  getHypervisor,
  isVmAvailableAction,
  getPciDevices,
} from '@ModelsModule'
import { VM_ACTIONS, T } from '@ConstantsModule'
import {
  AttachPciAction,
  DetachPciAction,
} from '@modules/components/Tabs/Vm/Pci/Actions'
import { PciCard } from '@modules/components/Cards'
import { transformPciToString } from '@modules/components/Forms/Vm/AttachPciForm/schema'
import { Tr } from '@modules/components/HOC'
import { useGeneralApi, VmAPI, HostAPI } from '@FeaturesModule'
import { find } from 'lodash'
import { css } from '@emotion/css'

const { ATTACH_PCI, DETACH_PCI } = VM_ACTIONS

/**
 * Renders the list of disks from a VM.
 *
 * @param {object} props - Props
 * @param {object} props.tabProps - Tab information
 * @param {string[]} props.tabProps.actions - Actions tab
 * @param {string} props.id - Virtual Machine id
 * @param {object} props.oneConfig - OpenNEbula configuration
 * @param {boolean} props.adminGroup - If the user is admin
 * @returns {ReactElement} Storage tab
 */
const PciTab = ({ tabProps: { actions } = {}, id, oneConfig, adminGroup }) => {
  const useStyles = ({ palette }) => ({
    warningInfo: css({
      '&': {
        gridColumn: 'span 2',
        marginTop: '1em',
        marginBottom: '1em',
        backgroundColor: palette.background.paper,
      },
    }),
  })

  const theme = useTheme()

  const classes = useMemo(() => useStyles(theme), [theme])

  // General api for enqueue
  const { enqueueSuccess } = useGeneralApi()

  // API to attach and detach PCI
  const [attachPci, { isSuccess: isSuccessAttachPci }] =
    VmAPI.useAttachPciMutation()
  const [detachPci, { isSuccess: isSuccessDetachPci }] =
    VmAPI.useDetachPciMutation()

  // Success messages
  const successMessageAttachPci = `${Tr(T.AttachPciSuccess, [id])}`
  useEffect(
    () => isSuccessAttachPci && enqueueSuccess(successMessageAttachPci),
    [isSuccessAttachPci]
  )
  const successMessageDetachPci = `${Tr(T.DetachPciSuccess, [id])}`
  useEffect(
    () => isSuccessDetachPci && enqueueSuccess(successMessageDetachPci),
    [isSuccessDetachPci]
  )

  // Get data from vm
  const { data: vm = {} } = VmAPI.useGetVmQuery({ id })
  const { data: monitoring = [], isFetching } = VmAPI.useGetMonitoringQuery(id)

  const hasGpuData = useMemo(
    () =>
      monitoring?.some((record) =>
        Object.keys(record)?.some((key) => key?.startsWith('GPU_'))
      ),
    [monitoring]
  )

  const historyRecords = [].concat(vm?.HISTORY_RECORDS?.HISTORY)

  const { VM_MAD } = historyRecords?.[0] ?? 'kvm'

  const forecastConfig = window?.__FORECAST_CONFIG__?.[VM_MAD] ?? {}
  const { virtualmachine = {} } = forecastConfig
  const {
    forecast: { period: forecastPeriod = 5 } = {}, // Minutes
  } = virtualmachine || {}

  const yAccessorPower = useMemo(
    () => [
      ['GPU_POWER_USAGE', 'GPU_POWER_USAGE_FORECAST'],
      'GPU_POWER_USAGE_FORECAST_FAR',
    ],
    []
  )

  const yAccessorMemory = useMemo(
    () => [
      ['GPU_MEMORY_UTILIZATION', 'GPU_MEMORY_UTILIZATION_FORECAST'],
      'GPU_MEMORY_UTILIZATION_FORECAST_FAR',
    ],
    []
  )

  const legendNamesPower = Object.fromEntries(
    [
      T.PowerDraw,
      `${T.PowerDraw} ${T.Forecast}`,
      `${T.PowerDraw} ${T.ForecastFar}`,
    ].map((name, idx) => [yAccessorPower?.flat()[idx], name])
  )

  const legendNamesMemory = Object.fromEntries(
    [
      T.UsedMemory,
      `${T.UsedMemory} ${T.Forecast}`,
      `${T.UsedMemory} ${T.ForecastFar}`,
    ].map((name, idx) => [yAccessorMemory?.flat()[idx], name])
  )

  const x = [
    (point) => new Date(parseInt(point) * 1000).getTime(),
    (point) =>
      new Date(parseInt(point) * 1000 + forecastPeriod * 60 * 1000).getTime(),
  ]

  const setTransform =
    (target) => (yValues, _xValues, timestamps, labelPair) => {
      const buildSeries = () => {
        const targetXId = labelPair === target ? 0 : 1
        const result = Array(timestamps.length).fill(null)
        let yIdx = 0

        for (let i = 0; i < timestamps.length; i++) {
          if (timestamps[i]?.xIds?.includes(targetXId)) {
            result[i] = yValues[yIdx]?.[labelPair] ?? null
            yIdx++
          }
        }

        return result
      }

      return buildSeries()
    }

  const interpolationY = (formatter) => (val) => {
    try {
      if (val === undefined || val === null) return '--'
      const num = Number(val)
      if (!Number.isFinite(num)) return '--'

      return formatter(num)
    } catch {
      return '--'
    }
  }

  const lineColorsPower = useMemo(
    () => [
      theme?.palette?.graphs.host.memory.free.real,
      theme?.palette?.graphs.host.memory.free.forecast,
      theme?.palette?.graphs.host.memory.free.forecastFar,
    ],
    [theme]
  )

  const lineColorsMemory = useMemo(
    () => [
      theme?.palette?.graphs.vm.memory.real,
      theme?.palette?.graphs.vm.memory.forecast,
      theme?.palette?.graphs.vm.memory.forecastFar,
    ],
    [theme]
  )

  // Get pcis in hosts
  const { data: hosts = [] } = HostAPI.useGetHostsQuery()
  const hostPciDevices = hosts.map(getPciDevices).flat()

  const handleAttachPci = async (pci) => {
    delete pci.SPECIFIC_DEVICE
    await attachPci({
      id: id,
      template: jsonToXml({ PCI: pci }),
    })
  }

  const handleRemovePci = (pciId) => async () =>
    await detachPci({ id: id, pci: pciId })

  // Set pcis and actions
  const [pciDevices, actionsAvailable] = useMemo(() => {
    const hyperV = getHypervisor(vm)
    const actionsByHypervisor = getActionsAvailable(actions, hyperV)
    const actionsByState = actionsByHypervisor.filter((action) =>
      isVmAvailableAction(action, vm)
    )

    return [getPcis(vm), actionsByState]
  }, [vm])

  const isPciSupported = actionsAvailable?.includes(ATTACH_PCI)

  return (
    <Box
      width="calc(100% - 50px)"
      alignItems="center"
      justifyContent="center"
      alignSelf="center"
    >
      <Alert severity="info" variant="outlined" className={classes.warningInfo}>
        {Tr(T.NicPciWarning)}
      </Alert>

      {isPciSupported ? (
        <>
          {actionsAvailable?.includes?.(ATTACH_PCI) && (
            <div>
              <AttachPciAction
                oneConfig={oneConfig}
                adminGroup={adminGroup}
                onSubmit={handleAttachPci}
                indexPci={pciDevices.length}
              />
            </div>
          )}
        </>
      ) : (
        <Alert
          severity="info"
          variant="outlined"
          className={classes.warningInfo}
        >
          {Tr(T.PciAttachWarning)}
        </Alert>
      )}
      <Box flexDirection="column" display="flex" gap={3} width="100%">
        {hasGpuData && (
          <Box
            gap={1}
            display="grid"
            gridTemplateColumns="repeat(2, calc(50%))"
          >
            <Box pr={'0.125rem'}>
              <Chartist
                name={`${Tr(T.Gpu)} ${Tr(T.Wattage)}`}
                data={monitoring}
                isFetching={isFetching}
                y={yAccessorPower}
                setTransform={setTransform('GPU_POWER_USAGE')}
                x={x}
                serieScale={2}
                interpolationY={interpolationY((num) => `${Math.round(num)}W`)}
                lineColors={lineColorsPower}
                legendNames={legendNamesPower}
                zoomFactor={0.95}
                trendLineOnly={['GPU_POWER_USAGE_FORECAST_FAR']}
                shouldFill={yAccessorPower.flat()}
              />
            </Box>

            <Box pl={'0.125rem'} pr={'0.5rem'}>
              <Chartist
                name={`${Tr(T.Gpu)} ${Tr(T.Memory)}`}
                data={monitoring}
                isFetching={isFetching}
                y={yAccessorMemory}
                setTransform={setTransform('GPU_MEMORY_UTILIZATION')}
                x={x}
                serieScale={2}
                lineColors={lineColorsMemory}
                legendNames={legendNamesMemory}
                interpolationY={interpolationY((num) =>
                  prettyBytes(num, 'GB', 2)
                )}
                zoomFactor={0.95}
                trendLineOnly={['GPU_MEMORY_UTILIZATION_FORECAST_FAR']}
                shouldFill={yAccessorMemory.flat()}
              />
            </Box>
          </Box>
        )}
        <Stack gap="1em">
          {pciDevices.map((pci, index) => {
            const pciHostDevice = find(hostPciDevices, {
              SHORT_ADDRESS: pci.SHORT_ADDRESS,
            })

            // Complete PCI data (if the PCI is a specific device, the vm doesn't store the data about vendor, device and class)
            const pciCompleted = {
              ...pci,
              PCI_DEVICE_NAME: pciHostDevice
                ? transformPciToString(pciHostDevice)
                : transformPciToString(pci),
              DEVICE: pciHostDevice ? pciHostDevice?.DEVICE : pci?.DEVICE,
              DEVICE_NAME: pciHostDevice
                ? pciHostDevice.DEVICE_NAME
                : pci.DEVICE,
              VENDOR: pciHostDevice ? pciHostDevice?.VENDOR : pci?.VENDOR,
              VENDOR_NAME: pciHostDevice
                ? pciHostDevice.VENDOR_NAME
                : pci.VENDOR,
              CLASS: pciHostDevice ? pciHostDevice?.CLASS : pci?.CLASS,
              CLASS_NAME: pciHostDevice ? pciHostDevice.CLASS_NAME : pci.CLASS,
              SPECIFIC_DEVICE: !!pci.SHORT_ADDRESS,
            }

            return (
              <PciCard
                key={index}
                pci={pciCompleted}
                indexPci={index}
                actions={
                  <>
                    {isPciSupported &&
                      actionsAvailable.includes(DETACH_PCI) && (
                        <DetachPciAction
                          indexPci={index}
                          onSubmit={handleRemovePci(pci.PCI_ID)}
                          oneConfig={oneConfig}
                          adminGroup={adminGroup}
                        />
                      )}
                  </>
                }
              />
            )
          })}
        </Stack>
      </Box>
    </Box>
  )
}

PciTab.propTypes = {
  tabProps: PropTypes.object,
  id: PropTypes.string,
  oneConfig: PropTypes.object,
  adminGroup: PropTypes.bool,
}

PciTab.displayName = 'PciTab'
PciTab.label = T.Pci

export default PciTab
