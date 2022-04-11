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
import { memo, useMemo } from 'react'
import PropTypes from 'prop-types'

import {
  styled,
  useMediaQuery,
  Typography,
  Box,
  Paper,
  Stack,
  Accordion as MuiAccordion,
  AccordionSummary as MuiAccordionSummary,
  AccordionDetails as MuiAccordionDetails,
} from '@mui/material'
import { NavArrowRight } from 'iconoir-react'

import { rowStyles } from 'client/components/Tables/styles'
import { StatusChip } from 'client/components/Status'
import MultipleTags from 'client/components/MultipleTags'

import { Translate } from 'client/components/HOC'
import { stringToBoolean } from 'client/models/Helper'
import { groupBy } from 'client/utils'
import { T, Nic, NicAlias, PrettySecurityGroupRule } from 'client/constants'

const Accordion = styled((props) => (
  <MuiAccordion disableGutters elevation={0} square {...props} />
))(({ theme }) => ({
  flexBasis: '100%',
  border: `1px solid ${theme.palette.divider}`,
  '&:before': { display: 'none' },
}))

const AccordionSummary = styled((props) => (
  <MuiAccordionSummary expandIcon={<NavArrowRight />} {...props} />
))(({ theme }) => ({
  backgroundColor:
    theme.palette.mode === 'dark'
      ? 'rgba(255, 255, 255, .05)'
      : 'rgba(0, 0, 0, .03)',
  '&:not(:last-child)': {
    borderBottom: 0,
  },
  flexDirection: 'row-reverse',
  '& .MuiAccordionSummary-expandIconWrapper.Mui-expanded': {
    transform: 'rotate(90deg)',
  },
  '& .MuiAccordionSummary-content': {
    marginLeft: theme.spacing(1),
  },
}))

const AccordionDetails = styled(MuiAccordionDetails)(({ theme }) => ({
  padding: theme.spacing(2),
  borderTop: '1px solid rgba(0, 0, 0, .125)',
}))

const NicCard = memo(
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
        sx={{ flexWrap: 'wrap', boxShadow: 'none !important' }}
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
              {isAlias && <StatusChip stateColor="info" text={'ALIAS'} />}
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
                actions={aliasActions?.({ alias })}
                showParents={showParents}
              />
            ))}
          </Box>
        )}
        {useMemo(() => {
          if (!Array.isArray(SECURITY_GROUPS) || !SECURITY_GROUPS?.length) {
            return null
          }

          const rulesById = Object.entries(groupBy(SECURITY_GROUPS, 'ID'))

          return (
            <Accordion TransitionProps={{ unmountOnExit: true }}>
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
                    <SecurityGroupRules id={ID} rules={rules} actions={acts} />
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

const SecurityGroupRules = memo(({ id, actions, rules }) => {
  const classes = rowStyles()

  const COLUMNS = useMemo(
    () => [T.Protocol, T.Type, T.Range, T.Network, T.IcmpType],
    []
  )

  const name = rules?.[0]?.NAME ?? 'default'

  return (
    <>
      <Stack direction="row" spacing={1} alignItems="center">
        <Typography noWrap component="span" variant="subtitle1">
          {`#${id} ${name}`}
        </Typography>
        {!!actions && <div className={classes.actions}>{actions}</div>}
      </Stack>
      <Box display="grid" gridTemplateColumns="repeat(5, 1fr)" gap="0.5em">
        {COLUMNS.map((col) => (
          <Typography key={col} noWrap component="span" variant="subtitle2">
            <Translate word={col} />
          </Typography>
        ))}
        {rules.map((rule, ruleIdx) => (
          <SecurityGroupRule key={`${id}-rule-${ruleIdx}`} rule={rule} />
        ))}
      </Box>
    </>
  )
})

SecurityGroupRules.propTypes = {
  id: PropTypes.string,
  rules: PropTypes.array,
  actions: PropTypes.node,
}

SecurityGroupRules.displayName = 'SecurityGroupRule'

const SecurityGroupRule = memo(({ rule, 'data-cy': cy }) => {
  /** @type {PrettySecurityGroupRule} */
  const { PROTOCOL, RULE_TYPE, ICMP_TYPE, RANGE, NETWORK_ID } = rule

  return (
    <>
      {[
        { text: PROTOCOL, dataCy: 'protocol' },
        { text: RULE_TYPE, dataCy: 'ruletype' },
        { text: RANGE, dataCy: 'range' },
        { text: NETWORK_ID, dataCy: 'networkid' },
        { text: ICMP_TYPE, dataCy: 'icmp-type' },
      ].map(({ text, dataCy }) => (
        <Typography
          noWrap
          key={cy}
          data-cy={`${cy}-${dataCy}`}
          variant="subtitle2"
        >
          {text}
        </Typography>
      ))}
    </>
  )
})

SecurityGroupRule.propTypes = {
  rule: PropTypes.object,
  'data-cy': PropTypes.string,
}

SecurityGroupRule.displayName = 'SecurityGroupRule'

export default NicCard
