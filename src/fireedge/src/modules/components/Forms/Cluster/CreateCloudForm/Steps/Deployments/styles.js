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
import { css } from '@emotion/css'

/**
 * Create styles for the breadcrumb.
 *
 * @param {object} theme - Theme
 * @param {object} theme.palette - Palette
 * @returns {object} CSS styles with the palette
 */
const styles = ({ palette }) => ({
  container: css({
    marginTop: '15px',
    display: 'flex',
  }),
  cardContainer: css({
    display: 'grid',
    gridTemplateRows: 'repeat(3, 1fr)',
    gridTemplateColumns: '1fr',
    gap: '20px',
    alignItems: 'stretch',
  }),
  card: css({
    alignItems: 'flex-start',
    padding: '12px 16px',
    borderRadius: '8px',
    border: `1px solid ${palette.cluster.createCluster.cardBorder}`,
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    width: '100%',
    height: '100%',
    backgroundColor: palette.background.paper,
  }),
  cardSelected: css({
    border: `2px solid ${palette.cluster.createCluster.cardSelected}`,
  }),
  cardContent: css({
    width: '100%',
  }),
  title: css({
    color: palette.cluster.createCluster.title,
    fontSize: '20px',
    fontStyle: 'normal',
    fontWeight: 700,
    lineHeight: '32px',
  }),
  subtitle: css({
    color: palette.cluster.createCluster.subtitle,
    fontSize: '13px',
    fontStyle: 'normal',
    fontWeight: 400,
    lineHeight: '16px',
  }),
  linkContainer: css({
    alignSelf: 'flex-end',
  }),
  linkText: css({
    marginTop: '5px',
    fontSize: '13px',
    fontStyle: 'normal',
    fontWeight: 400,
    lineHeight: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
  }),
  linkContent: css({
    color: palette.cluster.createCluster.link,
    textDecoration: 'none',
  }),
  linkIcon: css({
    width: '10px',
    height: '10px',
    color: palette.cluster.createCluster.link,
  }),
  groupInfo: css({
    '&': {
      gridColumn: '1 / -1',
      marginTop: '1em',
      backgroundColor: palette.background.paper,
    },
  }),
})

export default styles
