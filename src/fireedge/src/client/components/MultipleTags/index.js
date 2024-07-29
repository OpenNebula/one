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
import { Stack, Tooltip, Typography, styled } from '@mui/material'
import PropTypes from 'prop-types'
import { ReactElement, isValidElement, useMemo } from 'react'

import { Translate } from 'client/components/HOC'
import { StatusChip } from 'client/components/Status'
import { T } from 'client/constants'

const StyledText = styled(Typography)(({ theme }) => ({
  '&': {
    fontSize: theme.typography.button.fontSize,
  },
}))

/**
 * @typedef TagType
 * @property {string} text - The text to display in the chip
 * @property {string} [dataCy] - Data-cy to be used by Cypress
 */

/**
 * Render a number of tags with a tooltip to show the full list.
 *
 * @param {object} props - Props
 * @param {string[]|TagType} props.tags - Tags to display
 * @param {number} [props.limitTags] - Limit the number of tags to display
 * @param {boolean} [props.clipboard] - If true, the chip will be clickable
 * @returns {ReactElement} - Tag list
 */
const MultipleTags = ({ tags, limitTags = 1, clipboard = false }) => {
  if (tags?.length === 0) {
    return null
  }

  const [tagsToDisplay, tagsToHide, more] = useMemo(() => {
    const ensureTags = (dirtyTags = [], isHidden) =>
      dirtyTags.map((tag) => {
        if (isValidElement(tag)) return tag

        const text = tag.text ?? tag

        return (
          <StatusChip
            key={text}
            clipboard={clipboard}
            forceWhiteColor={isHidden}
            sx={{
              paddingTop: '2.5px',
              paddingBottom: '2.5px',
              textTransform: 'none',
            }}
            {...(typeof tag === 'string' ? { text } : tag)}
          />
        )
      })

    return [
      ensureTags(tags.slice(0, limitTags)),
      ensureTags(tags.slice(limitTags), true),
      tags.length - limitTags,
    ]
  }, [tags, limitTags])

  return (
    <>
      {tagsToDisplay}
      {more > 0 && (
        <Tooltip arrow title={<Stack>{tagsToHide}</Stack>}>
          <StyledText component="span" variant="string" sx={{ ml: 1 }}>
            {`+${more} `}
            <Translate word={T.More} />
          </StyledText>
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
