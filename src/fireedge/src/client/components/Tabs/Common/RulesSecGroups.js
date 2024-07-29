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
import makeStyles from '@mui/styles/makeStyles'
import { Tr, Translate } from 'client/components/HOC'
import { PrettySecurityGroupRule, RESOURCE_NAMES, T } from 'client/constants'
import PropTypes from 'prop-types'
import { ReactElement, memo, useMemo } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { v4 as uuidv4 } from 'uuid'

import {
  Box,
  Link,
  List,
  ListItem,
  Paper,
  Stack,
  Typography,
  styled,
} from '@mui/material'
import { rowStyles } from 'client/components/Tables/styles'

const Title = styled(ListItem)(({ theme }) => ({
  fontWeight: theme.typography.fontWeightBold,
  borderBottom: `1px solid ${theme.palette.divider}`,
}))

const Item = styled(ListItem)(({ theme }) => ({
  gap: '1em',
  '& > *': {
    flex: '1 1 50%',
    overflow: 'hidden',
    minHeight: '100%',
  },
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
}))

const useStyles = makeStyles({
  container: {
    gridColumn: '1 / -1',
  },
  item: {
    '& > *:first-child': {
      flex: '1 1 20%',
    },
  },
})

const RulesSecGroupsTable = memo(({ title, rules = [] }) => {
  const classes = useStyles()

  return (
    <Paper className={classes.container} variant="outlined">
      <List variant="outlined">
        {title && (
          <Title>
            {typeof title === 'string' ? (
              <Typography noWrap>{Tr(title)}</Typography>
            ) : (
              title
            )}
          </Title>
        )}
        <Item>
          <SecurityGroupRules parentKey={''} rules={rules} />
        </Item>
      </List>
    </Paper>
  )
})

RulesSecGroupsTable.propTypes = {
  title: PropTypes.any,
  rules: PropTypes.arrayOf(
    PropTypes.shape({
      PROTOCOL: PropTypes.string,
      RULE_TYPE: PropTypes.string,
      RANGE: PropTypes.string,
      NETWORK: PropTypes.string,
      ICMP_TYPE: PropTypes.string,
    })
  ),
}

RulesSecGroupsTable.displayName = 'RulesSecGroupsTable'

export const SecurityGroupRules = memo(
  ({ parentKey = '', id, actions, rules }) => {
    const classes = rowStyles()

    const COLUMNS = useMemo(
      () => [T.Protocol, T.Type, T.Range, T.Network, T.IcmpType],
      []
    )

    const name = rules?.[0]?.NAME ?? 'default'

    return (
      <>
        {id !== undefined && (
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography
              noWrap
              component="span"
              variant="subtitle1"
              data-cy={`${parentKey}-rule-name`}
            >
              {`#${id} ${name}`}
            </Typography>

            {!!actions && <div className={classes.actions}>{actions}</div>}
          </Stack>
        )}
        <Box display="grid" gridTemplateColumns="repeat(5, 1fr)" gap="0.5em">
          {COLUMNS.map((col) => (
            <Typography
              key={`${parentKey}-${col}`}
              noWrap
              component="span"
              variant="subtitle2"
            >
              <Translate word={col} />
            </Typography>
          ))}
          {rules.map((rule) => (
            <SecurityGroupRule
              key={uuidv4()}
              data-cy={`${parentKey}-rule-${rule?.RULE_TYPE}`}
              rule={rule}
            />
          ))}
        </Box>
      </>
    )
  }
)

SecurityGroupRules.propTypes = {
  parentKey: PropTypes.string,
  id: PropTypes.string,
  rules: PropTypes.array,
  actions: PropTypes.node,
}

SecurityGroupRules.displayName = 'SecurityGroupRule'

export const SecurityGroupRule = memo(({ rule = {}, 'data-cy': parentCy }) => {
  /** @type {PrettySecurityGroupRule} */
  const {
    PROTOCOL = '',
    RULE_TYPE = '',
    ICMP_TYPE = '',
    RANGE = T.All,
    NETWORK_ID = T.Any,
  } = rule

  /**
   * @param {object} rule - rule.
   * @param {string} rule.text - rule text
   * @param {string} rule.dataCy - rule data-cy
   * @param {boolean} rule.link - rule link
   * @returns {ReactElement} rule line
   */
  const renderLine = ({ text, dataCy, link }) => (
    <Typography
      noWrap
      key={`${parentCy}-${dataCy}`}
      data-cy={`${parentCy}-${dataCy}`.toLowerCase()}
      variant="subtitle2"
    >
      {link && !isNaN(text) ? (
        <Link
          component={RouterLink}
          to={`/${RESOURCE_NAMES.VNET}/${text}`}
          color="secondary"
        >
          {text}
        </Link>
      ) : (
        text
      )}
    </Typography>
  )

  return (
    <>
      {[
        { text: String(PROTOCOL).toUpperCase(), dataCy: 'protocol' },
        { text: String(RULE_TYPE).toUpperCase(), dataCy: 'ruletype' },
        { text: String(RANGE).toUpperCase(), dataCy: 'range' },
        {
          text: String(NETWORK_ID).toUpperCase(),
          dataCy: 'networkid',
          link: true,
        },
        { text: String(ICMP_TYPE).toUpperCase(), dataCy: 'icmp-type' },
      ].map(renderLine)}
    </>
  )
})

SecurityGroupRule.propTypes = {
  rule: PropTypes.object,
  'data-cy': PropTypes.string,
}

SecurityGroupRule.displayName = 'SecurityGroupRule'

export default RulesSecGroupsTable
