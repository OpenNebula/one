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
/* eslint-disable jsdoc/require-jsdoc */
import PropTypes from 'prop-types'

import { Tooltip, Typography } from '@mui/material'

import { StatusChip } from 'client/components/Status'

const MultipleTags = ({ tags, limitTags = 1, clipboard }) => {
  if (tags?.length === 0) {
    return null
  }

  const more = tags.length - limitTags

  const Tags = tags.splice(0, limitTags).map((tag, idx) => {
    const text = tag.text ?? tag

    return (
      <StatusChip
        key={`${idx}-${text}`}
        text={text}
        clipboard={clipboard}
        dataCy={tag.dataCy ?? ''}
      />
    )
  })

  return (
    <>
      {Tags}
      {more > 0 && (
        <Tooltip
          arrow
          title={tags.map((tag, idx) => {
            const text = tag.text ?? tag

            return (
              <Typography
                key={`${idx}-${text}`}
                variant="subtitle2"
                sx={{ height: 'max-content' }}
                {...(tag.dataCy && { dataCy: tag.dataCy })}
              >
                {text}
              </Typography>
            )
          })}
        >
          <Typography component="span" variant="subtitle2" sx={{ ml: 1 }}>
            {`+${more} more`}
          </Typography>
        </Tooltip>
      )}
    </>
  )
}

MultipleTags.propTypes = {
  tags: PropTypes.array,
  clipboard: PropTypes.oneOfType([PropTypes.bool, PropTypes.string]),
  limitTags: PropTypes.number,
}

export default MultipleTags
