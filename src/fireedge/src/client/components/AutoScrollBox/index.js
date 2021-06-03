import React, { memo, useEffect, useRef, useState } from 'react'
import PropTypes from 'prop-types'

import { makeStyles, Chip, Slide } from '@material-ui/core'
import { Download as GoToBottomIcon } from 'iconoir-react'

const useStyles = makeStyles(theme => ({
  scrollable: {
    padding: theme.spacing(1),
    overflowY: 'scroll',
    '&::-webkit-scrollbar': {
      width: 14
    },
    '&::-webkit-scrollbar-thumb': {
      backgroundClip: 'content-box',
      border: '4px solid transparent',
      borderRadius: 7,
      boxShadow: 'inset 0 0 0 10px',
      color: theme.palette.secondary.light
    }
  },
  wrapperButton: {
    top: 5,
    position: 'sticky',
    textAlign: 'center'
  },
  button: { padding: theme.spacing(0, 2) }
}))

const AutoScrollBox = memo(({
  children,
  className,
  height,
  autoButtonText,
  preventInteraction,
  scrollBehavior,
  showOption,
  dataCy
}) => {
  const classes = useStyles()
  const [autoScroll, setAutoScroll] = useState(true)
  const containerElement = useRef(null)

  const style = {
    height,
    scrollBehavior: 'auto',
    pointerEvents: preventInteraction ? 'none' : 'auto'
  }

  // Handle mousewheel events on the scroll container.
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
              color='secondary'
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
})

AutoScrollBox.propTypes = {
  // Children to render in the scroll container.
  children: PropTypes.node.isRequired,
  // Extra CSS class names.
  className: PropTypes.object,
  // Height value of the scroll container.
  height: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number
  ]),
  // Text to use for the auto scroll option.
  autoButtonText: PropTypes.string,
  // Prevent all mouse interaction with the scroll conatiner.
  preventInteraction: PropTypes.bool,
  // Ability to disable the smooth scrolling behavior.
  scrollBehavior: PropTypes.oneOf(['smooth', 'auto']),
  // Show the auto scroll option.
  showOption: PropTypes.bool,
  dataCy: PropTypes.string
}

AutoScrollBox.defaultProps = {
  children: undefined,
  className: undefined,
  height: '100%',
  autoButtonText: 'Auto scroll',
  preventInteraction: false,
  scrollBehavior: 'smooth',
  showOption: true,
  dataCy: 'auto-scroll'
}

AutoScrollBox.displayName = 'AutoScrollBox'

export default AutoScrollBox
