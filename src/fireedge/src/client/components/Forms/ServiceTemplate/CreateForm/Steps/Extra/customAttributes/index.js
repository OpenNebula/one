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
import { Component, useMemo } from 'react'
import PropTypes from 'prop-types'
import { useFieldArray, useForm, FormProvider } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import {
  CUSTOM_ATTRIBUTES_FIELDS,
  CUSTOM_ATTRIBUTES_SCHEMA,
} from 'client/components/Forms/ServiceTemplate/CreateForm/Steps/Extra/customAttributes/schema'
import { FormWithSchema, Legend } from 'client/components/Forms'
import { Translate, Tr } from 'client/components/HOC'
import { DeleteCircledOutline, AddCircledOutline } from 'iconoir-react'
import { Stack, FormControl, Divider, Button, Box } from '@mui/material'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import SubmitButton from 'client/components/FormControl/SubmitButton'
import { T } from 'client/constants'
import { sentenceCase } from 'client/utils'

export const SECTION_ID = 'CUSTOM_ATTRIBUTES'

/**
 * @param {object} root0 - Params
 * @param {string} root0.stepId - Step identifier
 * @returns {Component} - Custom Attributes sub-step
 */
const CustomAttributesSection = ({ stepId }) => {
  const fields = CUSTOM_ATTRIBUTES_FIELDS

  const {
    fields: customattributes,
    append,
    remove,
  } = useFieldArray({
    name: useMemo(
      () => [stepId, SECTION_ID].filter(Boolean).join('.'),
      [stepId]
    ),
  })

  const methods = useForm({
    defaultValues: CUSTOM_ATTRIBUTES_SCHEMA.default(),
    resolver: yupResolver(CUSTOM_ATTRIBUTES_SCHEMA),
  })

  const onSubmit = (newcustomAttribute) => {
    append(newcustomAttribute)
    methods.reset()
  }

  if (fields.length === 0) {
    return null
  }

  return (
    <FormControl
      component="fieldset"
      sx={{ width: '100%', gridColumn: '1 / -1' }}
    >
      <Legend title={T.UserInputs} />
      <FormProvider {...methods}>
        <Stack
          direction="row"
          alignItems="flex-start"
          gap="0.5rem"
          component="form"
          onSubmit={methods.handleSubmit(onSubmit)}
        >
          <FormWithSchema
            cy={'extra-customAttributes'}
            fields={fields}
            rootProps={{ sx: { m: 0 } }}
          />
          <Button
            variant="contained"
            type="submit"
            color="secondary"
            startIcon={<AddCircledOutline />}
            data-cy={'extra-customAttributes'}
            sx={{ mt: '1em' }}
          >
            <Translate word={T.Add} />
          </Button>
        </Stack>
      </FormProvider>
      <Divider />
      <List>
        {customattributes?.map(
          ({ id, name, defaultvalue, description, mandatory, type }, index) => {
            const secondaryFields = [
              description && `${Tr(T.Description)}: ${description}`,
              defaultvalue && `${Tr(T.DefaultValue)}: ${defaultvalue}`,
              type && `${Tr(T.Type)}: ${Tr(sentenceCase(type))}`,
              mandatory &&
                `${Tr(T.Mandatory)}: ${
                  mandatory ? `${Tr(T.Yes)}` : `${Tr(T.No)}`
                }`,
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

CustomAttributesSection.propTypes = {
  stepId: PropTypes.string,
}

export default CustomAttributesSection
