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
import { forwardRef, JSXElementConstructor } from 'react'
import PropTypes from 'prop-types'
import {
  WarningCircledOutline as WarningIcon,
  DeleteCircledOutline,
  AddCircledOutline,
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
  ListItemText,
} from '@mui/material'

import {
  DragDropContext,
  Draggable,
  Droppable,
  DropResult,
} from 'react-beautiful-dnd'
import {
  useFieldArray,
  useForm,
  FormProvider,
  useFormContext,
  get,
} from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'

import { Tooltip } from 'client/components/FormControl'
import { FormWithSchema, Legend } from 'client/components/Forms'
import { Translate } from 'client/components/HOC'

import { STEP_ID as EXTRA_ID } from 'client/components/Forms/VmTemplate/CreateForm/Steps/ExtraConfiguration'
import { USER_INPUT_SCHEMA, USER_INPUT_FIELDS } from './schema'
import { getUserInputString } from 'client/models/Helper'
import { T } from 'client/constants'

export const SECTION_ID = 'USER_INPUTS'

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
    )`,
  },
}))

const UserInputItem = forwardRef(
  ({ removeAction, error, userInput: { name, ...ui } = {}, ...props }, ref) => (
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
  )
)

UserInputItem.propTypes = {
  removeAction: PropTypes.func,
  error: PropTypes.object,
  userInput: PropTypes.object,
}

UserInputItem.displayName = 'UserInputItem'

/** @returns {JSXElementConstructor} - User Inputs section */
const UserInputsSection = () => {
  const {
    formState: { errors },
  } = useFormContext()
  const {
    fields: userInputs,
    append,
    remove,
    move,
  } = useFieldArray({
    name: `${EXTRA_ID}.${SECTION_ID}`,
  })

  const methods = useForm({
    defaultValues: USER_INPUT_SCHEMA.default(),
    resolver: yupResolver(USER_INPUT_SCHEMA),
  })

  const onSubmit = (newInput) => {
    append(newInput)
    methods.reset()
  }

  /** @param {DropResult} result - Drop result */
  const onDragEnd = (result) => {
    const { destination, source } = result ?? {}

    if (destination && destination.index !== source.index) {
      move(source.index, destination.index)
    }
  }

  return (
    <FormControl component="fieldset" sx={{ width: '100%' }}>
      <Legend title={T.UserInputs} tooltip={T.UserInputsConcept} />
      <FormProvider {...methods}>
        <Stack
          direction="row"
          alignItems="flex-start"
          gap="0.5rem"
          component="form"
          onSubmit={methods.handleSubmit(onSubmit)}
        >
          <FormWithSchema
            cy={`${EXTRA_ID}-context-user-input`}
            fields={USER_INPUT_FIELDS}
            rootProps={{ sx: { m: 0 } }}
          />
          <Button
            variant="contained"
            type="submit"
            color="secondary"
            startIcon={<AddCircledOutline />}
            sx={{ mt: '1em' }}
            data-cy={`${EXTRA_ID}-add-context-user-input`}
          >
            <Translate word={T.Add} />
          </Button>
        </Stack>
      </FormProvider>
      <Divider />
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="context">
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
                      error={get(errors, `${EXTRA_ID}.${SECTION_ID}.${index}`)}
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

export default UserInputsSection
