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
import { memo, useCallback, useState, ReactElement } from 'react'
import PropTypes from 'prop-types'
import { Maximize } from 'iconoir-react'
import { Tooltip, Typography, Button, IconButton } from '@mui/material'

import { Translate } from 'client/components/HOC'
import { T } from 'client/constants'

/**
 * @param {object} session - WMKS session
 * @returns {ReactElement} WMKS keyboard
 */
const WebMKSKeyboard = memo((session) => {
  const { wmks } = session
  const [lang, setLang] = useState('en-US')

  const handleChangeKeyboard = useCallback(
    (evt) => {
      const newLang = evt.target.value
      setLang(newLang)
      wmks?.setOption('keyboardLayoutId', newLang)
    },
    [wmks, setLang]
  )

  return (
    <select value={lang} onChange={handleChangeKeyboard}>
      <option value="en-US">{'English'}</option>
      <option value="ja-JP_106/109">{'Japanese'}</option>
      <option value="de-DE">{'German'}</option>
      <option value="it-IT">{'Italian'}</option>
      <option value="es-ES">{'Spanish'}</option>
      <option value="pt-PT">{'Portuguese'}</option>
      <option value="fr-FR">{'French'}</option>
      <option value="fr-CH">{'Swiss-French'}</option>
      <option value="de-CH">{'Swiss-German'}</option>
    </select>
  )
})

/**
 * @param {object} session - WMKS session
 * @returns {ReactElement} Button to perform Control+Alt+Delete action
 */
const WebMKSCtrlAltDelButton = memo((session) => {
  const { wmks } = session

  return (
    <Button
      data-cy={'vmrc-ctrl-alt-del-button'}
      onClick={() => wmks?.sendCAD()}
      disableElevation
      variant="outlined"
      color="error"
    >
      <Translate word={T.CtrlAltDel} />
    </Button>
  )
})

/**
 * @param {object} session - WMKS session
 * @returns {ReactElement} Button to full screen
 */
const WebMKSFullScreenButton = memo((session) => (
  <Tooltip
    arrow
    placement="bottom"
    title={
      <Typography variant="subtitle2">
        <Translate word={T.FullScreen} />
      </Typography>
    }
  >
    <div>
      <IconButton
        data-cy={'vmrc-fullscreen-button'}
        disabled={!session?.wmks?.canFullScreen?.() ?? true}
        onClick={() => session?.wmks?.enterFullScreen?.()}
      >
        <Maximize />
      </IconButton>
    </div>
  </Tooltip>
))

const ButtonPropTypes = {
  wmks: PropTypes.object,
}

WebMKSKeyboard.displayName = 'WebMKSKeyboard'
WebMKSKeyboard.propTypes = ButtonPropTypes
WebMKSCtrlAltDelButton.displayName = 'WebMKSCtrlAltDelButton'
WebMKSCtrlAltDelButton.propTypes = ButtonPropTypes
WebMKSFullScreenButton.displayName = 'WebMKSFullScreenButton'
WebMKSFullScreenButton.propTypes = ButtonPropTypes

export { WebMKSKeyboard, WebMKSCtrlAltDelButton, WebMKSFullScreenButton }
