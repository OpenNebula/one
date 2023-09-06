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
import PropTypes from 'prop-types'
import { Component, useMemo, useState } from 'react'
import { LinearProgressWithLabel } from 'client/components/Status'
import {
  useGetUserQuery,
  useUpdateUserQuotaMutation,
} from 'client/features/OneApi/user'
import { getQuotaUsage } from 'client/models/User'
import {
  Box,
  Stack,
  Typography,
  Grid,
  Card,
  CardContent,
  IconButton,
  TextField,
  Button,
} from '@mui/material'
import { T } from 'client/constants'
import { EditPencil } from 'iconoir-react'
import { useGeneralApi } from 'client/features/General'

/**
 * QuotasInfoTab component displays quota information for a user.
 *
 * @param {object} props - Component properties.
 * @param {string} props.id - User ID.
 * @returns {Component} Rendered component.
 */
const QuotasInfoTab = ({ id }) => {
  const { enqueueSuccess, enqueueError } = useGeneralApi()
  const [updateUserQuota] = useUpdateUserQuotaMutation()
  const { VM_QUOTA, DATASTORE_QUOTA, IMAGE_QUOTA, NETWORK_QUOTA } =
    useGetUserQuery({ id })?.data

  const handleQuotaUpdate = async (type, localQuota) => {
    const quotaXml = quotasToXml(type, localQuota)

    let result
    try {
      result = await updateUserQuota({ id, template: quotaXml })
    } catch (error) {
      result = { error: error.message }
    }

    if (result && result.error) {
      enqueueError(`Error updating quota: ${result.error}`)
    } else {
      enqueueSuccess('Quota updated successfully!')
    }
  }

  return (
    <Grid container spacing={2}>
      <Grid item xs={6}>
        <QuotaDisplay
          id={id}
          title={T.VmQuota}
          quota={VM_QUOTA}
          type="VM"
          onQuotaUpdate={handleQuotaUpdate}
        />
      </Grid>
      <Grid item xs={6}>
        <QuotaDisplay
          id={id}
          title={T.DatastoreQuota}
          quota={DATASTORE_QUOTA}
          type="DATASTORE"
          onQuotaUpdate={handleQuotaUpdate}
        />
      </Grid>
      <Grid item xs={6}>
        <QuotaDisplay
          id={id}
          title={T.NetworkQuota}
          quota={NETWORK_QUOTA}
          type="NETWORK"
          onQuotaUpdate={handleQuotaUpdate}
        />
      </Grid>
      <Grid item xs={6}>
        <QuotaDisplay
          id={id}
          title={T.ImageQuota}
          quota={IMAGE_QUOTA}
          type="IMAGE"
          onQuotaUpdate={handleQuotaUpdate}
        />
      </Grid>
    </Grid>
  )
}

/**
 * QuotaDisplay component displays a specific quota type with its details.
 *
 * @param {object} props - Component properties.
 * @param {string} props.title - Quota title.
 * @param {object} props.quota - Quota data.
 * @param {string} props.type - Quota type.
 * @param {Function} props.onQuotaUpdate - Callback function to handle quota updates.
 * @returns {Component} Rendered component.
 */
const QuotaDisplay = ({ title, quota, type, onQuotaUpdate }) => {
  const [isEditingQuota, setIsEditingQuota] = useState({})
  const [localQuota, setLocalQuota] = useState(quota)

  const quotaUsage = useMemo(
    () => getQuotaUsage(type, localQuota),
    [type, localQuota]
  )

  const handleEditClick = (key) => {
    setIsEditingQuota((prev) => ({ ...prev, [key]: true }))
  }

  const handleSaveClick = async (key) => {
    setIsEditingQuota((prev) => ({ ...prev, [key]: false }))

    onQuotaUpdate(type, { [key]: localQuota[key] })
  }

  const handleQuotaValueChange = (key, event) => {
    setLocalQuota((prev) => ({ ...prev, [key]: event.target.value }))
  }

  const renderProgress = (caption, value, label, key) => (
    <Box mb={2} display="flex" alignItems="center">
      <Box width={100} flexShrink={0}>
        <Typography variant="subtitle2" gutterBottom>
          {caption}
        </Typography>
      </Box>
      <Box flexGrow={1} marginX={2}>
        <LinearProgressWithLabel
          value={value}
          label={label}
          high={66}
          low={33}
        />
      </Box>
      {!isEditingQuota[key] ? (
        <IconButton onClick={() => handleEditClick(key)}>
          <EditPencil />
        </IconButton>
      ) : (
        <>
          <TextField
            label="Quota Value"
            value={localQuota[key] || ''}
            onChange={(e) => handleQuotaValueChange(key, e)}
            variant="outlined"
            size="small"
            style={{ marginLeft: '10px' }}
          />
          <Button
            variant="contained"
            color="primary"
            size="small"
            style={{ marginLeft: '10px' }}
            onClick={() => handleSaveClick(key)}
          >
            Save
          </Button>
        </>
      )}
    </Box>
  )

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
        <Stack spacing={2}>
          {type === 'VM' && (
            <>
              {renderProgress(
                'VMs',
                quotaUsage.vms.percentOfUsed,
                quotaUsage.vms.percentLabel,
                'vms'
              )}
              {renderProgress(
                'Running VMs',
                quotaUsage.runningVms.percentOfUsed,
                quotaUsage.runningVms.percentLabel,
                'runningVms'
              )}
              {renderProgress(
                'CPU',
                quotaUsage.cpu.percentOfUsed,
                quotaUsage.cpu.percentLabel,
                'cpu'
              )}
              {renderProgress(
                'Running CPU',
                quotaUsage.runningCpu.percentOfUsed,
                quotaUsage.runningCpu.percentLabel,
                'runningCpu'
              )}
              {renderProgress(
                'System disks',
                quotaUsage.systemDiskSize.percentOfUsed,
                quotaUsage.systemDiskSize.percentLabel,
                'systemDiskSize'
              )}
            </>
          )}
          {type === 'DATASTORE' && (
            <>
              {renderProgress(
                'Memory',
                quotaUsage.size.percentOfUsed,
                quotaUsage.size.percentLabel,
                'size'
              )}
              {renderProgress(
                'Running Memory',
                quotaUsage.images.percentOfUsed,
                quotaUsage.images.percentLabel,
                'images'
              )}
            </>
          )}
          {type === 'IMAGE' && (
            <>
              {renderProgress(
                'RVMS',
                quotaUsage.rvms.percentOfUsed,
                quotaUsage.rvms.percentLabel,
                'rvms'
              )}
            </>
          )}
          {type === 'NETWORK' && (
            <>
              {renderProgress(
                'Leases',
                quotaUsage.leases.percentOfUsed,
                quotaUsage.leases.percentLabel,
                'leases'
              )}
            </>
          )}
        </Stack>
      </CardContent>
    </Card>
  )
}

/**
 * Convert quota data to XML format.
 *
 * @param {string} type - Quota type.
 * @param {object} quota - Quota data.
 * @returns {string} XML representation of the quota.
 */
const quotasToXml = (type, quota) => {
  let innerXml = ''

  for (const [key, value] of Object.entries(quota)) {
    innerXml += `<${key.toUpperCase()}>${value}</${key.toUpperCase()}>`
  }

  return `<TEMPLATE><${type}>${innerXml}</${type}></TEMPLATE>`
}

QuotasInfoTab.propTypes = {
  id: PropTypes.string.isRequired,
}

QuotaDisplay.propTypes = {
  title: PropTypes.string.isRequired,
  quota: PropTypes.string.isRequired,
  type: PropTypes.oneOf(['VM', 'DATASTORE', 'IMAGE', 'NETWORK']).isRequired,
  onQuotaUpdate: PropTypes.func,
}

QuotasInfoTab.displayName = 'QuotasInfoTab'
QuotaDisplay.displayName = 'QuotaDisplay'

export default QuotasInfoTab
