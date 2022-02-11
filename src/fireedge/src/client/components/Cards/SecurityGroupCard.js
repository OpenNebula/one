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

import { useMediaQuery, Typography } from '@mui/material'

import MultipleTags from 'client/components/MultipleTags'
import { rowStyles } from 'client/components/Tables/styles'
import { SecurityGroup } from 'client/constants'

const SecurityGroupCard = memo(({ securityGroup, ...props }) => {
  const classes = rowStyles()
  const isMobile = useMediaQuery((theme) => theme.breakpoints.down('md'))

  /** @type {SecurityGroup} */
  const { ID, NAME, PROTOCOL, RULE_TYPE, ICMP_TYPE, RANGE, NETWORK_ID } =
    securityGroup

  const tags = [
    { text: PROTOCOL, dataCy: 'protocol' },
    { text: RULE_TYPE, dataCy: 'ruletype' },
    { text: RANGE, dataCy: 'range' },
    { text: NETWORK_ID, dataCy: 'networkid' },
    { text: ICMP_TYPE, dataCy: 'icmp-type' },
  ].filter(({ text } = {}) => Boolean(text))

  return (
    <div data-cy={props['data-cy']} className={classes.title}>
      <Typography noWrap component="span" data-cy="name" variant="body2">
        {`${ID} | ${NAME}`}
      </Typography>
      <span className={classes.labels}>
        <MultipleTags limitTags={isMobile ? 2 : 5} tags={tags} />
      </span>
    </div>
  )
})

SecurityGroupCard.propTypes = {
  securityGroup: PropTypes.object,
  'data-cy': PropTypes.string,
}

SecurityGroupCard.displayName = 'SecurityGroupCard'

export default SecurityGroupCard
