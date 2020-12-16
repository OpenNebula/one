import React, { memo, Children, useEffect, useRef, useState } from 'react'
import PropTypes from 'prop-types'

import clsx from 'clsx'
import { makeStyles, Chip, Slide } from '@material-ui/core'
import ArrowBottomIcon from '@material-ui/icons/VerticalAlignBottom'

const useStyles = makeStyles(theme => ({
  wrapperButton: {
    top: 5,
    position: 'sticky',
    textAlign: 'center'
  },
  button: { padding: theme.spacing(0, 2) },
  svg: {
    color: '#fff !important',
    backgroundColor: 'transparent !important'
  }
}))

const baseClass = 'react-auto-scroll'

const AutoScrollBox = memo(({
  children,
  className,
  height,
  autoButtonText,
  preventInteraction,
  scrollBehavior,
  showOption
}) => {
  const classes = useStyles()
  const [autoScroll, setAutoScroll] = useState(true)
  const containerElement = useRef(null)

  const style = {
    padding: 8,
    height,
    overflowY: 'scroll',
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
    <div style={{ height }}
      className={clsx(baseClass, className, {
        [`${baseClass}--empty`]: Children.count(children) === 0,
        [`${baseClass}--prevent-interaction`]: preventInteraction,
        [`${baseClass}--showOption`]: showOption
      })}
    >
      <div
        className={`${baseClass}__scroll-container`}
        onWheel={onWheel}
        ref={containerElement}
        style={style}
      >
        <Slide in={!autoScroll} direction="down" mountOnEnter unmountOnExit>
          <div className={classes.wrapperButton}>
            <Chip
              avatar={<ArrowBottomIcon />}
              color="primary"
              classes={{ avatarColorPrimary: classes.svg }}
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
  showOption: PropTypes.bool
}

AutoScrollBox.defaultProps = {
  children: undefined,
  className: undefined,
  height: '100%',
  autoButtonText: 'Auto scroll',
  preventInteraction: false,
  scrollBehavior: 'smooth',
  showOption: true
}

AutoScrollBox.displayName = 'AutoScrollBox'

export default AutoScrollBox
