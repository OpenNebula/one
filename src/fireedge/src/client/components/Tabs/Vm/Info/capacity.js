/* ------------------------------------------------------------------------- *
 * Copyright 2002-2022, OpenNebula Project, OpenNebula Systems               *
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
import { ReactElement, useMemo } from 'react'
import PropTypes from 'prop-types'
import { Edit as EditIcon } from 'iconoir-react'
import { Stack, Typography } from '@mui/material'

import { useResizeMutation } from 'client/features/OneApi/vm'
import ButtonToTriggerForm from 'client/components/Forms/ButtonToTriggerForm'
import { ResizeCapacityForm } from 'client/components/Forms/Vm'
import { List } from 'client/components/Tabs/Common'
import { Tr, Translate } from 'client/components/HOC'

import { isVCenter, isAvailableAction } from 'client/models/VirtualMachine'
import { formatNumberByCurrency, jsonToXml } from 'client/models/Helper'
import { prettyBytes } from 'client/utils'
import { T, VM, VM_ACTIONS } from 'client/constants'

/**
 * Renders mainly capacity tab.
 *
 * @param {object} props - Props
 * @param {VM} props.vm - Virtual machine
 * @param {string[]} props.actions - Available actions to capacity tab
 * @returns {ReactElement} Capacity tab
 */
const CapacityPanel = ({ vm = {}, actions }) => {
  const {
    CPU,
    VCPU = '-',
    MEMORY,
    CPU_COST,
    MEMORY_COST,
    TOPOLOGY: { CORES = '-', SOCKETS = '-' } = {},
  } = vm?.TEMPLATE || {}

  const memoryCost = useMemo(() => {
    const cost = MEMORY_COST || 0
    const monthCost = formatNumberByCurrency(MEMORY * cost * 24 * 30)

    return <Translate word={T.CostEachMonth} values={[monthCost]} />
  }, [MEMORY, MEMORY_COST])

  const cpuCost = useMemo(() => {
    const cost = CPU_COST || 0
    const monthCost = formatNumberByCurrency(CPU * cost * 24 * 30)

    return <Translate word={T.CostEachMonth} values={[monthCost]} />
  }, [CPU, CPU_COST])

  const info = [
    {
      name: T.PhysicalCpu,
      value: CPU,
      dataCy: 'cpu',
    },
    {
      name: T.VirtualCpu,
      value: VCPU,
      dataCy: 'vcpu',
    },
    isVCenter(vm) && {
      name: T.VirtualCores,
      value: [
        `${Tr(T.Cores)} x ${CORES}`,
        `${Tr(T.Sockets)} x ${SOCKETS}`,
      ].join(' | '),
      dataCy: 'virtualcores',
    },
    {
      name: T.Memory,
      value: prettyBytes(+MEMORY, 'MB'),
      dataCy: 'memory',
    },
    {
      name: T.CostCpu,
      value: cpuCost,
      dataCy: 'cpucost',
    },
    {
      name: T.CostMemory,
      value: memoryCost,
      dataCy: 'memorycost',
    },
  ].filter(Boolean)

  return <List title={<PanelHeader vm={vm} actions={actions} />} list={info} />
}

CapacityPanel.propTypes = {
  actions: PropTypes.arrayOf(PropTypes.string),
  vm: PropTypes.object,
}

CapacityPanel.displayName = 'CapacityPanel'

/**
 * Renders header of capacity panel.
 *
 * @param {object} props - Props
 * @param {VM} props.vm - Virtual machine
 * @param {string[]} props.actions - Available actions to capacity tab
 * @returns {ReactElement} Capacity panel header
 */
const PanelHeader = ({ vm = {}, actions = [] }) => {
  const [resizeCapacity] = useResizeMutation()

  const handleResizeCapacity = async (formData) => {
    const { enforce, ...restOfData } = formData
    const template = jsonToXml(restOfData)

    await resizeCapacity({ id: vm.ID, enforce, template })
  }

  const resizeIsAvailable = useMemo(
    () =>
      actions
        .filter((action) => isAvailableAction(action, vm))
        .includes?.(VM_ACTIONS.RESIZE_CAPACITY),
    [vm]
  )

  return (
    <Stack
      width={1}
      direction="row"
      alignItems="center"
      justifyContent="space-between"
    >
      <Typography noWrap>
        <Translate word={T.Capacity} />
      </Typography>
      {resizeIsAvailable && (
        <ButtonToTriggerForm
          buttonProps={{
            'data-cy': 'resize-capacity',
            icon: <EditIcon />,
            tooltip: <Translate word={T.Resize} />,
          }}
          options={[
            {
              dialogProps: { title: T.ResizeCapacity },
              form: () => ResizeCapacityForm({ initialValues: vm.TEMPLATE }),
              onSubmit: handleResizeCapacity,
            },
          ]}
        />
      )}
    </Stack>
  )
}

PanelHeader.propTypes = { ...CapacityPanel.propTypes }
PanelHeader.displayName = 'PanelHeader'

export default CapacityPanel
