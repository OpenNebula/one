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
import { Component, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useLazyGetVRouterTemplatesQuery } from 'client/features/OneApi/vrouterTemplate'
import {
  addUserInputSuggestionVR,
  removeUserInputSuggestionVR,
  setUserInputSuggestionsVR,
} from 'client/features/Persistent/actions'
import { useGeneralApi } from 'client/features/General'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Typography,
  Box,
  CircularProgress,
} from '@mui/material'
import { Trash as DeleteIcon, Download } from 'iconoir-react'
import { T } from 'client/constants'

/**
 * @param {object} root0 - Props
 * @param {boolean} root0.open - Is dialog open?
 * @param {Function} root0.handleClose - Handle closing
 * @returns {Component} - User inputs dialog
 */
const PopUpDialog = ({ open, handleClose }) => {
  const [text, setText] = useState('')
  const [value, setValue] = useState('')
  const [error, setError] = useState(false)
  const [fetchVRTemplates, { isFetching }] = useLazyGetVRouterTemplatesQuery(
    undefined,
    {
      skip: true,
    }
  )

  const { enqueueError } = useGeneralApi()
  const items = useSelector((state) => state.persistent.userInputSuggestionsVR)
  const dispatch = useDispatch()

  const validateValue = (val) => /^[a-zA-Z0-9_]+$/.test(val)

  const handleSubmit = () => {
    if (text && value && validateValue(value)) {
      dispatch(addUserInputSuggestionVR({ text, value }))
      setText('')
      setValue('')
      setError(false)
    } else {
      setError(true)
    }
  }

  const handleDelete = (itemId) => {
    dispatch(removeUserInputSuggestionVR(itemId))
  }

  const fetchSuggestions = async () => {
    await fetchVRTemplates()
      .unwrap()
      .then((data) => {
        const serviceVRouter = [data]
          ?.flat()
          ?.find((template) => template.NAME === 'Service Virtual Router')
        if (serviceVRouter) {
          const userInputs = serviceVRouter.TEMPLATE.USER_INPUTS
          const formattedSuggestions = Object.entries(userInputs).map(
            ([key, val]) => {
              // eslint-disable-next-line no-unused-vars
              const [_, type, description] = val.split('|')

              return { text: `${description} (${type.trim()})`, value: key }
            }
          )
          dispatch(setUserInputSuggestionsVR(formattedSuggestions))
        }
      })
      .catch(() => {
        enqueueError(T.ErrorUserInputAutocompleteFetch)
      })
  }

  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogTitle>Add autocomplete suggestion</DialogTitle>
      <DialogContent>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'end',
            mb: 2,
          }}
        >
          <Button
            variant="contained"
            color="primary"
            onClick={fetchSuggestions}
            disabled={isFetching}
            startIcon={
              isFetching ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <Download />
              )
            }
          >
            Official suggestions
          </Button>
        </Box>

        <TextField
          autoFocus
          margin="dense"
          label="Text"
          type="text"
          fullWidth
          value={text}
          onChange={(e) => setText(e.target.value)}
          error={error && !text}
          helperText={error && !text ? 'Text is required' : ''}
          placeholder="Display value in list"
        />
        <TextField
          margin="dense"
          label="Value"
          type="text"
          fullWidth
          value={value}
          onChange={(e) => setValue(e.target.value)}
          error={error && (!value || !validateValue(value))}
          helperText={
            error && (!value || !validateValue(value))
              ? 'Value must be a single word containing only letters, numbers, or underscores'
              : ''
          }
          placeholder="Value on template"
        />
        <Box sx={{ mt: 2 }}>
          {items.map((item, index) => (
            <Card
              key={`${item.text}-${index}`}
              variant="outlined"
              sx={{
                mb: 1,
                display: 'flex',
                alignItems: 'center',
                padding: '8px',
                borderRadius: '10px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              }}
            >
              <CardContent sx={{ flexGrow: 1, padding: '8px !important' }}>
                <Typography variant="body2" component="div">
                  {item.text}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {item.value}
                </Typography>
              </CardContent>
              <CardActions sx={{ padding: '0' }}>
                <IconButton
                  edge="end"
                  aria-label="delete"
                  onClick={() => handleDelete(item.text)}
                  size="small"
                >
                  <DeleteIcon />
                </IconButton>
              </CardActions>
            </Card>
          ))}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button onClick={handleSubmit}>Add</Button>
      </DialogActions>
    </Dialog>
  )
}

PopUpDialog.propTypes = {
  open: PropTypes.bool,
  handleClose: PropTypes.func,
}

export default PopUpDialog
