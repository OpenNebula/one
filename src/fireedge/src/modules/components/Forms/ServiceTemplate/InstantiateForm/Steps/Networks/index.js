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
import PropTypes from 'prop-types'
import { useEffect, useState } from 'react'
import { useFormContext, useFieldArray } from 'react-hook-form'
import { Cancel } from 'iconoir-react'
import {
  NETWORK_INPUT_FIELDS,
  NETWORK_SELECTION,
} from '@modules/components/Forms/ServiceTemplate/CreateForm/Steps/Extra/networking/schema'
import {
  ExtraDropdown,
  SECTION_ID as NETWORKS_VALUES_ID,
} from '@modules/components/Forms/ServiceTemplate/CreateForm/Steps/Extra/networking/extraDropdown'

import { FormWithSchema } from '@modules/components/Forms'

import { SubmitButton } from '@modules/components/FormControl'
import { Stack, Grid, List, ListItem } from '@mui/material'
import { T, STYLE_BUTTONS } from '@ConstantsModule'

import {
  AR,
  SG,
} from '@modules/components/Forms/ServiceTemplate/CreateForm/Steps/Extra/networking/extraDropdown/sections'

import { SCHEMA } from '@modules/components/Forms/ServiceTemplate/InstantiateForm/Steps/Networks/schema'

export const STEP_ID = 'networks'

const Content = () => {
  const { watch } = useFormContext()

  // Updates in real-time compared to the snapshot from the fieldArray hook
  const wNetworks = watch(`${STEP_ID}.${STEP_ID}`)
  const wNetworksValues = watch(`${STEP_ID}.${NETWORKS_VALUES_ID}`)

  const {
    fields: networks,
    append: appendNet,
    remove: rmNet,
  } = useFieldArray({
    name: `${STEP_ID}.${STEP_ID}`,
  })

  const { append: appendNetv, remove: rmNetv } = useFieldArray({
    name: `${STEP_ID}.${NETWORKS_VALUES_ID}`,
  })

  const [selectedNetwork, setSelectedNetwork] = useState(0)
  const [shift, setShift] = useState(0)

  const handleRemove = (event, idx) => {
    event.stopPropagation()

    // Calculates shift & releases current reference in case it goes oob
    setSelectedNetwork((prev) => {
      setShift(
        prev +
          (networks?.length - 1 === prev
            ? -1
            : networks?.length === 2
            ? -+prev
            : idx < prev
            ? -1
            : 0)
      )

      return null
    })

    // Remove corresponding entry from networks_values array
    rmNetv(idx)
    rmNet(idx)
  }

  // Very important, define all fields or else RHF uses previous input data
  const handleAppend = (event) => {
    event?.stopPropagation?.()
    setSelectedNetwork(() => {
      setShift(null)

      return null
    })

    appendNet({
      name: '',
      description: '',
      network: null,
      size: null,
      type: null,
    })

    appendNetv({
      [AR.id]: [],
      [SG.id]: [],
    })
  }

  // Shifts selected index after networks array has been updated
  useEffect(() => {
    if (selectedNetwork === null) {
      if (shift === null) {
        setSelectedNetwork(networks?.length - 1)
      } else {
        setSelectedNetwork(shift)
      }
    }
  }, [networks])

  return (
    <>
      <Grid
        container
        direction="row"
        columnSpacing={1}
        rowSpacing={2}
        sx={{
          justifyContent: 'flex-start',
          alignItems: 'stretch',
          height: '100%',
        }}
      >
        <Grid
          item
          md={3}
          sx={{
            borderRight: networks && networks.length > 0 ? 1 : 0,
            padding: 1,
          }}
        >
          <SubmitButton
            data-cy={'extra-add-network'}
            onClick={handleAppend}
            label={T.AddNetwork}
            importance={STYLE_BUTTONS.IMPORTANCE.MAIN}
            size={STYLE_BUTTONS.SIZE.MEDIUM}
            type={STYLE_BUTTONS.TYPE.FILLED}
          />
          <List
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
            }}
          >
            {networks?.map((network, idx) => {
              const networkName = watch(`${STEP_ID}.${STEP_ID}.${idx}.name`)

              return (
                <ListItem
                  key={`item-${idx}-${network.id}`}
                  onClick={() => setSelectedNetwork(idx)}
                  sx={{
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: '4px',
                    minHeight: '70px',
                    my: 0.5,
                    overflowX: 'hidden',
                    padding: 2,

                    bgcolor:
                      idx === selectedNetwork ? 'action.selected' : 'inherit',
                    '&:hover': {
                      bgcolor: 'action.hover',
                    },
                  }}
                >
                  <SubmitButton
                    aria-label="delete"
                    onClick={(event) => handleRemove(event, idx)}
                    icon={<Cancel />}
                  />
                  <div
                    style={{
                      display: 'inline-block',
                      maxWidth: '100%',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      fontSize: '1em',
                    }}
                    data-cy={`network-${idx}`}
                  >
                    {networkName || T.NewNetwork}
                  </div>
                </ListItem>
              )
            })}
          </List>
        </Grid>
        <Grid item md={9}>
          {selectedNetwork != null && wNetworks?.length > 0 && (
            <>
              <Stack
                key={`inputs-${networks?.[selectedNetwork]?.id}`}
                direction="column"
                alignItems="flex-start"
                gap="0.5rem"
                component="form"
                width="100%"
              >
                <FormWithSchema
                  legend={T.Type}
                  id={`${STEP_ID}.${STEP_ID}.${selectedNetwork}`}
                  cy={`${STEP_ID}.${STEP_ID}`}
                  fields={NETWORK_INPUT_FIELDS(true)}
                />
              </Stack>

              <ExtraDropdown
                networksValues={wNetworksValues}
                key={`extra-${networks?.[selectedNetwork]?.id}`}
                selectedNetwork={selectedNetwork}
              />

              <FormWithSchema
                key={`network-table-${networks?.[selectedNetwork]?.id}`}
                cy={`${STEP_ID}-${STEP_ID}-${NETWORK_SELECTION?.name}`}
                id={`${STEP_ID}.${STEP_ID}.${selectedNetwork}`}
                fields={[NETWORK_SELECTION(true)]}
              />
            </>
          )}
        </Grid>
      </Grid>
    </>
  )
}

Content.propTypes = {
  stepId: PropTypes.string,
}

/**
 * Networks step.
 *
 * @returns {object} Networks step
 */
const NetworksStep = () => ({
  id: STEP_ID,
  label: T.Networks,
  optionsValidate: { abortEarly: false },
  resolver: SCHEMA,
  content: () => Content(),
})

Content.propTypes = {}

export default NetworksStep
