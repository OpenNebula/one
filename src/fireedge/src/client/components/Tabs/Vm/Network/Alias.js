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

import { styled, useMediaQuery } from '@mui/material'
import Typography from '@mui/material/Typography'

import MultipleTags from 'client/components/MultipleTags'

import { Translate } from 'client/components/HOC'
import { T } from 'client/constants'

const DATACY_ALIAS = 'alias-'

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

const Alias = memo(({ alias, isPciDevice, detachAction }) => {
  const isMobile = useMediaQuery((theme) => theme.breakpoints.down('md'))
  const { NIC_ID, NETWORK, IP, MAC, BRIDGE } = alias

  const tags = [
    {
      text: IP,
      dataCy: `${DATACY_ALIAS}ip`,
    },
    {
      text: MAC,
      dataCy: `${DATACY_ALIAS}mac`,
    },
    {
      text: BRIDGE && `BRIDGE - ${BRIDGE}`,
      dataCy: `${DATACY_ALIAS}bridge`,
    },
  ].filter(({ text } = {}) => Boolean(text))

  return (
    <Row key={NIC_ID} data-cy={`${DATACY_ALIAS}${NIC_ID}`}>
      <Typography noWrap variant="body2" data-cy={`${DATACY_ALIAS}name`}>
        <Translate word={T.Alias} />
        {`${NIC_ID} | ${NETWORK}`}
      </Typography>
      <Labels>
        <MultipleTags clipboard limitTags={isMobile ? 1 : 3} tags={tags} />
      </Labels>
      {!isMobile && !isPciDevice && detachAction(NIC_ID, true)}
    </Row>
  )
})

Alias.displayName = 'Alias'

Alias.propTypes = {
  alias: PropTypes.shape({
    NIC_ID: PropTypes.string,
    NETWORK: PropTypes.string,
    IP: PropTypes.string,
    MAC: PropTypes.string,
    BRIDGE: PropTypes.string,
  }),
  isPciDevice: PropTypes.bool,
  detachAction: PropTypes.func,
}

export default Alias
