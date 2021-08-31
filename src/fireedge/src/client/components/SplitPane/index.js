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
import { useState, createRef, useRef, useEffect } from 'react'
import PropTypes from 'prop-types'
import { makeStyles, Divider } from '@material-ui/core'

const useStyles = makeStyles(theme => ({
  splitPane: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%'
  },
  topPane: {
    flex: 1
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
  const [topHeight, setTopHeight] = useState(null)

  const splitPaneRef = createRef()
  const topRef = createRef()
  const separatorYPosition = useRef(null)

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

  useEffect(() => {
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

  useEffect(() => {
    if (!topHeight && children[1]) {
      setTopHeight(document.body.clientHeight / 2)
      topRef.current.style.flex = 'none'
    }

    topRef.current.style.height = children[1]
      ? `${topHeight}px`
      : `${splitPaneRef.current?.clientHeight}px`
  }, [topHeight, children[1]])

  return (
    <div {...containerProps} className={classes.splitPane} ref={splitPaneRef}>
      <div className={classes.topPane} ref={topRef}>
        {children[0]}
      </div>
      {!!children[1] && (
        <Divider
          className={classes.separator}
          onTouchStart={onMouseDown}
          onMouseDown={onMouseDown}
        />
      )}
      {children[1]}
    </div>
  )
}

SplitPane.propTypes = {
  children: PropTypes.array.isRequired,
  containerProps: PropTypes.object
}

export default SplitPane
