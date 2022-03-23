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
import { ReactElement, useEffect } from 'react'
import { useHistory, useParams } from 'react-router'
import { Box, Stack, Typography } from '@mui/material'

import { useGetVMRCSessionQuery } from 'client/features/OneApi/vcenter'
import {
  HeaderVmInfo,
  useWebMKSSession,
  // WebMKSKeyboard,
  WebMKSCtrlAltDelButton,
  WebMKSFullScreenButton,
} from 'client/components/Consoles'
import { PATH as ONE_PATH } from 'client/apps/sunstone/routesOne'
// import { PATH } from 'client/apps/sunstone/routes'
import { sentenceCase } from 'client/utils'
import { VM_ACTIONS } from 'client/constants'

/** @returns {ReactElement} WebMKS container */
const WebMKS = () => {
  const { id } = useParams()
  const { push: redirectTo } = useHistory()

  const { data: ticket } = useGetVMRCSessionQuery(
    { id },
    { refetchOnMountOrArgChange: false }
  )

  const { ...session } = useWebMKSSession({ token: ticket })
  const { status, displayElement } = session

  useEffect(() => {
    // token should be saved after click on console button from datatable
    !ticket && redirectTo(ONE_PATH.INSTANCE.VMS.LIST)
  }, [ticket])

  return (
    <Box display="grid" gridTemplateRows="auto 1fr" width={1} height={1}>
      <Stack>
        <HeaderVmInfo id={id} type={VM_ACTIONS.VMRC} />
        <Stack direction="row" alignItems="center" gap="1em" my="1em">
          <WebMKSCtrlAltDelButton {...session} />
          <WebMKSFullScreenButton {...session} />
          {/* <WebMKSKeyboard {...session} /> */}
          <Typography>{sentenceCase(status)}</Typography>
        </Stack>
      </Stack>
      {displayElement}
    </Box>
  )
}

export default WebMKS
