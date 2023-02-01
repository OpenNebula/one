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
import { ReactElement, memo, useMemo } from 'react'

import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Paper,
  Stack,
  Typography,
  useMediaQuery,
} from '@mui/material'
import { Network } from 'iconoir-react'

import MultipleTags from 'client/components/MultipleTags'
import { StatusChip } from 'client/components/Status'
import { rowStyles } from 'client/components/Tables/styles'

import { Translate } from 'client/components/HOC'
import { SecurityGroupRules } from 'client/components/Tabs/Common/RulesSecGroups'
import { Nic, NicAlias, T } from 'client/constants'
import { stringToBoolean } from 'client/models/Helper'
import { groupBy } from 'client/utils'

const NicCard = memo(
  /**
   * @param {object} props - Props
   * @param {Nic|NicAlias} props.nic - NIC
   * @param {ReactElement} [props.actions] - Actions
   * @param {function({ alias: NicAlias }):ReactElement} [props.aliasActions] - Alias actions
   * @param {function({ securityGroupId: string }):ReactElement} [props.securityGroupActions] - Security group actions
   * @param {boolean} [props.showParents] -
   * @param {boolean} [props.clipboardOnTags] -
   * @returns {ReactElement} - Card
   */
  ({
    nic = {},
    actions,
    aliasActions,
    securityGroupActions,
    showParents = false,
    clipboardOnTags = true,
  }) => {
    const classes = rowStyles()
    const isMobile = useMediaQuery((theme) => theme.breakpoints.down('md'))

    const {
      NIC_ID,
      NETWORK = '-',
      IP,
      IP6,
      IP6_GLOBAL,
      IP6_ULA,
      MAC,
      PCI_ID,
      RDP,
      SSH,
      PARENT,
      ADDRESS,
      ALIAS,
      SECURITY_GROUPS,
      TYPE,
    } = nic

    const isAlias = !!PARENT?.length
    const isPciDevice = PCI_ID !== undefined || TYPE === 'NIC'
    const isAdditionalIp = NIC_ID === undefined || NETWORK === 'Additional IP'

    const dataCy = isAlias ? 'alias' : 'nic'

    const noClipboardTags = useMemo(
      () =>
        [
          { text: stringToBoolean(RDP) && 'RDP', dataCy: `${dataCy}-rdp` },
          { text: stringToBoolean(SSH) && 'SSH', dataCy: `${dataCy}-ssh` },
          showParents && {
            text: isAlias ? `PARENT: ${PARENT}` : false,
            dataCy: `${dataCy}-parent`,
          },
        ].filter(({ text } = {}) => Boolean(text)),
      [RDP, SSH, showParents, PARENT]
    )

    const tags = useMemo(
      () =>
        [
          { text: IP, dataCy: `${dataCy}-ip` },
          { text: IP6, dataCy: `${dataCy}-ip6` },
          { text: IP6_GLOBAL, dataCy: `${dataCy}-ip6-global` },
          { text: IP6_ULA, dataCy: `${dataCy}-ip6-ula` },
          { text: MAC, dataCy: `${dataCy}-mac` },
          { text: ADDRESS, dataCy: `${dataCy}-address` },
        ].filter(({ text } = {}) => Boolean(text)),
      [IP, IP6, IP6_GLOBAL, IP6_ULA, MAC, ADDRESS]
    )

    return (
      <Paper
        variant="outlined"
        className={classes.root}
        data-cy={`${dataCy}-${NIC_ID}`}
        sx={{ flexWrap: 'wrap', boxShadow: 'none !important' }}
      >
        <Box
          className={classes.main}
          {...(!isAlias && !showParents && { pl: '1em' })}
        >
          <div className={classes.title}>
            <Typography noWrap component="span" data-cy={`${dataCy}-name`}>
              {NETWORK}
            </Typography>
            <span className={classes.labels}>
              {isAlias && <StatusChip stateColor="info" text={'ALIAS'} />}
              {isPciDevice && <StatusChip stateColor="info" text={'PCI'} />}
              {noClipboardTags.map((tag) => (
                <StatusChip
                  key={`${dataCy}-${NIC_ID}-${tag.dataCy}`}
                  text={tag.text}
                  dataCy={tag.dataCy}
                />
              ))}
            </span>
          </div>
          <div className={classes.caption}>
            {`#${NIC_ID}`}
            <span>
              <Network />
              <Stack
                direction="row"
                justifyContent="end"
                alignItems="center"
                gap="0.5em"
              >
                <MultipleTags
                  tags={tags}
                  clipboard={clipboardOnTags}
                  limitTags={isMobile ? 1 : 3}
                />
              </Stack>
            </span>
          </div>
        </Box>
        {!isAdditionalIp && <div className={classes.actions}>{actions}</div>}
        {!!ALIAS?.length && (
          <Stack gap="1em" flexBasis="100%" my="0.5em">
            {ALIAS?.map((alias, aliasIdx) => (
              <NicCard
                key={alias.NIC_ID}
                nic={{ ...alias, NIC_ID: `${NIC_ID}.${aliasIdx + 1}` }}
                actions={aliasActions?.({ alias })}
                showParents={showParents}
              />
            ))}
          </Stack>
        )}
        {useMemo(() => {
          if (!Array.isArray(SECURITY_GROUPS) || !SECURITY_GROUPS?.length) {
            return null
          }

          const rulesById = Object.entries(groupBy(SECURITY_GROUPS, 'ID'))

          return (
            <Accordion variant="outlined" data-cy="security-groups">
              <AccordionSummary>
                <Typography variant="body1">
                  <Translate word={T.SecurityGroups} />
                </Typography>
              </AccordionSummary>
              {rulesById.map(([ID, rules]) => {
                const key = `nic-${NIC_ID}-secgroup-${ID}`
                const acts = securityGroupActions?.({ securityGroupId: ID })

                return (
                  <AccordionDetails key={key}>
                    <SecurityGroupRules
                      parentKey={key}
                      id={ID}
                      rules={rules}
                      actions={acts}
                    />
                  </AccordionDetails>
                )
              })}
            </Accordion>
          )
        }, [SECURITY_GROUPS])}
      </Paper>
    )
  }
)

NicCard.propTypes = {
  nic: PropTypes.object,
  actions: PropTypes.node,
  aliasActions: PropTypes.func,
  securityGroupActions: PropTypes.func,
  showParents: PropTypes.bool,
  clipboardOnTags: PropTypes.bool,
}

NicCard.displayName = 'NicCard'

export default NicCard
