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
/* eslint-disable jsdoc/require-jsdoc */
import * as React from 'react'
import PropTypes from 'prop-types'

import { Tooltip, Typography } from '@material-ui/core'

import { StatusChip } from 'client/components/Status'

const Multiple = ({ tags, limitTags = 1 }) => {
  if (tags?.length === 0) {
    return null
  }

  const more = tags.length - limitTags

  const Tags = tags.splice(0, limitTags).map(tag => (
    <StatusChip key={tag} text={tag} />
  ))

  return (
    <>
      {Tags}
      {more > 0 && (
        <Tooltip arrow
          title={tags.map(tag => (
            <Typography key={tag} variant='subtitle2'>{tag}</Typography>
          ))}
        >
          <span style={{ marginLeft: 6 }}>
            {`+${more} more`}
          </span>
        </Tooltip>
      )}
    </>
  )
}

Multiple.propTypes = {
  tags: PropTypes.array,
  limitTags: PropTypes.number
}

export default Multiple
