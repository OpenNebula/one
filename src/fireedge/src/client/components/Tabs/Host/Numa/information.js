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
import PropTypes from 'prop-types'

import { Divider, Grid, Stack, Typography } from '@mui/material'
import { Translate } from 'client/components/HOC'

import NumaCore from 'client/components/Tabs/Host/Numa/Core'
import NumaMemory from 'client/components/Tabs/Host/Numa/Memory'
import NumaHugepage from 'client/components/Tabs/Host/Numa/Hugepage'

import { T } from 'client/constants'

/**
 * @param {object} props - Props
 * @param {object} props.node - Numa Node
 * @returns {ReactElement} Information tab
 */
const InformationPanel = ({ node = {} }) => {
  const { CORE, HUGEPAGE } = node

  return (
    <>
      <Stack
        gap="1em"
        gridTemplateColumns="repeat(auto-fit, minmax(49%, 1fr))"
        padding={{ sm: '0.8em' }}
      >
        <Typography gutterBottom variant="h2" component="h2">
          <Translate word={T.NumaNodeItem} values={node.NODE_ID} />
        </Typography>
        <Typography gutterBottom variant="subtitle1" component="h3">
          <Translate word={T.NumaNodeTitle} />
        </Typography>
      </Stack>
      <Divider variant="middle" />
      <Grid container spacing={2} sx={{ padding: '10px 0 20px' }}>
        {CORE.length &&
          CORE.map((core) => <NumaCore key={core.ID} core={core} />)}
      </Grid>
      <Divider variant="middle" />
      <Stack
        display="grid"
        gap="1em"
        gridTemplateColumns="repeat(auto-fit, minmax(49%, 1fr))"
        padding={{ sm: '0.8em' }}
      >
        <NumaHugepage hugepage={[HUGEPAGE].flat()} />
        <NumaMemory node={node} />
      </Stack>
    </>
  )
}

InformationPanel.propTypes = {
  node: PropTypes.object.isRequired,
}

InformationPanel.displayName = 'InformationPanel'

export default InformationPanel
