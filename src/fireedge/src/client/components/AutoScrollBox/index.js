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
import { memo, useEffect, useRef, useState } from 'react'
import PropTypes from 'prop-types'

import { Chip, Slide } from '@mui/material'
import makeStyles from '@mui/styles/makeStyles'
import { Download as GoToBottomIcon } from 'iconoir-react'

const useStyles = makeStyles((theme) => ({
  scrollable: {
    padding: theme.spacing(1),
    overflowY: 'scroll',
  },
  wrapperButton: {
    top: 5,
    position: 'sticky',
    textAlign: 'center',
  },
  button: { padding: theme.spacing(0, 2) },
}))

const AutoScrollBox = memo(
  ({
    children,
    className,
    height,
    autoButtonText,
    preventInteraction,
    scrollBehavior,
    showOption,
    dataCy,
  }) => {
    const classes = useStyles()
    const [autoScroll, setAutoScroll] = useState(true)
    const containerElement = useRef(null)

    const style = {
      height,
      scrollBehavior: 'auto',
      pointerEvents: preventInteraction ? 'none' : 'auto',
    }

    /**
     * Handle mousewheel events on the scroll container.
     */
    const onWheel = () => {
      const { current } = containerElement

      if (current && showOption) {
        setAutoScroll(
          current.scrollTop + current.offsetHeight === current.scrollHeight
        )
      }
    }

    // Apply the scroll behavior property after the first render,
    // so that the initial render is scrolled all the way to the bottom.
    useEffect(() => {
      setTimeout(() => {
        const { current } = containerElement

        if (current) {
          current.style.scrollBehavior = scrollBehavior
        }
      }, 0)
    }, [containerElement, scrollBehavior])

    // When the children are updated, scroll the container to the bottom.
    useEffect(() => {
      if (!autoScroll) {
        return
      }

      const { current } = containerElement

      if (current) {
        current.scrollTop = current.scrollHeight
      }
    }, [children, containerElement, autoScroll])

    return (
      <div style={{ height }} className={className}>
        <div
          className={classes.scrollable}
          onWheel={onWheel}
          ref={containerElement}
          style={style}
          data-cy={dataCy}
        >
          <Slide in={!autoScroll} direction="down" mountOnEnter unmountOnExit>
            <div className={classes.wrapperButton}>
              <Chip
                avatar={<GoToBottomIcon />}
                color="secondary"
                className={classes.button}
                label={autoButtonText}
                onClick={() => setAutoScroll(true)}
              />
            </div>
          </Slide>
          {children}
        </div>
      </div>
    )
  }
)

AutoScrollBox.propTypes = {
  // Children to render in the scroll container.
  children: PropTypes.node.isRequired,
  // Extra CSS class names.
  className: PropTypes.object,
  // Height value of the scroll container.
  height: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  // Text to use for the auto scroll option.
  autoButtonText: PropTypes.string,
  // Prevent all mouse interaction with the scroll container.
  preventInteraction: PropTypes.bool,
  // Ability to disable the smooth scrolling behavior.
  scrollBehavior: PropTypes.oneOf(['smooth', 'auto']),
  // Show the auto scroll option.
  showOption: PropTypes.bool,
  dataCy: PropTypes.string,
}

AutoScrollBox.defaultProps = {
  children: undefined,
  className: undefined,
  height: '100%',
  autoButtonText: 'Auto scroll',
  preventInteraction: false,
  scrollBehavior: 'smooth',
  showOption: true,
  dataCy: 'auto-scroll',
}

AutoScrollBox.displayName = 'AutoScrollBox'

export default AutoScrollBox
