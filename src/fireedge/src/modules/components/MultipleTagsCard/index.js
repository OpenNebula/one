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
import { T } from '@ConstantsModule'
import { Translate } from '@modules/components/HOC'
import { StatusChip } from '@modules/components/Status'
import { Box, Stack, Tooltip, Typography, styled } from '@mui/material'
import PropTypes from 'prop-types'
import {
  ReactElement,
  isValidElement,
  memo,
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import ResizeObserver from 'resize-observer-polyfill'

/**
 * Truncate string.
 *
 * @param {string} label - string.
 * @param {number} [maxLength] - max lenght.
 * @returns {string} - string truncated
 */
const truncateLabel = (label, maxLength) => {
  if (label.length > maxLength) {
    return `${label.substring(0, maxLength)}...`
  }

  return label
}

const StyledText = styled(Typography)(({ theme }) => ({
  '&': {
    fontSize: theme.typography.button.fontSize,
  },
}))

const getTotalWidth = (element) => {
  if (!element) return 0

  const offsetWidth = element.offsetWidth
  const computedStyle = window.getComputedStyle(element)
  const marginLeft = parseFloat(computedStyle.marginLeft)
  const marginRight = parseFloat(computedStyle.marginRight)
  const totalWidth = offsetWidth + marginLeft + marginRight

  return totalWidth
}

const ensureTags = (dirtyTags = [], tagsProps, isHidden) => {
  const { clipboard = false, truncateText = false } = tagsProps

  return dirtyTags.map((tag, index) => {
    if (isValidElement(tag)) return tag

    const text = tag.text ?? tag
    truncateText && (tag.text = truncateLabel(text, truncateText))

    return (
      <StatusChip
        key={`${index}-${text}`}
        clipboard={clipboard}
        forceWhiteColor={isHidden}
        sx={{
          paddingTop: '2.5px',
          paddingBottom: '2.5px',
          textTransform: 'none',
          marginLeft: '2.5px',
        }}
        {...(typeof tag === 'string' ? { text } : tag)}
      />
    )
  })
}

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
 * @param {false|number} [props.truncateText] - number by truncate the string
 * @returns {ReactElement} - Tag list
 */
const MultipleTags = memo(
  ({ tags, limitTags, clipboard = false, truncateText = false }) => {
    if (tags?.length === 0) {
      return null
    }

    const tagsProps = {
      clipboard,
      truncateText,
    }

    const [visibleItems, setVisibleItems] = useState(tags)
    const [hiddenItems, setHiddenItems] = useState([])

    const containerRef = useRef(null)
    const moreRef = useRef(null)
    const isResizingRef = useRef(false)

    const calculateVisibleItems = useCallback(() => {
      if (!containerRef?.current || isResizingRef.current) return

      try {
        isResizingRef.current = true
        const moreWidth = moreRef?.current?.offsetWidth || 0
        const containerWidth = containerRef.current.offsetWidth
        let currentWidth = 0
        let visibleCount = 0

        const moreLabelWidth = moreWidth
        const availableWidth = containerWidth - moreLabelWidth

        if (limitTags) {
          setVisibleItems(tags.slice(0, limitTags))
          setHiddenItems(tags.slice(limitTags))

          return
        }

        tags.forEach((_, index) => {
          const tag = containerRef.current.children[index]
          if (tag) {
            const tagWidth = getTotalWidth(tag)
            if (currentWidth + tagWidth < availableWidth) {
              currentWidth += tagWidth
              visibleCount++
            }
          }
        })
        setVisibleItems(tags.slice(0, visibleCount))
        setHiddenItems(tags.slice(visibleCount))
      } finally {
        isResizingRef.current = false
      }
    }, [tags])

    useLayoutEffect(() => {
      calculateVisibleItems()
      if (containerRef?.current) {
        const resizeObserver = new ResizeObserver(calculateVisibleItems)
        resizeObserver.observe(containerRef.current)

        return () => {
          resizeObserver.disconnect()
        }
      }
    }, [tags])

    return (
      <Box display="flex" sx={{ width: '100%', textAlign: 'end' }}>
        <Box ref={containerRef} sx={{ flexGrow: 1, width: '100%' }}>
          {ensureTags(visibleItems, tagsProps)}
        </Box>
        <Box sx={{ flexShrink: 0 }}>
          {hiddenItems?.length > 0 && (
            <Tooltip
              ref={moreRef}
              arrow
              title={<Stack>{ensureTags(hiddenItems, tagsProps, true)}</Stack>}
            >
              <StyledText component="span" variant="string" sx={{ ml: 1 }}>
                {`+${hiddenItems.length} `}
                <Translate word={visibleItems.length ? T.More : T.Labels} />
              </StyledText>
            </Tooltip>
          )}
        </Box>
      </Box>
    )
  }
)

MultipleTags.propTypes = {
  tags: PropTypes.any,
  limitTags: PropTypes.number,
  clipboard: PropTypes.bool,
  truncateText: PropTypes.number,
}

MultipleTags.displayName = 'MultipleTags'

export default MultipleTags
