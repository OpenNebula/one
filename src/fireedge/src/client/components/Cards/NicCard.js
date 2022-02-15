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
import { memo } from 'react'
import PropTypes from 'prop-types'

import {
  useMediaQuery,
  Typography,
  Box,
  Paper,
  Stack,
  Divider,
} from '@mui/material'

import { rowStyles } from 'client/components/Tables/styles'
import { StatusChip } from 'client/components/Status'
import MultipleTags from 'client/components/MultipleTags'
import SecurityGroupCard from 'client/components/Cards/SecurityGroupCard'

import { Translate } from 'client/components/HOC'
import { stringToBoolean } from 'client/models/Helper'
import { T, Nic, NicAlias } from 'client/constants'

const NicCard = memo(
  ({
    nic = {},
    actions = [],
    aliasActions = [],
    showParents = false,
    clipboardOnTags = true,
  }) => {
    const classes = rowStyles()
    const isMobile = useMediaQuery((theme) => theme.breakpoints.down('md'))

    /** @type {Nic|NicAlias} */
    const {
      NIC_ID,
      NETWORK = '-',
      IP,
      MAC,
      PCI_ID,
      RDP,
      SSH,
      PARENT,
      ADDRESS,
      ALIAS,
      SECURITY_GROUPS,
    } = nic

    const isAlias = !!PARENT?.length
    const isPciDevice = PCI_ID !== undefined

    const dataCy = isAlias ? 'alias' : 'nic'

    const noClipboardTags = [
      { text: stringToBoolean(RDP) && 'RDP', dataCy: `${dataCy}-rdp` },
      { text: stringToBoolean(SSH) && 'SSH', dataCy: `${dataCy}-ssh` },
      showParents && {
        text: isAlias ? `PARENT: ${PARENT}` : false,
        dataCy: `${dataCy}-parent`,
      },
    ].filter(({ text } = {}) => Boolean(text))

    const tags = [
      { text: IP, dataCy: `${dataCy}-ip` },
      { text: MAC, dataCy: `${dataCy}-mac` },
      { text: ADDRESS, dataCy: `${dataCy}-address` },
    ].filter(({ text } = {}) => Boolean(text))

    return (
      <Paper
        variant="outlined"
        className={classes.root}
        data-cy={`${dataCy}-${NIC_ID}`}
        sx={{
          flexWrap: 'wrap',
          boxShadow: 'none !important',
        }}
      >
        <Box
          className={classes.main}
          {...(!isAlias && !showParents && { pl: '1em' })}
        >
          <div className={classes.title}>
            <Typography component="span" data-cy={`${dataCy}-name`}>
              {`${NIC_ID} | ${NETWORK}`}
            </Typography>
            <span className={classes.labels}>
              {noClipboardTags.map((tag) => (
                <StatusChip
                  key={`${dataCy}-${NIC_ID}-${tag.dataCy}`}
                  text={tag.text}
                  dataCy={tag.dataCy}
                />
              ))}
              <MultipleTags
                clipboard={clipboardOnTags}
                limitTags={isMobile ? 1 : 3}
                tags={tags}
              />
            </span>
          </div>
        </Box>
        {!isPciDevice && <div className={classes.actions}>{actions}</div>}
        {!!ALIAS?.length && (
          <Box flexBasis="100%">
            {ALIAS?.map((alias) => (
              <NicCard
                key={alias.NIC_ID}
                nic={alias}
                actions={aliasActions}
                showParents={showParents}
              />
            ))}
          </Box>
        )}
        {Array.isArray(SECURITY_GROUPS) && !!SECURITY_GROUPS?.length && (
          <Paper
            variant="outlined"
            sx={{
              display: 'flex',
              flexBasis: '100%',
              flexDirection: 'column',
              gap: '0.5em',
              p: '0.8em',
            }}
          >
            <Typography variant="body1">
              <Translate word={T.SecurityGroups} />
            </Typography>

            <Stack direction="column" divider={<Divider />} spacing={1}>
              {SECURITY_GROUPS?.map((securityGroup, idx) => {
                const key = `nic${NIC_ID}-${idx}-${securityGroup.NAME}`

                return (
                  <SecurityGroupCard
                    key={key}
                    data-cy={key}
                    securityGroup={securityGroup}
                  />
                )
              })}
            </Stack>
          </Paper>
        )}
      </Paper>
    )
  }
)

NicCard.propTypes = {
  nic: PropTypes.object,
  actions: PropTypes.node,
  aliasActions: PropTypes.node,
  showParents: PropTypes.bool,
  clipboardOnTags: PropTypes.bool,
}

NicCard.displayName = 'NicCard'

export default NicCard
