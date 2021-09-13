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
import { memo, useMemo, useState, createRef } from 'react'
import PropTypes from 'prop-types'
import { Link as RouterLink } from 'react-router-dom'
import { makeStyles, Typography, Link } from '@material-ui/core'

import { useDialog } from 'client/hooks'
import { DialogConfirmation } from 'client/components/Dialogs'
import { Actions, Inputs } from 'client/components/Tabs/Common/Attribute'

import { Tr, Translate } from 'client/components/HOC'
import { T } from 'client/constants'

const useStyles = makeStyles({
  wrapper: {
    display: 'flex',
    alignItems: 'center',
    '& > *:first-child': {
      flexGrow: 1
    }
  },
  select: {
    textOverflow: 'ellipsis'
  },
  nested: ({ numberOfParents }) => numberOfParents > 0 && ({
    paddingLeft: `${numberOfParents}em`
  })
})

const Attribute = memo(({
  canDelete,
  canEdit,
  handleEdit,
  handleDelete,
  handleGetOptionList,
  link,
  name,
  path = name,
  value,
  valueInOptionList
}) => {
  const numberOfParents = useMemo(() => path.split('.').length - 1, [path])
  const classes = useStyles({ numberOfParents })

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
    const response = await handleGetOptionList?.() ?? []
    const isFormatValid = response?.every?.(({ text, value } = {}) => !!text && !!value)

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
      <Typography noWrap variant='body2' title={Tr(name)} className={classes.nested}>
        {Tr(name)}
      </Typography>
      <div className={classes.wrapper}>
        {isEditing ? (
          <>
            {handleGetOptionList ? (
              <Inputs.Select
                name={name}
                initialValue={valueInOptionList}
                ref={inputRef}
                options={options} />
            ) : (
              <Inputs.Text
                name={name}
                initialValue={value}
                ref={inputRef} />
            )}
            <Actions.Accept name={name} handleClick={handleEditAttribute} />
            <Actions.Cancel name={name} handleClick={handleCancel} />
          </>
        ) : (
          <>
            <Typography
              noWrap
              component='span'
              variant='body2'
              title={typeof value === 'string' ? value : undefined}
            >
              {link
                ? (
                  <Link color='secondary' component={RouterLink} to={link}>
                    {value}
                  </Link>
                )
                : value
              }
            </Typography>
            {canEdit && (
              <Actions.Edit name={name} handleClick={handleActiveEditForm} />
            )}
            {canDelete && (
              <Actions.Delete name={name} handleClick={show} />
            )}
          </>
        )}

        {display && (
          <DialogConfirmation
            title={<Translate word={T.DeleteSomething} values={path} />}
            handleAccept={handleDeleteAttribute}
            handleCancel={hide}
          >
            <p>
              <Translate word={T.DoYouWantProceed} />
            </p>
          </DialogConfirmation>
        )}
      </div>
    </>
  )
})

export const AttributePropTypes = {
  canDelete: PropTypes.bool,
  canEdit: PropTypes.bool,
  handleEdit: PropTypes.func,
  handleDelete: PropTypes.func,
  handleGetOptionList: PropTypes.func,
  link: PropTypes.string,
  name: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.object
  ]),
  path: PropTypes.string,
  valueInOptionList: PropTypes.string
}

Attribute.propTypes = AttributePropTypes

Attribute.displayName = 'Attribute'

export default Attribute
