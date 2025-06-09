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
import { T } from '@ConstantsModule'
import { Tr } from '@modules/components/HOC'
import { Actions } from '@modules/components/Tabs/Common/Attribute'
import {
  Autocomplete,
  List,
  ListItem,
  Paper,
  Stack,
  TextField,
  Typography,
  styled,
} from '@mui/material'
import PropTypes from 'prop-types'
import { ReactElement, useEffect, useState } from 'react'

const OPTIONS = ['auto', '-']
const NAME = 'serial'

/** esto no se si sirva */
const Item = styled(ListItem)(({ theme }) => ({
  gap: '1em',
  '& > *': {
    flex: '1 1 50%',
    overflow: 'hidden',
    minHeight: '100%',
  },
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
}))

const Column = (props) => {
  const { isEditing, ...restProps } = props

  return (
    <Stack
      direction="row"
      alignItems="center"
      sx={{
        '&:hover > .actions': { display: 'contents' },
        '&': { ...(isEditing ? { overflow: 'visible !important' } : {}) },
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

/**
 * Render a panel for editing the serial number of a resource.
 *
 * @param {object} props - Props
 * @param {function(string)} props.handleEdit - Function to handle the edit action
 * @param {string} props.value - Current serial value
 * @returns {ReactElement} Information tab
 */
const SerialPanel = ({ handleEdit, value = '' }) => {
  const [edit, setEdit] = useState(false)
  const [serial, setSerial] = useState('')

  useEffect(() => {
    value && setSerial(value)
  }, [value])

  const handleSend = async () => {
    typeof handleEdit === 'function' && (await handleEdit('SERIAL', serial))
    setEdit(false)
  }

  const handleChange = (_, val, reason) => {
    if (reason === 'input') {
      setSerial(val)
    } else {
      const newValue = val === '-' ? '' : val
      const newValueLowercase = newValue?.toLowerCase()
      setSerial(
        OPTIONS.includes(newValueLowercase) ? newValueLowercase : newValue
      )
    }
  }

  const handleCancel = () => {
    setSerial(value)
    setEdit(false)
  }

  return (
    <Paper variant="outlined">
      <List variant="outlined">
        <Item>
          <Column>
            <Typography noWrap component="span" variant="body2" flexGrow={1}>
              {Tr(T.Serial)}
            </Typography>
          </Column>
          <Column isEditing={edit}>
            {edit ? (
              <>
                <Autocomplete
                  sx={{ flexGrow: 1 }}
                  freeSolo
                  options={OPTIONS}
                  value={serial === '' ? '-' : serial}
                  getOptionLabel={(option) =>
                    OPTIONS.includes(option) ? option.toUpperCase() : option
                  }
                  onChange={handleChange}
                  onInputChange={handleChange}
                  renderInput={(params) => (
                    <TextField {...params} label={Tr(T.Serial)} />
                  )}
                />
                <ActionWrapper>
                  <Actions.Accept name={NAME} handleClick={handleSend} />
                  <Actions.Cancel name={NAME} handleClick={handleCancel} />
                </ActionWrapper>
              </>
            ) : (
              <>
                <Typography
                  noWrap
                  component="span"
                  variant="body2"
                  flexGrow={1}
                  data-cy={'serial'}
                >
                  {Tr(value || '-')}
                </Typography>
                <ActionWrapper>
                  <Actions.Edit
                    title={NAME}
                    name={NAME}
                    handleClick={() => setEdit(true)}
                    tooltip={NAME}
                  />
                </ActionWrapper>
              </>
            )}
          </Column>
        </Item>
      </List>
    </Paper>
  )
}

SerialPanel.propTypes = {
  handleEdit: PropTypes.func,
  value: PropTypes.string,
}

SerialPanel.displayName = 'SerialPanel'

export default SerialPanel
