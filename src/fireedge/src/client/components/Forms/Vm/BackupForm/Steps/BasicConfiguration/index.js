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
/* eslint-disable jsdoc/require-jsdoc */
import PropTypes from 'prop-types'

import FormWithSchema from 'client/components/Forms/FormWithSchema'
import { Tr } from 'client/components/HOC'
import { T } from 'client/constants'

import {
  SCHEMA,
  FIELDS,
} from 'client/components/Forms/Vm/BackupForm/Steps/BasicConfiguration/schema'
import { Step } from 'client/utils'
import { BackupsTable, IncrementsTable } from 'client/components/Tables'
import { Box, Typography, Divider } from '@mui/material'
import { useEffect, useState } from 'react'
import { useHistory, generatePath } from 'react-router-dom'
import { useGetVmQuery } from 'client/features/OneApi/vm'
import { useLazyGetImageQuery } from 'client/features/OneApi/image'
import { PATH } from 'client/apps/sunstone/routesOne'

export const STEP_ID = 'configuration'

const Content = (props) => {
  const [increments, setIncrements] = useState([])
  const { vmId: id } = props
  const {
    data: vm = {},
    refetch,
    isFetching: fetchingVms,
  } = useGetVmQuery({ id })

  const vmBackupsConfig = vm?.BACKUPS?.BACKUP_CONFIG || {}

  const incrementalBackupImageId = []
    .concat(vm?.BACKUPS?.BACKUP_IDS?.ID)
    ?.at(-1)
  const incrementalBackups =
    'LAST_INCREMENT_ID' in vmBackupsConfig &&
    vmBackupsConfig?.MODE === 'INCREMENT' &&
    incrementalBackupImageId

  const [fetchBackupImage, { isFetching: fetchingImages }] =
    useLazyGetImageQuery(
      { incrementalBackupImageId },
      {
        skip: true,
      }
    )

  const fetchIncrements = async () => {
    if (incrementalBackups) {
      const result = await fetchBackupImage({
        id: incrementalBackupImageId,
      }).unwrap()
      const image = result || {}
      const fetchedIncrements = image?.BACKUP_INCREMENTS?.INCREMENT
        ? Array.isArray(image.BACKUP_INCREMENTS.INCREMENT)
          ? image.BACKUP_INCREMENTS.INCREMENT
          : [image.BACKUP_INCREMENTS.INCREMENT]
        : []

      setIncrements(fetchedIncrements)
    }
  }

  useEffect(() => {
    fetchIncrements()
  }, [incrementalBackups, fetchBackupImage])

  const path = PATH.STORAGE.BACKUPS.DETAIL
  const history = useHistory()

  const handleRowClick = (rowId) => {
    history.push(generatePath(path, { id: String(rowId) }))
  }

  return (
    <Box>
      <FormWithSchema
        cy="restore-configuration"
        id={STEP_ID}
        fields={() => FIELDS(props)}
      />
      <Divider sx={{ my: 2 }} />
      <Box sx={{ mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          {Tr(`${T.Previous} ${T.Backups}`)}
        </Typography>
        <Box
          sx={{
            padding: '16px',
          }}
        >
          {incrementalBackups ? (
            <IncrementsTable
              disableGlobalSort
              disableRowSelect
              increments={increments}
              isLoading={fetchingImages}
              refetch={fetchIncrements}
              onRowClick={(row) => handleRowClick(incrementalBackupImageId)}
            />
          ) : (
            <BackupsTable
              disableRowSelect
              disableGlobalSort
              refetchVm={refetch}
              isFetchingVm={fetchingVms}
              vm={vm}
              onRowClick={(row) => handleRowClick(row.ID)}
            />
          )}
        </Box>
      </Box>
    </Box>
  )
}

/**
 * Step to configure the marketplace app.
 *
 * @param {object} isMultiple - is multiple rows
 * @returns {Step} Configuration step
 */
const ConfigurationStep = (isMultiple) => ({
  id: STEP_ID,
  label: T.Configuration,
  resolver: () => SCHEMA(isMultiple),
  optionsValidate: { abortEarly: false },
  content: () => Content(isMultiple),
})

Content.propTypes = {
  vmId: PropTypes.string,
  data: PropTypes.any,
  setFormData: PropTypes.func,
  nics: PropTypes.array,
  isMultiple: PropTypes.bool,
}

export default ConfigurationStep
