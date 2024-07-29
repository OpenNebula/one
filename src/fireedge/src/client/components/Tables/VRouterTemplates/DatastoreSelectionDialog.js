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
import { useState } from 'react'
import {
  Component,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  Button,
  DialogActions,
  Box,
  useTheme,
} from '@mui/material'
import { DatastoreCard } from 'client/components/Cards'
import { rowStyles } from 'client/components/Tables/styles'

/**
 * @param {object} root0 - Props
 * @param {boolean} root0.open - Is dialog open?
 * @param {Function} root0.onClose - On close handler
 * @param {Array} root0.datastores - Datastores
 * @param {Function} root0.onSelect - On Select hanlder
 * @param {boolean} root0.submitDisabled - Disable submit
 * @returns {Component} - Datastore selection dialog
 */
export const DatastoreDialog = ({
  open,
  onClose,
  datastores,
  submitDisabled,
  onSelect,
}) => {
  const theme = useTheme()
  const classes = rowStyles()

  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(0)
  const [selectedDatastore, setSelectedDatastore] = useState(null)
  const itemsPerPage = 5

  const filteredDatastores = datastores?.filter((datastore) =>
    datastore.NAME.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const paginatedDatastores = filteredDatastores.slice(
    currentPage * itemsPerPage,
    (currentPage + 1) * itemsPerPage
  )

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value)
    setCurrentPage(0)
  }

  const handleSelectDatastore = (datastore) => {
    setSelectedDatastore(datastore)
  }

  const handleConfirmSelection = () => {
    onSelect(selectedDatastore)
    onClose()
  }

  const handlePrevPage = () => {
    setCurrentPage((prevPage) => Math.max(prevPage - 1, 0))
  }

  const handleNextPage = () => {
    setCurrentPage((prevPage) =>
      Math.min(
        prevPage + 1,
        Math.ceil(filteredDatastores.length / itemsPerPage) - 1
      )
    )
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth={'md'} fullWidth>
      <DialogTitle>Select datastore for importing image</DialogTitle>
      <DialogContent>
        <TextField
          label="Search by name"
          variant="outlined"
          fullWidth
          margin="normal"
          onChange={handleSearchChange}
        />
        <Box
          sx={{
            mt: 2,
            overflow: 'auto',
          }}
        >
          {paginatedDatastores.map((datastore) => (
            <Box
              key={datastore.ID}
              sx={{
                width: '100%',
                mb: 2,
                cursor: 'pointer',
                border:
                  selectedDatastore?.ID === datastore.ID
                    ? `2px solid ${theme.palette.secondary.main}`
                    : `2px solid ${theme.palette.divider}`,
                '&:hover': {
                  backgroundColor: theme.palette.action.hover,
                },
              }}
              onClick={() => handleSelectDatastore(datastore)}
              className={classes.root}
            >
              <DatastoreCard
                datastore={datastore}
                rootProps={{
                  className: classes.root,
                  style: {
                    width: '100%',
                  },
                }}
              />
            </Box>
          ))}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handlePrevPage} disabled={currentPage === 0}>
          Prev
        </Button>
        <Button
          onClick={handleNextPage}
          disabled={
            (currentPage + 1) * itemsPerPage >= filteredDatastores.length
          }
        >
          Next
        </Button>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleConfirmSelection}
          disabled={!selectedDatastore || submitDisabled}
        >
          OK
        </Button>
      </DialogActions>
    </Dialog>
  )
}

DatastoreDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  datastores: PropTypes.array.isRequired,
  onSelect: PropTypes.func.isRequired,
  submitDisabled: PropTypes.bool,
}
