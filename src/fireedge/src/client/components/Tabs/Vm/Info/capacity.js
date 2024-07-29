/* ------------------------------------------------------------------------- *
 * Copyright 2002-2024, OpenNebula Project, OpenNebula Systems               *
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
import { Edit, Server, Cpu } from 'iconoir-react'
import { Stack, Typography } from '@mui/material'

import { useResizeMutation } from 'client/features/OneApi/vm'
import ButtonToTriggerForm from 'client/components/Forms/ButtonToTriggerForm'
import { ResizeCapacityForm } from 'client/components/Forms/Vm'
import { List } from 'client/components/Tabs/Common'
import { MemoryIcon } from 'client/components/Icons'
import { Tr, Translate } from 'client/components/HOC'

import { isAvailableAction } from 'client/models/VirtualMachine'
import { formatNumberByCurrency, jsonToXml } from 'client/models/Helper'
import { prettyBytes } from 'client/utils'
import { T, VM, VM_ACTIONS } from 'client/constants'

/**
 * Renders mainly capacity tab.
 *
 * @param {object} props - Props
 * @param {VM} props.vm - Virtual machine
 * @param {string[]} props.actions - Available actions to capacity tab
 * @param {object} props.oneConfig - OpenNEbula configuration
 * @param {boolean} props.adminGroup - If the user is admin
 * @returns {ReactElement} Capacity tab
 */
const CapacityPanel = ({ vm = {}, actions, oneConfig, adminGroup }) => {
  const {
    CPU,
    VCPU = '-',
    MEMORY,
    CPU_COST,
    MEMORY_COST,
    TOPOLOGY: { CORES, SOCKETS } = {},
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
      icon: <Server />,
      name: T.PhysicalCpu,
      value: CPU,
      dataCy: 'cpu',
    },
    {
      icon: <Cpu />,
      name: T.VirtualCpu,
      value: VCPU,
      dataCy: 'vcpu',
    },
    {
      icon: <MemoryIcon />,
      name: T.Memory,
      value: prettyBytes(+MEMORY, 'MB', 2),
      dataCy: 'memory',
    },
    ![CORES, SOCKETS].includes(undefined) && {
      name: T.VirtualCores,
      value: [
        `${Tr(T.Cores)} x ${CORES}`,
        `${Tr(T.Sockets)} x ${SOCKETS}`,
      ].join(' | '),
      dataCy: 'virtualcores',
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

  return (
    <List
      title={
        <PanelHeader
          vm={vm}
          actions={actions}
          oneConfig={oneConfig}
          adminGroup={adminGroup}
        />
      }
      list={info}
    />
  )
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
 * @param {object} props.oneConfig - OpenNEbula configuration
 * @param {boolean} props.adminGroup - If the user is admin
 * @returns {ReactElement} Capacity panel header
 */
const PanelHeader = ({ vm = {}, actions = [], oneConfig, adminGroup }) => {
  const [resizeCapacity] = useResizeMutation()

  const handleResizeCapacity = async (formData) => {
    const { enforce, ...restOfData } = formData

    // #6154: If a restricted attribute is send to the core in resize operation, it will fail. So delete every restricted attribute for resize operation.
    const restrictedAttributes = oneConfig?.VM_RESTRICTED_ATTR
    Object.keys(restOfData).forEach((key) => {
      if (restrictedAttributes.find((attribute) => attribute === key)) {
        delete restOfData[key]
      }
    })

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
            icon: <Edit />,
            tooltip: <Translate word={T.Resize} />,
          }}
          options={[
            {
              dialogProps: {
                title: T.ResizeCapacity,
                dataCy: 'modal-resize-capacity',
              },
              form: () =>
                ResizeCapacityForm({
                  initialValues: vm.TEMPLATE,
                  stepProps: { oneConfig, adminGroup, nameParentAttribute: '' },
                }),
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
