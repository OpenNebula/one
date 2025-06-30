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
import PopUpDialog from '@modules/components/Forms/VmTemplate/CreateForm/Steps/ExtraConfiguration/context/userInputsAutocompleteDialog'
import {
  Divider,
  FormControl,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Stack,
  styled,
} from '@mui/material'
import {
  Plus,
  Trash,
  WarningCircledOutline as WarningIcon,
} from 'iconoir-react'
import PropTypes from 'prop-types'
import { forwardRef, JSXElementConstructor, useState } from 'react'

import { yupResolver } from '@hookform/resolvers/yup'
import {
  DragDropContext,
  Draggable,
  Droppable,
  DropResult,
} from 'react-beautiful-dnd'
import {
  FormProvider,
  get,
  useFieldArray,
  useForm,
  useFormContext,
} from 'react-hook-form'

import { Tooltip } from '@modules/components/FormControl'
import { FormWithSchema, Legend } from '@modules/components/Forms'

import { STYLE_BUTTONS, T } from '@ConstantsModule'
import { useGeneralApi } from '@FeaturesModule'
import { getUserInputString } from '@ModelsModule'
import SubmitButton from '@modules/components/FormControl/SubmitButton'
import { STEP_ID as EXTRA_ID } from '@modules/components/Forms/VmTemplate/CreateForm/Steps/ExtraConfiguration'
import { USER_INPUT_FIELDS, USER_INPUT_SCHEMA } from './schema'

import { disableFields } from '@UtilsModule'

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
  (
    { removeAction, error, userInput: { name, ...ui } = {}, index, ...props },
    ref
  ) => (
    <UserItemDraggable
      ref={ref}
      secondaryAction={
        <SubmitButton
          icon={<Trash />}
          data-cy={`delete-userInput-${index}`}
          tooltip={T.Delete}
          onClick={removeAction}
        />
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
  index: PropTypes.number,
}

UserInputItem.displayName = 'UserInputItem'

/**
 * @param {object} props - Props
 * @param {object} props.oneConfig - Config of oned.conf
 * @param {boolean} props.adminGroup - User is admin or not
 * @returns {JSXElementConstructor} - User Inputs section
 */
const UserInputsSection = ({ oneConfig, adminGroup }) => {
  const [open, setOpen] = useState(false)
  const { enqueueError } = useGeneralApi()
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
    const isDuplicate = userInputs.some(
      (input) => input?.name?.toUpperCase() === newInput?.name?.toUpperCase()
    )

    if (isDuplicate) {
      enqueueError(T.ErrorUserInputDuplicated)

      return
    }

    append(newInput)
    methods.reset()
  }

  const onDelete = (index) => {
    remove(index)
  }

  /** @param {DropResult} result - Drop result */
  const onDragEnd = (result) => {
    const { destination, source } = result ?? {}

    if (destination && destination.index !== source.index) {
      move(source.index, destination.index)
    }
  }

  // const handleClickOpen = () => {
  //   setOpen(true)
  // }

  const handleClose = () => {
    setOpen(false)
  }

  return (
    <FormControl component="fieldset" sx={{ width: '100%' }}>
      <Legend title={T.UserInputs} tooltip={T.UserInputsConcept} />

      <FormProvider {...methods}>
        <Stack
          direction="column"
          alignItems="start"
          justifyContent="center"
          gap="0.5rem"
          component="form"
          onSubmit={methods.handleSubmit(onSubmit)}
        >
          <FormWithSchema
            cy={`${EXTRA_ID}-context-user-input`}
            saveState={true}
            fields={disableFields(
              USER_INPUT_FIELDS,
              'USER_INPUTS',
              oneConfig,
              adminGroup
            )}
            rootProps={{ sx: { m: 0 } }}
            fieldPath={`${EXTRA_ID}.Context`}
          />
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="start"
            gap="0.5rem"
            marginBottom="0.5rem"
          >
            <SubmitButton
              startIcon={<Plus />}
              data-cy={`${EXTRA_ID}-add-context-user-input`}
              label={T.Add}
              importance={STYLE_BUTTONS.IMPORTANCE.SECONDARY}
              size={STYLE_BUTTONS.SIZE.MEDIUM}
              type={STYLE_BUTTONS.TYPE.FILLED}
            />
          </Stack>
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
                      index={index}
                      ref={innerRef}
                      userInput={userInput}
                      error={get(errors, `${EXTRA_ID}.${SECTION_ID}.${index}`)}
                      removeAction={() => onDelete(index)}
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
      <PopUpDialog open={open} handleClose={handleClose} />
    </FormControl>
  )
}

UserInputsSection.propTypes = {
  oneConfig: PropTypes.object,
  adminGroup: PropTypes.bool,
}

export default UserInputsSection
