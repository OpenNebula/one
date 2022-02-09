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
import { memo } from 'react'
import PropTypes from 'prop-types'

import { styled, useMediaQuery } from '@mui/material'
import Typography from '@mui/material/Typography'

import MultipleTags from 'client/components/MultipleTags'

const DATACY_SECGROUP = 'securitygroup-'

const Row = styled('div')({
  display: 'flex',
  width: '100%',
  gap: '0.5em',
  alignItems: 'center',
  flexWrap: 'nowrap',
})

const Labels = styled('span')({
  display: 'inline-flex',
  gap: '0.5em',
  alignItems: 'center',
})

const SecGroup = memo(({ index, securityGroup }) => {
  const isMobile = useMediaQuery((theme) => theme.breakpoints.down('md'))

  const { ID, NAME, PROTOCOL, RULE_TYPE, ICMP_TYPE, RANGE, NETWORK_ID } =
    securityGroup

  const tags = [
    {
      text: PROTOCOL,
      dataCy: `${DATACY_SECGROUP}protocol`,
    },
    {
      text: RULE_TYPE,
      dataCy: `${DATACY_SECGROUP}ruletype`,
    },
    {
      text: RANGE,
      dataCy: `${DATACY_SECGROUP}range`,
    },
    {
      text: NETWORK_ID,
      dataCy: `${DATACY_SECGROUP}networkid`,
    },
    {
      text: ICMP_TYPE,
      dataCy: `${DATACY_SECGROUP}icmp_type`,
    },
  ].filter(({ text } = {}) => Boolean(text))

  return (
    <Row data-cy={`${DATACY_SECGROUP}${index}`}>
      <Typography noWrap variant="body2" data-cy={`${DATACY_SECGROUP}name`}>
        {`${ID} | ${NAME}`}
      </Typography>
      <Labels>
        <MultipleTags limitTags={isMobile ? 2 : 5} tags={tags} />
      </Labels>
    </Row>
  )
})

SecGroup.displayName = 'SecGroup'

SecGroup.propTypes = {
  index: PropTypes.number,
  securityGroup: PropTypes.shape({
    ID: PropTypes.string,
    SECURITY_GROUP_ID: PropTypes.string,
    NAME: PropTypes.string,
    PROTOCOL: PropTypes.string,
    RULE_TYPE: PropTypes.string,
    ICMP_TYPE: PropTypes.string,
    RANGE: PropTypes.string,
    NETWORK_ID: PropTypes.string,
  }),
}

export default SecGroup
