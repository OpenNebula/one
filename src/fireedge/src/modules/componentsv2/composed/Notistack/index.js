/* ------------------------------------------------------------------------- *
 * Copyright 2002-2026, OpenNebula Project, OpenNebula Systems               *
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
import PropTypes from 'prop-types'
import { SnackbarProvider as NotistackProvider } from 'notistack'
import { AlertNotification, Snackbar } from '@modules/componentsv2/primitives'
import { forwardRef } from 'react'
import { useTranslation } from '@ProvidersModule'

const NotistackComponent = forwardRef((props, ref) => {
  const { translate } = useTranslation()
  const { word, values } = props?.message?.props ?? {}
  const isUrgent = props?.urgent
  const fTitle = translate(word, values)

  return isUrgent ? (
    <AlertNotification
      {...props}
      ref={ref}
      status={props?.variant}
      title={fTitle}
    />
  ) : (
    <Snackbar
      {...props}
      isProgressShow
      progressDuration={5000}
      progressTickMs={50}
      onProgressEnd={props?.onDismiss}
      ref={ref}
      status={props?.variant}
      title={fTitle}
    />
  )
})

NotistackComponent.displayName = 'NotistackComponent'

NotistackComponent.propTypes = {
  urgent: PropTypes.bool,
  variant: PropTypes.string,
  onDismiss: PropTypes.func,
  message: PropTypes.shape({
    props: PropTypes.shape({
      word: PropTypes.string,
      values: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.arrayOf(PropTypes.string),
      ]),
    }),
  }),
}

NotistackComponent.defaultProps = {
  urgent: false,
  variant: undefined,
  onDismiss: undefined,
  message: undefined,
}

const proxyHandler = { get: () => NotistackComponent }

export const SnackbarProvider = ({ children }) => (
  <NotistackProvider
    persist
    hideIconVariant
    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
    Components={new Proxy({}, proxyHandler)}
  >
    {children}
  </NotistackProvider>
)

SnackbarProvider.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.node,
    PropTypes.arrayOf(PropTypes.node),
  ]),
}

SnackbarProvider.defaultProps = {
  children: undefined,
}
