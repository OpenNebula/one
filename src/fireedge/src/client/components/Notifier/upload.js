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
import { ReactElement } from 'react'
import {
  Snackbar,
  Alert,
  CircularProgress,
  Box,
  Typography,
} from '@mui/material'
import { useGeneral, useGeneralApi } from 'client/features/General'

/**
 * @returns {ReactElement} App rendered.
 */
const NotifierUpload = () => {
  const { upload } = useGeneral()
  const { uploadSnackbar } = useGeneralApi()

  const handleClose = () => uploadSnackbar(0)

  return (
    <Snackbar
      open={upload > 0}
      autoHideDuration={10000}
      onClose={handleClose}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'right',
      }}
    >
      <Alert
        icon={false}
        onClose={handleClose}
        severity="info"
        variant="filled"
        sx={{ width: '100%' }}
      >
        <Box sx={{ position: 'relative', display: 'inline-flex' }}>
          <CircularProgress
            variant="determinate"
            value={upload}
            color="inherit"
          />
          <Box
            sx={{
              top: 0,
              left: 0,
              bottom: 0,
              right: 0,
              position: 'absolute',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography
              variant="caption"
              component="div"
              color="text.secondary"
            >
              {`${upload}%`}
            </Typography>
          </Box>
        </Box>
      </Alert>
    </Snackbar>
  )
}

export default NotifierUpload
