/* ------------------------------------------------------------------------- *
 * Copyright 2002-2022, OpenNebula Project, OpenNebula Systems               *
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
import { useParams, Redirect } from 'react-router-dom'
import { Container, Box } from '@mui/material'

import ClusterTabs from 'client/components/Tabs/Cluster'

function ClusterDetail() {
  const { id } = useParams()

  if (Number.isNaN(+id)) {
    return <Redirect to="/" />
  }

  return (
    <Box
      py={2}
      overflow="auto"
      display="flex"
      flexDirection="column"
      component={Container}
    >
      {<ClusterTabs id={id} />}
    </Box>
  )
}

export default ClusterDetail
