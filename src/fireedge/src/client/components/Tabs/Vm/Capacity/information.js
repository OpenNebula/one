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
import { useMemo, ReactElement } from 'react'
import PropTypes from 'prop-types'
import { Typography } from '@mui/material'

import ButtonToTriggerForm from 'client/components/Forms/ButtonToTriggerForm'
import { ResizeCapacityForm } from 'client/components/Forms/Vm'
import { Tr, Translate } from 'client/components/HOC'
import useCapacityTabStyles from 'client/components/Tabs/Vm/Capacity/styles'

import { isVCenter } from 'client/models/VirtualMachine'
import { formatNumberByCurrency } from 'client/models/Helper'
import { prettyBytes } from 'client/utils'
import { T, VM_ACTIONS, VM } from 'client/constants'

/**
 * Renders capacity information.
 *
 * @param {object} props - Props
 * @param {string[]} props.actions - Actions tab
 * @param {VM} props.vm - Virtual Machine id
 * @param {string} props.handleResizeCapacity - Resize capacity
 * @returns {ReactElement} Capacity information
 */
const InformationPanel = ({ actions, vm = {}, handleResizeCapacity }) => {
  const classes = useCapacityTabStyles()
  const { TEMPLATE } = vm

  const memory = TEMPLATE?.MEMORY
  const memoryCost = useMemo(() => {
    const cost = TEMPLATE?.MEMORY_COST || 0
    const monthCost = formatNumberByCurrency(memory * cost * 24 * 30)

    return <Translate word={T.CostEachMonth} values={[monthCost]} />
  }, [memory, TEMPLATE?.MEMORY_COST])

  const cpu = TEMPLATE?.CPU
  const cpuCost = useMemo(() => {
    const cost = TEMPLATE?.CPU_COST || 0
    const monthCost = formatNumberByCurrency(cpu * cost * 24 * 30)

    return <Translate word={T.CostEachMonth} values={[monthCost]} />
  }, [cpu, TEMPLATE?.CPU_COST])

  const capacity = [
    {
      name: T.PhysicalCpu,
      value: cpu,
      dataCy: 'cpu',
    },
    {
      name: T.VirtualCpu,
      value: TEMPLATE?.VCPU ?? '-',
      dataCy: 'virtualcpu',
    },
    isVCenter(vm) && {
      name: T.VirtualCores,
      value: (
        <>
          {`${Tr(T.Cores)} x ${TEMPLATE?.TOPOLOGY?.CORES || '-'} |
          ${Tr(T.Sockets)} ${TEMPLATE?.TOPOLOGY?.SOCKETS || '-'}`}
        </>
      ),
      dataCy: 'virtualcores',
    },
    {
      name: T.Memory,
      value: prettyBytes(+memory, 'MB'),
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

  return (
    <div className={classes.root}>
      <div className={classes.actions}>
        {actions?.includes?.(VM_ACTIONS.RESIZE_CAPACITY) && (
          <ButtonToTriggerForm
            buttonProps={{
              color: 'secondary',
              'data-cy': 'resize-capacity',
              label: T.Resize,
              variant: 'outlined',
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
      </div>
      {capacity.map(({ name, value, dataCy }) => (
        <div key={name} className={classes.item}>
          <Typography fontWeight="medium" noWrap title={name}>
            {name}
          </Typography>
          <Typography variant="body2" noWrap title={value} data-cy={dataCy}>
            {value}
          </Typography>
        </div>
      ))}
    </div>
  )
}

InformationPanel.propTypes = {
  handleResizeCapacity: PropTypes.func,
  actions: PropTypes.array,
  vm: PropTypes.object,
}

InformationPanel.displayName = 'InformationPanel'

export default InformationPanel
