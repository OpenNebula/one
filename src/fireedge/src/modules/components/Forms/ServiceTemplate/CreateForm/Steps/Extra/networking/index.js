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
import { Component, useMemo } from 'react'
import { useFieldArray, useForm, FormProvider } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import {
  NETWORK_INPUT_FIELDS,
  NETWORK_INPUT_SCHEMA,
} from '@modules/components/Forms/ServiceTemplate/CreateForm/Steps/Extra/networking/schema'
import { FormWithSchema, Legend } from '@modules/components/Forms'
import { Translate, Tr } from '@modules/components/HOC'
import { DeleteCircledOutline, AddCircledOutline } from 'iconoir-react'
import { Stack, FormControl, Divider, Button, Box } from '@mui/material'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import SubmitButton from '@modules/components/FormControl/SubmitButton'
import { T } from '@ConstantsModule'
import { sentenceCase } from '@UtilsModule'

export const SECTION_ID = 'NETWORKING'

/**
 * @param {object} root0 - Params
 * @param {string} root0.stepId - Step identifier
 * @returns {Component} - Networking sub-section
 */
const NetworkingSection = ({ stepId }) => {
  const fields = useMemo(() => NETWORK_INPUT_FIELDS)

  const {
    fields: networks,
    append,
    remove,
  } = useFieldArray({
    name: useMemo(
      () => [stepId, SECTION_ID].filter(Boolean).join('.'),
      [stepId]
    ),
  })

  const methods = useForm({
    defaultValues: NETWORK_INPUT_SCHEMA.default(),
    resolver: yupResolver(NETWORK_INPUT_SCHEMA),
  })

  const onSubmit = async (newNetwork) => {
    const isValid = await methods.trigger()
    if (isValid) {
      append(newNetwork)
      methods.reset()
    }
  }

  if (fields.length === 0) {
    return null
  }

  return (
    <FormControl
      component="fieldset"
      sx={{ width: '100%', gridColumn: '1 / -1' }}
    >
      <Legend title={T.Networks} />
      <FormProvider {...methods}>
        <Stack
          direction="row"
          alignItems="flex-start"
          gap="0.5rem"
          component="form"
          onSubmit={methods.handleSubmit(onSubmit)}
        >
          <FormWithSchema
            cy={'extra-networking'}
            fields={fields}
            rootProps={{ sx: { m: 0 } }}
          />
          <Button
            variant="contained"
            type="submit"
            color="secondary"
            startIcon={<AddCircledOutline />}
            data-cy={'extra-networking'}
            sx={{ mt: '1em' }}
          >
            <Translate word={T.Add} />
          </Button>
        </Stack>
      </FormProvider>
      <Divider />
      <List>
        {networks?.map(
          ({ name, description, netextra, id, network, type }, index) => {
            const secondaryFields = [
              description && `${Tr(T.Description)}: ${description}`,
              type && `${Tr(T.Type)}: ${Tr(sentenceCase(type))}`,
              network && `${Tr(T.Network)}: ${network}`,
              netextra && `${Tr(T.Extra)}: ${netextra}`,
            ].filter(Boolean)

            return (
              <Box
                key={id}
                sx={{
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  marginBottom: '8px',
                }}
              >
                <ListItem
                  secondaryAction={
                    <SubmitButton
                      onClick={() => remove(index)}
                      icon={<DeleteCircledOutline />}
                    />
                  }
                  sx={{ '&:hover': { bgcolor: 'action.hover' } }}
                >
                  <ListItemText
                    primary={name}
                    primaryTypographyProps={{ variant: 'body1' }}
                    secondary={secondaryFields.join(' | ')}
                  />
                </ListItem>
              </Box>
            )
          }
        )}
      </List>
    </FormControl>
  )
}

NetworkingSection.propTypes = {
  stepId: PropTypes.string,
}

export default NetworkingSection
