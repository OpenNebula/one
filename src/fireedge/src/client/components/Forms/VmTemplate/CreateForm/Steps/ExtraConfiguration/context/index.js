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
import { forwardRef } from 'react'
import PropTypes from 'prop-types'
import {
  Folder as ContextIcon,
  WarningCircledOutline as WarningIcon,
  DeleteCircledOutline,
  AddCircledOutline
} from 'iconoir-react'
import {
  styled,
  FormControl,
  Stack,
  IconButton,
  Button,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material'

import { DragDropContext, Draggable, Droppable, DropResult } from 'react-beautiful-dnd'
import { useFieldArray, useForm, FormProvider, useFormContext, get } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'

import { Tooltip } from 'client/components/FormControl'
import { FormWithSchema, Legend } from 'client/components/Forms'
import { Translate } from 'client/components/HOC'

import { STEP_ID as EXTRA_ID, TabType } from 'client/components/Forms/VmTemplate/CreateForm/Steps/ExtraConfiguration'
import { FIELDS, USER_INPUT_SCHEMA } from 'client/components/Forms/VmTemplate/CreateForm/Steps/ExtraConfiguration/context/schema'
import { getUserInputString } from 'client/models/Helper'
import { T } from 'client/constants'

export const TAB_ID = 'USER_INPUTS'

const UserItemDraggable = styled(ListItem)(({ theme }) => ({
  '&:before': {
    content: "''",
    display: 'block',
    width: 16,
    height: 10,
    background: `linear-gradient(
      to bottom,
      ${theme.palette.action.active} 4px,
      transparent 4px,
      transparent 6px,
      ${theme.palette.action.active} 6px
    )`
  }
}))

const UserInputItem = forwardRef(({
  removeAction,
  error,
  userInput: { name, ...ui } = {},
  ...props
}, ref) => (
  <UserItemDraggable
    ref={ref}
    secondaryAction={
      <IconButton onClick={removeAction}>
        <DeleteCircledOutline />
      </IconButton>
    }
    sx={{ '&:hover': { bgcolor: 'action.hover' } }}
    {...props}
  >
    {!!error && (
      <ListItemIcon sx={{ '& svg': { color: 'error.dark' } }}>
        <Tooltip title={error?.default.message}>
          <WarningIcon />
        </Tooltip>
      </ListItemIcon>
    )}
    <ListItemText
      inset={!error}
      primary={name}
      primaryTypographyProps={{ variant: 'body1' }}
      secondary={getUserInputString(ui)}
    />
  </UserItemDraggable>
))

UserInputItem.propTypes = {
  removeAction: PropTypes.func,
  error: PropTypes.object,
  userInput: PropTypes.object
}

UserInputItem.displayName = 'UserInputItem'

const Context = () => {
  const { formState: { errors } } = useFormContext()
  const { fields: userInputs, append, remove, move } = useFieldArray({
    name: `${EXTRA_ID}.${TAB_ID}`
  })

  const methods = useForm({
    defaultValues: USER_INPUT_SCHEMA.default(),
    resolver: yupResolver(USER_INPUT_SCHEMA)
  })

  const onSubmit = newInput => {
    append(newInput)
    methods.reset()
  }

  /** @param {DropResult} result - Drop result */
  const onDragEnd = result => {
    const { destination, source } = result ?? {}

    if (destination && destination.index !== source.index) {
      move(source.index, destination.index)
    }
  }

  return (
    <FormControl component='fieldset' sx={{ width: '100%' }}>
      <Legend title={T.UserInputs} tooltip={T.UserInputsConcept} />
      <FormProvider {...methods}>
        <Stack
          direction='row' alignItems='flex-start' gap='0.5rem'
          component='form'
          onSubmit={methods.handleSubmit(onSubmit)}
        >
          <FormWithSchema
            cy={`create-vm-template-${EXTRA_ID}.context-user-input`}
            fields={FIELDS}
            rootProps={{ sx: { m: 0 } }}
          />
          <Button
            variant='outlined'
            type='submit'
            startIcon={<AddCircledOutline />}
            sx={{ mt: '1em' }}
          >
            <Translate word={T.Add} />
          </Button>
        </Stack>
      </FormProvider>
      <Divider />
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId='context'>
          {({ droppableProps, innerRef: outerRef, placeholder }) => (
            <List ref={outerRef} {...droppableProps}>
              {userInputs?.map(({ id, ...userInput }, index) => (
                <Draggable
                  key={`ui[${index}]`}
                  draggableId={`ui-${index}`}
                  index={index}
                >
                  {({ draggableProps, dragHandleProps, innerRef }) => (
                    <UserInputItem
                      key={id}
                      ref={innerRef}
                      userInput={userInput}
                      error={get(errors, `${EXTRA_ID}.${TAB_ID}.${index}`)}
                      removeAction={() => remove(index)}
                      {...draggableProps}
                      {...dragHandleProps}
                    />
                  )}
                </Draggable>
              ))}
              {placeholder}
            </List>
          )}
        </Droppable>
      </DragDropContext>
    </FormControl>
  )
}

Context.propTypes = {
  data: PropTypes.any,
  setFormData: PropTypes.func,
  hypervisor: PropTypes.string,
  control: PropTypes.object
}

/** @type {TabType} */
const TAB = {
  id: 'context',
  name: T.Context,
  icon: ContextIcon,
  Content: Context,
  getError: error => !!error?.[TAB_ID]
}

export default TAB
