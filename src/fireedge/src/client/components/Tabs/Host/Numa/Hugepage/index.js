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

import { Box, List, ListItem, Paper, Typography } from '@mui/material'

import { Translate } from 'client/components/HOC'
import { useStyles } from 'client/components/Tabs/Host/Numa/Hugepage/styles'

import { prettyBytes } from 'client/utils'
import { T } from 'client/constants'

/**
 * @param {object} props - Props
 * @param {string[]} props.hugepage - Numa hugepage tab info
 * @returns {ReactElement} Information view
 */
const NumaHugepage = ({ hugepage }) => {
  const classes = useStyles()

  return (
    <Box>
      <Typography gutterBottom variant="subtitle1" component="h3">
        <Translate word={T.HugepageNode} />
      </Typography>
      <Paper variant="outlined">
        <List className={classes.list}>
          <ListItem className={classes.title}>
            <Typography noWrap>
              <Translate word={T.HugepageNodeSize} />
            </Typography>
            <Typography noWrap>
              <Translate word={T.HugepageNodeFree} />
            </Typography>
            <Typography noWrap>
              <Translate word={T.HugepageNodePages} />
            </Typography>
            <Typography noWrap>
              <Translate word={T.HugepageNodeUsage} />
            </Typography>
          </ListItem>
          {hugepage.length > 0 &&
            hugepage.map(({ FREE, PAGES, SIZE, USAGE }, index) => (
              <ListItem
                key={index}
                className={classes.item}
                dense
                data-cy={`hugepage-${index}`}
              >
                <Typography data-cy="size" noWrap>
                  {prettyBytes(SIZE)}
                </Typography>
                <Typography data-cy="free" noWrap>
                  {FREE}
                </Typography>
                <Typography data-cy="pages" noWrap>
                  {PAGES}
                </Typography>
                <Typography data-cy="usage" noWrap>
                  {USAGE}
                </Typography>
              </ListItem>
            ))}
        </List>
      </Paper>
    </Box>
  )
}

NumaHugepage.propTypes = {
  hugepage: PropTypes.array,
}

NumaHugepage.displayName = 'NumaHugepage'

export default NumaHugepage
