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

import { T, VM_ACTIONS, VM_ACTION_ENUM, STYLE_BUTTONS } from '@ConstantsModule'
import { Table, Button, ResourceActionConfirmation } from '@ComponentsV2Module'
import { Box } from '@mui/material'
import PropTypes from 'prop-types'
import { Component } from 'react'
import { getStyles } from '@modules/resources/resources/VirtualMachine/Tabs/PCI/styles'
import { VirtualMachine } from '@modules/resources/resources'
import { Trash } from 'iconoir-react'
import { useGeneralApi, useModalsApi, useSystemData } from '@FeaturesModule'
import { isVmAvailableAction, vmpcisTable } from '@ModelsModule'

const PCI_FORM_DIALOG_PROPS = {
  dialogWidth: {
    xs: 'calc(100vw - 32px)',
    md: '760px',
    lg: '840px',
  },
  dialogMaxWidth: 'calc(100vw - 32px)',
  dialogContentMaxHeight: '70vh',
  dialogContentOverflowY: 'auto',
}

/**
 * @param {object} root0 - Params
 * @param {object} root0.data - Tab specific data
 * @param {object} root0.config - Tab view configuration
 * @returns {Component} - VM Instances info tab
 */
export const PCI = ({ data, config }) => {
  const { showModal } = useModalsApi()
  const { enqueueSuccess } = useGeneralApi()
  const { oneConfig, adminGroup } = useSystemData()
  const { selectedVm } = data || {}

  const { actions, isLoading: isPerformingAction } =
    VirtualMachine.Actions.useActions({
      context:
        (fn) =>
        (params = {}) =>
          fn?.({
            id: selectedVm?.ID,
            ...params,
          }),
    })

  const { data: pcis = [], isFetching: isFetchingPcis } = vmpcisTable.useData(
    { id: selectedVm?.ID },
    { skip: !selectedVm?.ID }
  )

  const handleAttachPci = async (formData) => {
    const result = await actions?.[VM_ACTION_ENUM.ATTACH_PCI]?.mutate(formData)

    if (result?.error) return false
    enqueueSuccess(T.AttachPciSuccess, [selectedVm?.ID])
  }

  const handleDetachPci = (pci) => async () => {
    const result = await actions?.[VM_ACTION_ENUM.DETACH_PCI]?.mutate(pci)

    if (result?.error) return false
    enqueueSuccess(T.DetachPciSuccess, [selectedVm?.ID])
  }

  const openAttachPciForm = () =>
    showModal({
      name: T.AttachPci,
      dialogProps: {
        ...PCI_FORM_DIALOG_PROPS,
        title: T.AttachPci,
        dataCy: 'modal-attach-pci',
      },
      form: VirtualMachine.Forms.AttachPciForm({
        stepProps: { oneConfig, adminGroup },
      }),
      onSubmit: handleAttachPci,
    })

  const openDetachPciConfirm = (pci) =>
    showModal({
      name: T.DetachPci,
      isConfirmDialog: true,
      dialogProps: {
        title: `${T.DetachSomething} ${T.Pci} #${pci?.PCI_ID}`,
        dataCy: 'modal-detach-pci',
        description: (
          <ResourceActionConfirmation
            description={T['resource.detach.confirmation']}
            resources={{ ID: pci?.PCI_ID }}
            resourceType={T.Pci}
          />
        ),
        confirmLabel: T.Detach,
        confirmButtonProps: {
          isDestructive: true,
        },
      },
      onSubmit: handleDetachPci(pci),
    })

  const columns = [
    ...vmpcisTable.columns(),
    {
      header: '',
      id: 'actions',
      grow: false,
      cell: ({ row }) => {
        const pci = row?.original
        const detachAction = actions?.[VM_ACTION_ENUM.DETACH_PCI]
        const actionType = VM_ACTIONS.DETACH_PCI
        const isDisabled =
          detachAction?.isDisabled ||
          !config?.actions?.[actionType] ||
          !isVmAvailableAction(actionType, selectedVm)

        return (
          <Button
            data-cy={`detach-pci-${pci?.PCI_ID}`}
            iconOnly={<Trash />}
            isDestructive
            isDisabled={isDisabled}
            onClick={() => openDetachPciConfirm(pci)}
            title={isDisabled ? T.DetachRestricted : T.Detach}
            type={STYLE_BUTTONS.TYPE.TRANSPARENT}
          />
        )
      },
    },
  ]

  const [attachPciOption] = VirtualMachine.Actions.Utils.generateMenuOptions({
    keys: [VM_ACTION_ENUM.ATTACH_PCI],
    actions,
    vm: selectedVm,
    viewConfig: config,
    showModal,
  })

  return (
    <Box sx={(theme) => getStyles({ theme })}>
      <Button
        {...attachPciOption}
        type={STYLE_BUTTONS.TYPE.SECONDARY}
        onClick={openAttachPciForm}
      />
      <Box className="table-container">
        <Table
          columns={columns}
          data={pcis}
          isLoading={isFetchingPcis || isPerformingAction}
          emptyContentProps={{
            title: T.NoPciDevices,
            subtitle: T.AttachedPciDevicesWillAppearHere,
          }}
          size="medium"
          isEnableSearchBar
          isEnableSort
          isEnableFilters
        />
      </Box>
    </Box>
  )
}

PCI.propTypes = {
  data: PropTypes.object,
  config: PropTypes.object,
}

PCI.id = 'pci'
PCI.title = T.Pci
