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
import { Box, Skeleton } from '@mui/material'
import { Cpu as PciIcon, Plus } from 'iconoir-react'
import { useEffect, useMemo } from 'react'
import { useFieldArray } from 'react-hook-form'
import { find } from 'lodash'

import {
  Button,
  CardBlock,
  EmptyContent,
  LabelSlot,
  MetadataSlot,
  ResourceActionConfirmation,
  TitleSlot,
} from '@ComponentsV2Module'

import {
  STEP_ID as EXTRA_ID,
  TabType,
} from '@modules/resources/resources/VmTemplate/Forms/CreateForm/Steps/ExtraConfiguration'
import { mapNameByIndex } from '@modules/resources/resources/VmTemplate/Forms/CreateForm/Steps/ExtraConfiguration/schema'
import * as VirtualMachine from '@modules/resources/resources/VirtualMachine'
import { T, STYLE_BUTTONS } from '@ConstantsModule'
import { HostAPI, useGeneralApi, useModalsApi } from '@FeaturesModule'
import { getPciDevices } from '@ModelsModule'
import { hasRestrictedAttributes } from '@UtilsModule'
import { transformPciToString } from '@modules/resources/resources/VirtualMachine/Forms/AttachPciForm/schema'

export const TAB_ID = 'PCI'
const mapPCINameFunction = mapNameByIndex(TAB_ID)

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

const formatValue = (value) =>
  value === undefined || value === null || value === '' ? '-' : String(value)

const getPciCardName = (pci) => {
  const name =
    pci?.PCI_ID !== undefined
      ? `PCI${pci.PCI_ID}`
      : pci?.NAME || `${T.Pci} ${formatValue(pci?.indexPci)}`
  const device = pci?.DEVICE_NAME || pci?.SHORT_ADDRESS

  return device ? `${name}: ${device}` : name
}

const getPciMetadata = (pci) => [
  [T.ID, formatValue(pci?.PCI_ID ?? pci?.indexPci)],
  [T.Device, formatValue(pci?.DEVICE_NAME ?? pci?.DEVICE)],
  [T.Vendor, formatValue(pci?.VENDOR_NAME ?? pci?.VENDOR)],
  [T.Class, formatValue(pci?.CLASS_NAME ?? pci?.CLASS)],
  [T.ShortAddress, formatValue(pci?.SHORT_ADDRESS)],
  [T.Profile, formatValue(pci?.PROFILE)],
]

const getPciTitleTags = (pci) =>
  [
    pci?.SPECIFIC_DEVICE && [T.PCISpecificDevice, 'information'],
    pci?.PROFILE && [`${T.Profile}: ${pci.PROFILE}`, 'miscellaneous2'],
  ].filter(Boolean)

const getPciTags = (pci) =>
  [
    pci?.SHORT_ADDRESS && [
      `${T.ShortAddress}: ${pci.SHORT_ADDRESS}`,
      'information',
    ],
    pci?.VENDOR && [`${T.Vendor}: ${pci.VENDOR}`, 'miscellaneous1'],
    pci?.CLASS && [`${T.Class}: ${pci.CLASS}`, 'miscellaneous4'],
  ].filter(Boolean)

const PciTitleSlot = ({ labels = [], title }) => (
  <Box
    sx={(theme) => ({
      alignItems: 'center',
      alignSelf: 'stretch',
      display: 'flex',
      flexWrap: 'wrap',
      gap: `${theme.scale[100]}px`,
      maxWidth: '100%',
    })}
  >
    <TitleSlot title={title} />
    {labels.length > 0 && <LabelSlot labels={labels} />}
  </Box>
)

PciTitleSlot.propTypes = {
  labels: PropTypes.array,
  title: PropTypes.string,
}

const VmTemplatePciCard = ({ actions, pci }) => {
  const tags = getPciTags(pci)
  const slots = [
    [
      PciTitleSlot,
      {
        labels: getPciTitleTags(pci),
        title: getPciCardName(pci),
      },
    ],
    [MetadataSlot, { labels: getPciMetadata(pci) }],
    tags.length > 0 && [LabelSlot, { labels: tags }],
  ].filter(Boolean)

  return <CardBlock actions={actions} isSelectable={false} slots={slots} />
}

VmTemplatePciCard.propTypes = {
  actions: PropTypes.array,
  pci: PropTypes.object,
}

const completePci = (pci, hostPciDevices = []) => {
  const pciHostDevice = find(
    hostPciDevices,
    (device) =>
      (device.DEVICE === pci.DEVICE &&
        device.VENDOR === pci.VENDOR &&
        device.CLASS === pci.CLASS) ||
      device.SHORT_ADDRESS === pci.SHORT_ADDRESS
  )

  return {
    ...pci,
    PCI_DEVICE_NAME: transformPciToString(pci),
    DEVICE: pciHostDevice ? pciHostDevice.DEVICE : pci.DEVICE,
    DEVICE_NAME: pciHostDevice ? pciHostDevice.DEVICE_NAME : pci.DEVICE,
    VENDOR: pciHostDevice ? pciHostDevice.VENDOR : pci.VENDOR,
    VENDOR_NAME: pciHostDevice ? pciHostDevice.VENDOR_NAME : pci.VENDOR,
    CLASS: pciHostDevice ? pciHostDevice.CLASS : pci.CLASS,
    CLASS_NAME: pciHostDevice ? pciHostDevice.CLASS_NAME : pci.CLASS,
    SPECIFIC_DEVICE: !!pci.SHORT_ADDRESS,
  }
}

const getModifiedFields = (pci) =>
  pci.SPECIFIC_DEVICE
    ? {
        DEVICE: { __delete__: true },
        VENDOR: { __delete__: true },
        CLASS: { __delete__: true },
        SHORT_ADDRESS: true,
        PROFILE: true,
      }
    : {
        DEVICE: true,
        VENDOR: true,
        CLASS: true,
        PROFILE: true,
        SHORT_ADDRESS: { __delete__: true },
      }

const PciDevices = ({ oneConfig, adminGroup }) => {
  const {
    enqueueSuccess,
    setModifiedFields,
    setFieldPath,
    initModifiedFields,
  } = useGeneralApi()
  const { showModal } = useModalsApi()
  const { data: hosts = [], isFetching: isFetchingHosts } =
    HostAPI.useGetHostsQuery()
  const hostPciDevices = useMemo(() => hosts.map(getPciDevices).flat(), [hosts])

  const {
    fields: pciDevices = [],
    replace,
    update,
    append,
  } = useFieldArray({
    name: `${EXTRA_ID}.${TAB_ID}`,
  })

  useEffect(() => {
    setFieldPath(`extra.PciDevices.PCI`)
    initModifiedFields([
      ...pciDevices.map((element, index) => ({ __aliasPci__: index })),
    ])
  }, [])

  const cardPcis = useMemo(
    () =>
      pciDevices
        .map(({ id, ...pci }, indexPci) => ({
          ...completePci(pci, hostPciDevices),
          id,
          indexPci,
          PCI_ID: indexPci,
        }))
        .filter((pci) => pci?.TYPE !== 'NIC'),
    [hostPciDevices, pciDevices]
  )

  const notifyPciSuccess = (message, pci) =>
    setTimeout(() => enqueueSuccess(message, [getPciCardName(pci)]), 0)

  const preparePci = (pci) => {
    setModifiedFields(getModifiedFields(pci))

    const { SPECIFIC_DEVICE, PCI_ID, indexPci, ...pciData } = pci

    return pciData
  }

  const handleCreatePci = (pci) => {
    setFieldPath(`extra.PciDevices.PCI.${pciDevices.length}`)

    const pciDevice = mapPCINameFunction(preparePci(pci), pciDevices.length)

    append(pciDevice)
    notifyPciSuccess(T.SuccessVMTemplatePciAttached, pciDevice)
  }

  const handleUpdatePci = (index) => (pci) => {
    setFieldPath(`extra.PciDevices.PCI.${index}`)

    const pciDevice = mapPCINameFunction(preparePci(pci), index)

    update(index, pciDevice)
    notifyPciSuccess(T.SuccessVMTemplatePciUpdated, pciDevice)
  }

  const handleRemovePci = (pci) => {
    const index = pci?.indexPci

    setFieldPath(`extra.PciDevices.PCI.${index}`)
    setModifiedFields({ __flag__: 'DELETE' })

    const updatedPcis = pciDevices
      .filter((_, pciIndex) => pciIndex !== index)
      .map(({ id, ...item }, pciIndex) => mapPCINameFunction(item, pciIndex))

    replace(updatedPcis)
    notifyPciSuccess(T.SuccessVMTemplatePciDetached, pci)
  }

  const openAttachPciForm = () => {
    setFieldPath(`extra.PciDevices.PCI.${pciDevices.length}`)

    showModal({
      id: 'vm-template-pci-attach-pci',
      dialogProps: {
        ...PCI_FORM_DIALOG_PROPS,
        title: T.AttachPci,
        dataCy: 'modal-attach-pci',
      },
      form: VirtualMachine.Forms.AttachPciForm({
        stepProps: { oneConfig, adminGroup, rawSubmit: true },
      }),
      onSubmit: handleCreatePci,
    })
  }

  const openEditPciForm = (pci) => {
    const title = `${T.Edit}: ${getPciCardName(pci)}`

    setFieldPath(`extra.PciDevices.PCI.${pci?.indexPci}`)
    showModal({
      id: `vm-template-pci-edit-pci-${pci?.indexPci}`,
      dialogProps: {
        ...PCI_FORM_DIALOG_PROPS,
        title,
        dataCy: 'modal-edit-pci',
      },
      form: VirtualMachine.Forms.AttachPciForm({
        initialValues: pci,
        stepProps: { oneConfig, adminGroup, rawSubmit: true },
      }),
      onSubmit: handleUpdatePci(pci?.indexPci),
    })
  }

  const openDetachPciConfirm = (pci) =>
    showModal({
      id: `vm-template-pci-detach-pci-${pci?.indexPci}`,
      isConfirmDialog: true,
      dialogProps: {
        title: `${T.DetachSomething} ${getPciCardName(pci)}`,
        dataCy: 'modal-detach-pci',
        description: (
          <ResourceActionConfirmation
            description={T['resource.detach.confirmation']}
            resources={{ ID: pci?.indexPci, NAME: getPciCardName(pci) }}
            resourceType={T.Pci}
          />
        ),
        confirmLabel: T.Detach,
        confirmButtonProps: {
          isDestructive: true,
        },
      },
      onSubmit: () => handleRemovePci(pci),
    })

  const getPciActions = (pci) => {
    const disableDetach =
      !adminGroup &&
      hasRestrictedAttributes(pci, 'PCI', oneConfig?.VM_RESTRICTED_ATTR)

    return [
      {
        title: T.Edit,
        tooltip: T.Edit,
        onClick: () => openEditPciForm(pci),
      },
      {
        title: T.Detach,
        tooltip: disableDetach ? T.DetachRestricted : T.Detach,
        isDisabled: disableDetach,
        onClick: () => openDetachPciConfirm(pci),
      },
    ]
  }

  if (isFetchingHosts) {
    return (
      <Skeleton
        variant="text"
        sx={{ width: { xs: '100%', sm: '50%', md: '25%' } }}
      />
    )
  }

  return (
    <Box>
      <Button
        startIcon={<Plus />}
        title={T.AttachPci}
        type={STYLE_BUTTONS.TYPE.SECONDARY}
        onClick={openAttachPciForm}
      />
      <Box
        sx={{
          display: 'grid',
          gap: '1em',
          gridTemplateColumns: {
            xs: '1fr',
            md: 'repeat(2, minmax(0, 1fr))',
          },
          mt: '1em',
          pb: '1em',
          width: '100%',
        }}
      >
        {cardPcis.length ? (
          cardPcis.map((pci) => (
            <VmTemplatePciCard
              actions={getPciActions(pci)}
              key={pci?.id ?? pci?.NAME ?? pci?.indexPci}
              pci={pci}
            />
          ))
        ) : (
          <Box sx={{ gridColumn: '1 / -1' }}>
            <EmptyContent
              subtitle={T.AttachedPciDevicesWillAppearHere}
              title={T.NoPciDevices}
            />
          </Box>
        )}
      </Box>
    </Box>
  )
}

PciDevices.propTypes = {
  data: PropTypes.any,
  setFormData: PropTypes.func,
  oneConfig: PropTypes.object,
  adminGroup: PropTypes.bool,
}

PciDevices.displayName = 'PciDevices'

/** @type {TabType} */
const TAB = {
  id: 'pci',
  name: T.PciDevices,
  icon: PciIcon,
  Content: PciDevices,
  getError: (error) => !!error?.[TAB_ID],
}

export default TAB
