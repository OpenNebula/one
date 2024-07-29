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
import { Stack, Skeleton, Alert } from '@mui/material'
import { Cpu as PciIcon } from 'iconoir-react'
import { useFieldArray } from 'react-hook-form'
import { useEffect } from 'react'
import makeStyles from '@mui/styles/makeStyles'

import { PciCard } from 'client/components/Cards'

import {
  STEP_ID as EXTRA_ID,
  TabType,
} from 'client/components/Forms/VmTemplate/CreateForm/Steps/ExtraConfiguration'
import { T } from 'client/constants'
import {
  AttachPciAction,
  DetachPciAction,
} from 'client/components/Tabs/Vm/Pci/Actions'

import { Tr } from 'client/components/HOC'
import { useGetHostsQuery } from 'client/features/OneApi/host'
import { getPciDevices } from 'client/models/Host'

import { useGeneralApi } from 'client/features/General'
import PropTypes from 'prop-types'
import { find } from 'lodash'
import { transformPciToString } from 'client/components/Forms/Vm/AttachPciForm/schema'
import { mapNameByIndex } from 'client/components/Forms/VmTemplate/CreateForm/Steps/ExtraConfiguration/schema'

export const TAB_ID = 'PCI'
const mapPCINameFunction = mapNameByIndex(TAB_ID)

const PciDevices = ({ oneConfig, adminGroup }) => {
  // Style for info message
  const useStyles = makeStyles(({ palette }) => ({
    warningInfo: {
      '&': {
        gridColumn: 'span 2',
        marginTop: '1em',
        backgroundColor: palette.background.paper,
        marginBottom: '1em',
      },
    },
  }))

  const classes = useStyles()

  const { setModifiedFields, setFieldPath, initModifiedFields } =
    useGeneralApi()

  const { data: hosts = [] } = useGetHostsQuery()
  const hostPciDevices = hosts.map(getPciDevices).flat()

  const {
    fields: pciDevices,
    remove,
    update,
    append,
  } = useFieldArray({
    name: `${EXTRA_ID}.${TAB_ID}`,
  })

  useEffect(() => {
    // Init pci modified fields
    setFieldPath(`extra.PciDevices.PCI`)
    initModifiedFields([
      ...pciDevices.map((element, index) => ({ __aliasPci__: index })),
    ])
  }, [])

  /**
   * Returns an object with the fields that have to be updated in the template.
   *
   * @param {object} pci - PCI device data
   * @returns {object} - Object with the fields that have to be updated
   */
  const modifiyFields = (pci) => {
    if (pci.SPECIFIC_DEVICE) {
      return setModifiedFields({
        DEVICE: {
          __delete__: true,
        },
        VENDOR: {
          __delete__: true,
        },
        CLASS: {
          __delete__: true,
        },
        SHORT_ADDRESS: true,
      })
    } else {
      return setModifiedFields({
        DEVICE: true,
        VENDOR: true,
        CLASS: true,
        SHORT_ADDRESS: {
          __delete__: true,
        },
      })
    }
  }

  const handleCreatePci = (pci) => {
    // Set modified fiels to be updated
    setModifiedFields(modifiyFields(pci))
    delete pci.SPECIFIC_DEVICE

    // Add to the list
    append(mapPCINameFunction(pci, pciDevices.length))
  }

  const handleUpdatePci = (index) => (pci) => {
    // Set modified fiels to be updated
    setModifiedFields(modifiyFields(pci))
    delete pci.SPECIFIC_DEVICE

    // Update the list
    update(index, mapPCINameFunction(pci, index))
  }

  const handleRemovePci = (index) => () => {
    // Set modified fiels to remove the element
    setFieldPath(`extra.PciDevices.PCI.${index}`)
    setModifiedFields({ __flag__: 'DELETE' })

    // Remov from the list
    remove(index)
  }

  return hostPciDevices ? (
    <div>
      <Alert severity="info" variant="outlined" className={classes.warningInfo}>
        {Tr(T.NicPciWarning)}
      </Alert>
      <AttachPciAction
        oneConfig={oneConfig}
        adminGroup={adminGroup}
        onSubmit={handleCreatePci}
        indexPci={pciDevices.length}
      />
      <Stack
        pb="1em"
        display="grid"
        gap="1em"
        mt="1em"
        sx={{
          gridTemplateColumns: {
            sm: '1fr',
            md: 'repeat(auto-fit, minmax(500px, 0.5fr))',
          },
        }}
      >
        {pciDevices?.map((pci, index) => {
          if (pci?.TYPE === 'NIC') return <></>

          // Search for pci devices in the host
          const pciHostDevice = find(
            hostPciDevices,
            (device) =>
              (device.DEVICE === pci.DEVICE &&
                device.VENDOR === pci.VENDOR &&
                device.CLASS === pci.CLASS) ||
              device.SHORT_ADDRESS === pci.SHORT_ADDRESS
          )

          // If PCI exists on host's list, add all the data
          const pciCompleted = {
            ...pci,
            PCI_DEVICE_NAME: transformPciToString(pci),
            DEVICE: pciHostDevice ? pciHostDevice.DEVICE : pci.DEVICE,
            DEVICE_NAME: pciHostDevice ? pciHostDevice.DEVICE_NAME : undefined,
            VENDOR: pciHostDevice ? pciHostDevice.VENDOR : pci.VENDOR,
            VENDOR_NAME: pciHostDevice ? pciHostDevice.VENDOR_NAME : pci.VENDOR,
            CLASS: pciHostDevice ? pciHostDevice.CLASS : pci.CLASS,
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
                  <AttachPciAction
                    pci={pciCompleted}
                    oneConfig={oneConfig}
                    adminGroup={adminGroup}
                    onSubmit={handleUpdatePci(index)}
                    indexPci={index}
                  />
                  <DetachPciAction
                    indexPci={index}
                    onSubmit={handleRemovePci(index)}
                    oneConfig={oneConfig}
                    adminGroup={adminGroup}
                  />
                </>
              }
            />
          )
        })}
      </Stack>
    </div>
  ) : (
    <Skeleton
      variant="text"
      sx={{ width: { xs: '100%', sm: '50%', md: '25%' } }}
    />
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
