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
import PropTypes from 'prop-types'
import { createRef, memo, useMemo, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'

import { InputAdornment, Link, Stack, Typography } from '@mui/material'

import { DialogConfirmation } from 'client/components/Dialogs'
import { Actions, Inputs } from 'client/components/Tabs/Common/Attribute'
import { useDialog } from 'client/hooks'

import { Translate, Tr } from 'client/components/HOC'
import { T } from 'client/constants'

const Column = (props) => {
  const { isEditing, ...restProps } = props

  return (
    <Stack
      direction="row"
      alignItems="center"
      sx={{
        '&:hover > .actions': { display: 'contents' },
        '&': { ...(isEditing ? { overflow: 'visible !important' } : {}) },
        '& .slider > span[data-index="0"][aria-hidden="true"]': {
          left: '0px !important',
        },
      }}
      {...restProps}
    />
  )
}

Column.propTypes = {
  isEditing: PropTypes.bool,
}

Column.displayName = 'Column'

const ActionWrapper = (props) => (
  <Stack direction="row" component="span" className="actions" {...props} />
)

const Attribute = memo(
  ({
    canCopy = false,
    canDelete,
    canEdit,
    handleDelete,
    handleEdit,
    handleGetOptionList,
    askToDelete = true,
    link,
    icon,
    name,
    path = name,
    showActionsOnHover = false,
    value,
    valueInOptionList,
    dataCy,
    min,
    max,
    currentValue,
    unit,
    unitParser = false,
    title = '',
    fullWidth = false,
  }) => {
    const numberOfParents = useMemo(() => path.split('.').length - 1, [path])

    const [isEditing, setIsEditing] = useState(() => false)
    const [options, setOptions] = useState(() => [])
    const { display, show, hide } = useDialog()
    const inputRef = createRef()

    const handleEditAttribute = async () => {
      await handleEdit?.(path, inputRef.current.value)
      setIsEditing(false)
    }

    const handleCancel = () => setIsEditing(false)

    const handleActiveEditForm = async () => {
      const response = (await handleGetOptionList?.()) ?? []
      const isFormatValid = response?.every?.(
        ({ text, value: optionValue } = {}) => !!text && !!optionValue
      )

      if (!handleGetOptionList || isFormatValid) {
        setOptions(response)
        setIsEditing(true)
      }
    }

    const handleDeleteAttribute = async () => {
      try {
        await handleDelete?.(path)
      } finally {
        hide()
      }
    }

    return (
      <>
        <Column>
          <Typography
            noWrap
            component="span"
            variant="body2"
            flexGrow={1}
            sx={{
              ...(numberOfParents > 0 && { pl: `${numberOfParents}em` }),
              ...(icon && {
                display: 'flex',
                alignItems: 'center',
                gap: '0.5em',
              }),
            }}
          >
            {icon}
            {Tr(name)}
          </Typography>
          <ActionWrapper {...(showActionsOnHover && { display: 'none' })}>
            {canCopy && <Actions.Copy name={name} value={name} />}
          </ActionWrapper>
        </Column>
        <Column isEditing={isEditing}>
          {isEditing ? (
            <>
              {handleGetOptionList ? (
                <Inputs.Select
                  name={name}
                  initialValue={valueInOptionList}
                  ref={inputRef}
                  options={options}
                />
              ) : min && max ? (
                <Inputs.SliderInput
                  name={name}
                  initialValue={currentValue}
                  ref={inputRef}
                  min={+min}
                  max={+max}
                  unitParser={unitParser}
                  {...(unit
                    ? {
                        InputProps: {
                          endAdornment: (
                            <InputAdornment position="end">
                              {unit}
                            </InputAdornment>
                          ),
                        },
                      }
                    : {})}
                />
              ) : (
                <Inputs.Text
                  name={name}
                  initialValue={value}
                  ref={inputRef}
                  fullWidth={fullWidth}
                />
              )}
              <Actions.Accept name={name} handleClick={handleEditAttribute} />
              <Actions.Cancel name={name} handleClick={handleCancel} />
            </>
          ) : (
            <>
              <Typography
                noWrap
                component="span"
                variant="body2"
                flexGrow={1}
                title={typeof value === 'string' ? value : undefined}
                data-cy={dataCy}
              >
                {link ? (
                  <Link color="secondary" component={RouterLink} to={link}>
                    {value}
                  </Link>
                ) : (
                  Tr(value)
                )}
              </Typography>
              <ActionWrapper {...(showActionsOnHover && { display: 'none' })}>
                {value && canCopy && <Actions.Copy name={name} value={value} />}
                {(value || numberOfParents > 0) && canEdit && (
                  <Actions.Edit
                    title={title || name}
                    name={name}
                    handleClick={handleActiveEditForm}
                    tooltip={name}
                  />
                )}
                {canDelete && (
                  <Actions.Delete
                    name={name}
                    handleClick={askToDelete ? show : handleDeleteAttribute}
                  />
                )}
              </ActionWrapper>
            </>
          )}

          {display && (
            <DialogConfirmation
              title={<Translate word={T.DeleteSomething} values={path} />}
              handleAccept={handleDeleteAttribute}
              handleCancel={hide}
              dataCy={'confirmation-dialog'}
            >
              <p>
                <Translate word={T.DoYouWantProceed} />
              </p>
            </DialogConfirmation>
          )}
        </Column>
      </>
    )
  }
)

export const AttributePropTypes = {
  canCopy: PropTypes.bool,
  canDelete: PropTypes.bool,
  canEdit: PropTypes.bool,
  handleDelete: PropTypes.func,
  handleEdit: PropTypes.func,
  handleGetOptionList: PropTypes.func,
  askToDelete: PropTypes.bool,
  link: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
  icon: PropTypes.any,
  name: PropTypes.string.isRequired,
  path: PropTypes.string,
  showActionsOnHover: PropTypes.bool,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  valueInOptionList: PropTypes.string,
  dataCy: PropTypes.string,
  min: PropTypes.string,
  max: PropTypes.string,
  currentValue: PropTypes.string,
  unit: PropTypes.string,
  unitParser: PropTypes.bool,
  title: PropTypes.string,
  fullWidth: PropTypes.bool,
}

Attribute.propTypes = AttributePropTypes

Attribute.displayName = 'Attribute'

export default Attribute
