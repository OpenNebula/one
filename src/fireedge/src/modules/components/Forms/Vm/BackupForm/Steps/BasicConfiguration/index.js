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
/* eslint-disable jsdoc/require-jsdoc */
import PropTypes from 'prop-types'

import FormWithSchema from '@modules/components/Forms/FormWithSchema'
import { Tr } from '@modules/components/HOC'
import { T } from '@ConstantsModule'

import {
  SCHEMA,
  FIELDS,
} from '@modules/components/Forms/Vm/BackupForm/Steps/BasicConfiguration/schema'
import { Step } from '@UtilsModule'
import { BackupsTable, IncrementsTable } from '@modules/components/Tables'
import { Box, Typography, Divider } from '@mui/material'
import { useEffect, useState } from 'react'
import { useHistory, generatePath } from 'react-router-dom'
import { VmAPI, ImageAPI } from '@FeaturesModule'
import { PATH } from '@modules/components'

export const STEP_ID = 'configuration'

const Content = (props) => {
  const [increments, setIncrements] = useState([])
  const { vmId: id } = props
  const {
    data: vm = {},
    refetch,
    isFetching: fetchingVms,
  } = VmAPI.useGetVmQuery({ id })

  const vmBackupsConfig = vm?.BACKUPS?.BACKUP_CONFIG || {}

  const incrementalBackupImageId = []
    .concat(vm?.BACKUPS?.BACKUP_IDS?.ID)
    ?.at(-1)
  const incrementalBackups =
    'LAST_INCREMENT_ID' in vmBackupsConfig &&
    vmBackupsConfig?.MODE === 'INCREMENT' &&
    incrementalBackupImageId

  const [fetchBackupImage, { isFetching: fetchingImages }] =
    ImageAPI.useLazyGetImageQuery(
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
            <IncrementsTable.Table
              disableGlobalSort
              disableRowSelect
              increments={increments}
              isLoading={fetchingImages}
              refetch={fetchIncrements}
              onRowClick={(row) => handleRowClick(incrementalBackupImageId)}
            />
          ) : (
            <BackupsTable.Table
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
 * @param {object} props - Step props
 * @returns {Step} Configuration step
 */
const ConfigurationStep = (props) => ({
  id: STEP_ID,
  label: T.Configuration,
  resolver: () => SCHEMA(props),
  optionsValidate: { abortEarly: false },
  content: () => Content(props),
})

Content.propTypes = {
  vmId: PropTypes.string,
  data: PropTypes.any,
  setFormData: PropTypes.func,
  nics: PropTypes.array,
  isMultiple: PropTypes.bool,
}

export default ConfigurationStep
