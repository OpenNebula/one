/* ------------------------------------------------------------------------- *
 * Copyright 2002-2026, OpenNebula Project, OpenNebula Systems               *
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
import { ReactElement, useMemo } from 'react'
import { Box, List, ListItem } from '@mui/material'
import PropTypes from 'prop-types'
import { prettyBytes } from '@UtilsModule'
import { useTranslation } from '@ProvidersModule'
import { getStyles } from '@modules/resources/resources/Host/Tabs/Numa/Hugepage/styles'

import { T, TEXT_VARIANTS, TEXT_WEIGHTS } from '@ConstantsModule'
import { Text } from '@ComponentsV2Module'

/**
 * @param {object} props - Props
 * @param {string[]} props.hugepage - Numa hugepage tab info
 * @returns {ReactElement} Information view
 */
const NumaHugepage = ({ hugepage = [] }) => {
  const { translate } = useTranslation()
  const rows = useMemo(() => [hugepage].flat().filter(Boolean), [hugepage])
  const formatValue = (value) => `${value ?? '-'}`
  const formatSize = (value) =>
    value || value === 0 ? prettyBytes(value) : '-'

  return (
    <Box sx={(theme) => getStyles({ theme })}>
      <Text
        className="numa-hugepage__title"
        component="h6"
        variant={TEXT_VARIANTS.H6}
        weight={TEXT_WEIGHTS.SEMIBOLD}
        value={translate(T.HugepageNode)}
      />
      <List className="numa-hugepage__list">
        <ListItem className="numa-hugepage__row numa-hugepage__row--title">
          <Text
            component="span"
            variant={TEXT_VARIANTS.CAPTION}
            weight={TEXT_WEIGHTS.SEMIBOLD}
            value={translate(T.HugepageNodeSize)}
            noWrap
          />
          <Text
            component="span"
            variant={TEXT_VARIANTS.CAPTION}
            weight={TEXT_WEIGHTS.SEMIBOLD}
            value={translate(T.HugepageNodeFree)}
            noWrap
          />
          <Text
            component="span"
            variant={TEXT_VARIANTS.CAPTION}
            weight={TEXT_WEIGHTS.SEMIBOLD}
            value={translate(T.HugepageNodePages)}
            noWrap
          />
          <Text
            component="span"
            variant={TEXT_VARIANTS.CAPTION}
            weight={TEXT_WEIGHTS.SEMIBOLD}
            value={translate(T.HugepageNodeUsage)}
            noWrap
          />
        </ListItem>
        {rows.map(({ FREE, PAGES, SIZE, USAGE }, index) => (
          <ListItem
            key={index}
            className="numa-hugepage__row"
            dense
            data-cy={`hugepage-${index}`}
          >
            <Text
              component="span"
              variant={TEXT_VARIANTS.CAPTION}
              value={formatSize(SIZE)}
              data-cy="size"
              noWrap
            />
            <Text
              component="span"
              variant={TEXT_VARIANTS.CAPTION}
              value={formatValue(FREE)}
              data-cy="free"
              noWrap
            />
            <Text
              component="span"
              variant={TEXT_VARIANTS.CAPTION}
              value={formatValue(PAGES)}
              data-cy="pages"
              noWrap
            />
            <Text
              component="span"
              variant={TEXT_VARIANTS.CAPTION}
              value={formatValue(USAGE)}
              data-cy="usage"
              noWrap
            />
          </ListItem>
        ))}
      </List>
    </Box>
  )
}

NumaHugepage.propTypes = {
  hugepage: PropTypes.array,
}

NumaHugepage.displayName = 'NumaHugepage'

export default NumaHugepage
