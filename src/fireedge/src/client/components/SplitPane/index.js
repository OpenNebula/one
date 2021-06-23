import * as React from 'react'
import PropTypes from 'prop-types'

import { makeStyles, Divider } from '@material-ui/core'

const useStyles = makeStyles(theme => ({
  splitPane: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%'
  },
  separator: {
    position: 'relative',
    cursor: 'row-resize',
    height: 8,
    marginBlock: '1em',
    background: `linear-gradient(
      to right,
      transparent,
      ${theme.palette.divider},
      transparent
    )`,
    '&:after': {
      content: "''",
      position: 'absolute',
      zIndex: 1,
      left: '50%',
      width: 8,
      height: 8,
      transform: 'rotate(45deg)',
      backgroundColor: theme.palette.action.active
    }
  }
}))

const SplitPane = ({ children, containerProps }) => {
  const classes = useStyles()
  const [topHeight, setTopHeight] = React.useState(null)

  const splitPaneRef = React.createRef()
  const topRef = React.createRef()
  const separatorYPosition = React.useRef(null)

  const onMouseDown = event => {
    separatorYPosition.current = event?.touches?.[0]?.clientY ?? event.clientY
  }

  const onMouseMove = event => {
    if (!separatorYPosition.current) return

    const clientY = event?.touches?.[0]?.clientY || event.clientY

    const newTopHeight = topHeight + clientY - separatorYPosition.current
    separatorYPosition.current = clientY

    if (newTopHeight <= 0) {
      return topHeight !== 0 && setTopHeight(0)
    }

    const splitPaneHeight = splitPaneRef.current?.clientHeight

    if (newTopHeight >= splitPaneHeight) {
      return topHeight !== splitPaneHeight && setTopHeight(splitPaneHeight)
    }

    setTopHeight(newTopHeight)
  }

  const onMouseUp = () => {
    separatorYPosition.current = null
  }

  React.useEffect(() => {
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
    // on mobile device
    document.addEventListener('touchmove', onMouseMove)
    document.addEventListener('touchend', onMouseUp)

    return () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
      // on mobile device
      document.removeEventListener('touchmove', onMouseMove)
      document.removeEventListener('touchend', onMouseUp)
    }
  })

  React.useEffect(() => {
    if (!topHeight) {
      setTopHeight(document.body.clientHeight / 2)
      topRef.current.style.flex = 'none'
    }

    topRef.current.style.height = `${topHeight}px`
  }, [topHeight])

  return (
    <div {...containerProps} className={classes.splitPane} ref={splitPaneRef}>
      <div style={{ flex: 1 }} ref={topRef}>
        {children[0]}
      </div>
      <Divider
        className={classes.separator}
        onTouchStart={onMouseDown}
        onMouseDown={onMouseDown}
      />
      {children[1]}
    </div>
  )
}

SplitPane.propTypes = {
  children: PropTypes.array.isRequired,
  containerProps: PropTypes.object
}

export default SplitPane
