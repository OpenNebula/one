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

import { Translate, Tr } from 'client/components/HOC'
import { SecurityGroupRules } from 'client/components/Tabs/Common/RulesSecGroups'
import { Nic, NicAlias, T } from 'client/constants'
import { stringToBoolean } from 'client/models/Helper'
import { groupBy } from 'client/utils'

import { find } from 'lodash'

const NicCard = memo(
  /**
   * @param {object} props - Props
   * @param {Nic|NicAlias} props.nic - NIC
   * @param {ReactElement} [props.actions] - Actions
   * @param {function({ securityGroupId: string }):ReactElement} [props.securityGroupActions] - Security group actions
   * @param {boolean} [props.showParents] -
   * @param {boolean} [props.clipboardOnTags] -
   * @param {Array} props.vnets - List of virtual networks
   * @param {boolean} props.hasAlias - If it's a NIC and has alias
   * @param {number} props.aliasLength - Number of alias that has a NIC
   * @param {number} props.indexNicAlias - Index of the alias in the NIC
   * @returns {ReactElement} - Card
   */
  ({
    nic = {},
    actions,
    securityGroupActions,
    showParents = false,
    clipboardOnTags = true,
    vnets = [],
    hasAlias = false,
    aliasLength = 0,
    indexNicAlias,
  }) => {
    const classes = rowStyles()
    const isMobile = useMediaQuery((theme) => theme.breakpoints.down('md'))

    const {
      NIC_ID,
      NAME,
      NETWORK,
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
      SECURITY_GROUPS,
      TYPE,
    } = nic

    const isAlias = !!PARENT?.length
    const isPciDevice = PCI_ID !== undefined || TYPE === 'NIC'
    const isAdditionalIp = NIC_ID === undefined || NETWORK === 'Additional IP'

    const NETWORK_ID = find(vnets, { NAME: NETWORK })?.ID
    const networkUrl =
      window.location.origin +
      '/fireedge/sunstone/virtual-network/' +
      NETWORK_ID

    const dataCy = isAlias ? 'alias' : 'nic'

    const noClipboardTags = useMemo(
      () =>
        [
          {
            text: stringToBoolean(RDP) && 'RDP',
            dataCy: `${dataCy}-rdp`,
            helpText: Tr(T['nic.card.rdp']),
          },
          {
            text: stringToBoolean(SSH) && 'SSH',
            dataCy: `${dataCy}-ssh`,
            helpText: Tr(T['nic.card.ssh']),
          },
          hasAlias && {
            text: `ALIAS: ${aliasLength}`,
            dataCy: `${dataCy}-hasAlias`,
            helpText: `${Tr(T.HasAlias, [NAME, aliasLength])}`,
            stateColor: 'info',
          },
          isPciDevice && {
            text: `PCI`,
            dataCy: `${dataCy}-pci`,
            helpText: `PCI Device`,
            stateColor: 'info',
          },
        ].filter(({ text } = {}) => Boolean(text)),
      [RDP, SSH, hasAlias]
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
              {NETWORK ? `${NAME}: ${NETWORK}` : `${NAME}`}
            </Typography>
            <span className={classes.labels}>
              {noClipboardTags.map((tag) => (
                <span
                  key={`${dataCy}-${NIC_ID}-${tag.dataCy}`}
                  title={`${tag.helpText}`}
                >
                  <StatusChip
                    text={tag.text}
                    dataCy={tag.dataCy}
                    stateColor={tag.stateColor}
                  />
                </span>
              ))}
            </span>
          </div>
          <div className={classes.caption}>
            {isAlias ? `#${indexNicAlias}` : `#${NIC_ID}`}
            <span>
              <Network />
              {NETWORK ? (
                <a
                  href={networkUrl}
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  {NETWORK || 'auto'}
                </a>
              ) : (
                'auto'
              )}
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
        {(!isAdditionalIp || isAlias) && (
          <div className={classes.actions}>{actions}</div>
        )}
        {useMemo(() => {
          if (
            !Array.isArray(SECURITY_GROUPS) ||
            !SECURITY_GROUPS?.length ||
            isAlias
          ) {
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
  vnets: PropTypes.array,
  hasAlias: PropTypes.bool,
  aliasLength: PropTypes.number,
  indexNicAlias: PropTypes.number,
}

NicCard.displayName = 'NicCard'

export default NicCard
