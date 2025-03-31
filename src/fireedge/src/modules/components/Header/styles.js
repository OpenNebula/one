/* ------------------------------------------------------------------------- *
 * Copyright 2002-2025, OpenNebula Project, OpenNebula Systems               *
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
import { css } from '@emotion/css'

export const styles = ({ palette }) => ({
  header: css({
    backgroundColor: palette?.topbar?.backgroundColor,
    borderBottomStyle: 'solid',
    borderBottomWidth: '0.0625rem',
    borderBottomColor: palette?.topbar?.borderBottomColor,
  }),
  toolbar: css({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0',
    minHeight: '5rem',
  }),
  toolbarLeft: css({
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
    gap: '0.5rem',
  }),
  toolbarRight: css({
    flexGrow: { xs: 1, sm: 0 },
    alignItems: 'center',
    justifyContent: 'flex-end',
    padding: '0.5rem',
    gap: '0.5rem',
  }),
  title: css({
    display: 'flex',
    alignItems: 'flex-end',
    color: palette?.primary?.main,
    fontSize: '1.75rem',
    fontStyle: 'normal',
    fontWeight: '700',
    lineHeight: '2rem',
    marginLeft: '2.4375rem',
  }),
  text: css({
    display: 'flex',
    alignItems: 'flex-end',
    alignSelf: 'flex-end',
    color: palette?.topbar?.color,
    fontSize: '1.2rem',
    fontStyle: 'normal',
    fontWeight: '500',
    lineHeight: '1.75rem',
  }),
})
