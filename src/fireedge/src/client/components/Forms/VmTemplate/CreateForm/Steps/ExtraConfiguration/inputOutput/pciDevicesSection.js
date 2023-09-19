/* ------------------------------------------------------------------------- *
 * Copyright 2002-2023, OpenNebula Project, OpenNebula Systems               *
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
import { Stack, FormControl, Divider, Button } from '@mui/material'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import { DeleteCircledOutline, AddCircledOutline } from 'iconoir-react'
import { useFieldArray, useForm, FormProvider } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'

import { useGetHostsQuery } from 'client/features/OneApi/host'
import { FormWithSchema, Legend } from 'client/components/Forms'
import { Tr, Translate } from 'client/components/HOC'
import { getPciDevices } from 'client/models/Host'

import {
  PCI_FIELDS,
  PCI_SCHEMA,
} from 'client/components/Forms/VmTemplate/CreateForm/Steps/ExtraConfiguration/inputOutput/schema'
import { T, HYPERVISORS } from 'client/constants'

import { hasRestrictedAttributes } from 'client/utils'
import SubmitButton from 'client/components/FormControl/SubmitButton'

export const SECTION_ID = 'PCI'

/**
 * @param {object} props - Props
 * @param {string} [props.stepId] - ID of the step the section belongs to
 * @param {HYPERVISORS} props.hypervisor - VM hypervisor
 * @param {object} props.oneConfig - Config of oned.conf
 * @param {boolean} props.adminGroup - User is admin or not
 * @returns {ReactElement} - Inputs section
 */
const PciDevicesSection = ({ stepId, hypervisor, oneConfig, adminGroup }) => {
  const fields = useMemo(() => PCI_FIELDS(hypervisor, oneConfig, adminGroup))

  const { data: hosts = [] } = useGetHostsQuery()
  const pciDevicesAvailable = useMemo(
    () => hosts.map(getPciDevices).flat(),
    [hosts.length]
  )

  const {
    fields: pciDevices,
    append,
    remove,
  } = useFieldArray({
    name: [stepId, SECTION_ID].filter(Boolean).join('.'),
  })

  const methods = useForm({
    defaultValues: PCI_SCHEMA.default(),
    resolver: yupResolver(PCI_SCHEMA),
  })

  const onSubmit = (newInput) => {
    delete newInput.DEVICE_NAME
    append(newInput)
    methods.reset()
  }

  return (
    <FormControl
      component="fieldset"
      sx={{ width: '100%', gridColumn: '1 / -1' }}
    >
      <Legend title={T.PciDevices} />
      <FormProvider {...methods}>
        <Stack
          direction="row"
          alignItems="flex-start"
          gap="0.5rem"
          component="form"
          onSubmit={methods.handleSubmit(onSubmit)}
        >
          <FormWithSchema
            cy={[stepId, 'io-pci-devices'].filter(Boolean).join('.')}
            fields={fields}
            rootProps={{ sx: { m: 0 } }}
          />
          <Button
            variant="contained"
            type="submit"
            color="secondary"
            startIcon={<AddCircledOutline />}
            sx={{ mt: '1em' }}
          >
            <Translate word={T.Add} />
          </Button>
        </Stack>
      </FormProvider>
      <Divider />
      <List>
        {pciDevices?.map(
          ({ id, DEVICE, VENDOR, CLASS, PROFILE = '-', ...rest }, index) => {
            if (rest?.TYPE === 'NIC') return null

            const { DEVICE_NAME, VENDOR_NAME } =
              pciDevicesAvailable.find(
                (pciDevice) => pciDevice?.DEVICE === DEVICE
              ) ?? {}

            const secondaryFields = [
              `#${DEVICE}`,
              `${T.Vendor}: ${VENDOR_NAME}(${VENDOR})`,
              `${T.Class}: ${CLASS}`,
            ]

            if (PROFILE !== '' && PROFILE !== '-') {
              secondaryFields.push(`${T.Profile}: ${PROFILE}`)
            }

            // Disable action if the nic has a restricted attribute on the template
            const disabledAction =
              !adminGroup &&
              hasRestrictedAttributes(
                { id, DEVICE, VENDOR, CLASS, PROFILE, ...rest },
                'PCI',
                oneConfig?.VM_RESTRICTED_ATTR
              )
            const tooltip = !disabledAction ? null : Tr(T.DetachRestricted)

            return (
              <ListItem
                key={id}
                secondaryAction={
                  <SubmitButton
                    onClick={() => remove(index)}
                    icon=<DeleteCircledOutline />
                    disabled={disabledAction}
                    tooltip={tooltip}
                  />
                }
                sx={{ '&:hover': { bgcolor: 'action.hover' } }}
              >
                <ListItemText
                  primary={DEVICE_NAME}
                  primaryTypographyProps={{ variant: 'body1' }}
                  secondary={secondaryFields.join(' | ')}
                />
              </ListItem>
            )
          }
        )}
      </List>
    </FormControl>
  )
}

PciDevicesSection.propTypes = {
  stepId: PropTypes.string,
  hypervisor: PropTypes.string,
  oneConfig: PropTypes.object,
  adminGroup: PropTypes.bool,
}

PciDevicesSection.displayName = 'PciDevicesSection'

export default PciDevicesSection
