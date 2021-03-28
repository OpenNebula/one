/* Copyright 2002-2021, OpenNebula Project, OpenNebula Systems                */
/*                                                                            */
/* Licensed under the Apache License, Version 2.0 (the "License"); you may    */
/* not use this file except in compliance with the License. You may obtain    */
/* a copy of the License at                                                   */
/*                                                                            */
/* http://www.apache.org/licenses/LICENSE-2.0                                 */
/*                                                                            */
/* Unless required by applicable law or agreed to in writing, software        */
/* distributed under the License is distributed on an "AS IS" BASIS,          */
/* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.   */
/* See the License for the specific language governing permissions and        */
/* limitations under the License.                                             */
/* -------------------------------------------------------------------------- */

import React, { useState, useEffect, memo } from 'react'

import { Button, makeStyles } from '@material-ui/core'
import { useSocket } from 'client/hooks'

const useStyles = makeStyles(theme => ({
  sticky: {
    position: 'sticky',
    top: 0,
    padding: '1em',
    backgroundColor: theme.palette.background.paper
  },
  loading: {
    '&::after': {
      overflow: 'hidden',
      display: 'inline-block',
      verticalAlign: 'bottom',
      animation: '$ellipsis steps(4,end) 1000ms infinite',
      content: '"\\2026"', /* ascii code for the ellipsis character */
      width: 0
    }
  },
  '@keyframes ellipsis': {
    to: { width: 20 }
  }
}))

const ResponseComponent = memo(response => (
  <p style={{ wordBreak: 'break-all' }}>{JSON.stringify(response)}</p>
))

ResponseComponent.displayName = 'ResponseComponent'

const Webconsole = () => {
  const classes = useStyles()
  const [listening, setListening] = useState(false)
  const [response, setResponse] = useState([])
  const { getHooks } = useSocket()

  const toggleListening = () => setListening(list => !list)

  useEffect(() => {
    listening
      ? getHooks.on(data => setResponse(prev => [...prev, data]))
      : getHooks.off()

    return getHooks.off
  }, [listening])

  return (
    <>
      <div className={classes.sticky}>
        <p className={listening ? classes.loading : ''}>
          {`socket is ${listening ? '' : 'not'} listening`}
        </p>
        <Button
          variant="contained"
          color="primary"
          onClick={toggleListening}>
          {listening ? 'Disconnect' : 'Connect'}
        </Button>
      </div>
      {response?.map((res, index) =>
        <ResponseComponent key={index} {...res} />
      )}
    </>
  )
}
export default Webconsole
