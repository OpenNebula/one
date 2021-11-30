/* ------------------------------------------------------------------------- *
 * Copyright 2002-2021, OpenNebula Project, OpenNebula Systems               *
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
import { JSXElementConstructor, useMemo } from 'react'
import PropTypes from 'prop-types'
import { Stack, FormControl, Divider, Button, IconButton } from '@mui/material'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import { DeleteCircledOutline, AddCircledOutline } from 'iconoir-react'
import { useFieldArray, useForm, FormProvider } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'

import { useHost } from 'client/features/One'
import { FormWithSchema, Legend } from 'client/components/Forms'
import { Translate } from 'client/components/HOC'
import { getPciDevices } from 'client/models/Host'

import { STEP_ID as EXTRA_ID } from 'client/components/Forms/VmTemplate/CreateForm/Steps/ExtraConfiguration'
import { PCI_SCHEMA } from './schema'
import { T } from 'client/constants'

export const SECTION_ID = 'PCI'

/**
 * @param {object} props - Props
 * @param {Array} props.fields - Fields
 * @returns {JSXElementConstructor} - Inputs section
 */
const PciDevicesSection = ({ fields }) => {
  const hosts = useHost()
  const pciDevicesAvailable = useMemo(
    () => hosts.map(getPciDevices).flat(),
    [hosts.length]
  )

  const {
    fields: pciDevices,
    append,
    remove,
  } = useFieldArray({
    name: `${EXTRA_ID}.${SECTION_ID}`,
  })

  const methods = useForm({
    defaultValues: PCI_SCHEMA.default(),
    resolver: yupResolver(PCI_SCHEMA),
  })

  const onSubmit = (newInput) => {
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
            cy={`${EXTRA_ID}.io-pci-devices`}
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
        {pciDevices?.map(({ id, DEVICE, VENDOR, CLASS }, index) => {
          const { DEVICE_NAME, VENDOR_NAME } =
            pciDevicesAvailable.find(
              (pciDevice) => pciDevice?.DEVICE === DEVICE
            ) ?? {}

          return (
            <ListItem
              key={id}
              secondaryAction={
                <IconButton onClick={() => remove(index)}>
                  <DeleteCircledOutline />
                </IconButton>
              }
              sx={{ '&:hover': { bgcolor: 'action.hover' } }}
            >
              <ListItemText
                primary={DEVICE_NAME}
                primaryTypographyProps={{ variant: 'body1' }}
                secondary={[
                  `#${DEVICE}`,
                  `Vendor: ${VENDOR_NAME}(${VENDOR})`,
                  `Class: ${CLASS}`,
                ].join(' | ')}
              />
            </ListItem>
          )
        })}
      </List>
    </FormControl>
  )
}

PciDevicesSection.propTypes = {
  fields: PropTypes.array,
}

PciDevicesSection.displayName = 'PciDevicesSection'

export default PciDevicesSection
