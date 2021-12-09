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
import { JSXElementConstructor } from 'react'
import PropTypes from 'prop-types'
import { Stack, FormControl, Divider, Button, IconButton } from '@mui/material'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import { DeleteCircledOutline, AddCircledOutline } from 'iconoir-react'
import { useFieldArray, useForm, FormProvider } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'

import { FormWithSchema, Legend } from 'client/components/Forms'
import { Translate } from 'client/components/HOC'

import { STEP_ID as EXTRA_ID } from 'client/components/Forms/VmTemplate/CreateForm/Steps/ExtraConfiguration'
import { INPUT_SCHEMA, deviceTypeIcons, busTypeIcons } from './schema'
import { T } from 'client/constants'

export const SECTION_ID = 'INPUT'

/**
 * @param {object} props - Props
 * @param {Array} props.fields - Fields
 * @returns {JSXElementConstructor} - Inputs section
 */
const InputsSection = ({ fields }) => {
  const {
    fields: inputs,
    append,
    remove,
  } = useFieldArray({
    name: `${EXTRA_ID}.${SECTION_ID}`,
  })

  const methods = useForm({
    defaultValues: INPUT_SCHEMA.default(),
    resolver: yupResolver(INPUT_SCHEMA),
  })

  const onSubmit = (newInput) => {
    append(newInput)
    methods.reset()
  }

  return (
    <FormControl component="fieldset" sx={{ width: '100%' }}>
      <Legend title={T.Inputs} />
      <FormProvider {...methods}>
        <Stack
          direction="row"
          alignItems="flex-start"
          gap="0.5rem"
          component="form"
          onSubmit={methods.handleSubmit(onSubmit)}
        >
          <FormWithSchema
            cy={`${EXTRA_ID}-io-inputs`}
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
        {inputs?.map(({ id, TYPE, BUS }, index) => {
          const deviceIcon = deviceTypeIcons[TYPE]
          const deviceInfo = `${TYPE}`
          const busIcon = busTypeIcons[BUS]
          const busInfo = `${BUS}`

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
                primary={
                  <Stack
                    component="span"
                    direction="row"
                    spacing={2}
                    sx={{ '& > *': { width: 36 } }}
                  >
                    {deviceIcon}
                    <span>{deviceInfo}</span>
                    <Divider orientation="vertical" flexItem />
                    {busIcon}
                    <span>{busInfo}</span>
                  </Stack>
                }
                primaryTypographyProps={{ variant: 'body1' }}
              />
            </ListItem>
          )
        })}
      </List>
    </FormControl>
  )
}

InputsSection.propTypes = {
  fields: PropTypes.array,
}

InputsSection.displayName = 'InputsSection'

export default InputsSection
