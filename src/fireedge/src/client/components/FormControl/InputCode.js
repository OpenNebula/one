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
/* eslint-disable jsdoc/require-jsdoc */
import { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import loadable from '@loadable/component'

const Ace = loadable.lib(() => import('react-opennebula-ace'), { ssr: false })

const WrapperToLoadMode = ({ children, mode }) => {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      await import(`react-opennebula-ace/src-noconflict/mode-${mode}`)
      await import('react-opennebula-ace/src-noconflict/theme-github')

      setLoading(false)
    }

    load()

    return () => {
      // remove all styles when component will be unmounted
      document.querySelectorAll('[id^=ace-]').forEach((child) => {
        child.parentNode.removeChild(child)
      })
    }
  }, [])

  return loading ? null : children
}

const InputCode = ({ code, mode, ...props }) => (
  <Ace>
    {({ default: Editor }) => (
      <WrapperToLoadMode mode={mode}>
        <Editor
          style={{ border: '1px solid lightgray' }}
          wrapEnabled
          value={code}
          fontSize={16}
          mode={mode}
          theme="github"
          width="100%"
          height="100%"
          // maxLines={Infinity}
          minLines={10}
          name="form-control-code"
          showPrintMargin={false}
          editorProps={{ $blockScrolling: true }}
          setOptions={{
            useWorker: false,
            tabSize: 2,
          }}
          {...props}
        />
      </WrapperToLoadMode>
    )}
  </Ace>
)

InputCode.propTypes = {
  code: PropTypes.string,
  mode: PropTypes.oneOf([
    'json',
    'apache_conf',
    'css',
    'dockerfile',
    'markdown',
    'xml',
  ]),
}

InputCode.defaultProps = {
  code: '',
  mode: 'json',
}

export default InputCode
