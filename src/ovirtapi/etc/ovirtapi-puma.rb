# -------------------------------------------------------------------------- #
# Copyright 2002-2026, OpenNebula Project, OpenNebula Systems                #
#                                                                            #
# Licensed under the Apache License, Version 2.0 (the "License"); you may    #
# not use this file except in compliance with the License. You may obtain    #
# a copy of the License at                                                   #
#                                                                            #
# http://www.apache.org/licenses/LICENSE-2.0                                 #
#                                                                            #
# Unless required by applicable law or agreed to in writing, software        #
# distributed under the License is distributed on an "AS IS" BASIS,          #
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.   #
# See the License for the specific language governing permissions and        #
# limitations under the License.                                             #
#--------------------------------------------------------------------------- #

# Puma configuration for the OpenNebula oVirt API server
# (opennebula-ovirtapi.service). The application itself is configured in
# ovirtapi-server.yml.

directory '/usr/lib/one/ovirtapi-server'
rackup '/usr/lib/one/ovirtapi-server/config.ru'
environment 'production'

# Request handler threads (min, max) and number of worker processes. With
# workers 0 the server runs in a single process, a worker count > 0 forks
# that many processes, each with its own thread pool.
threads 4, 16
workers 0

# The oVirt clients (Veeam) require the API on port 443. Plain HTTP on port
# 80 only serves the CA certificate, everything else is redirected to HTTPS.
bind 'tcp://0.0.0.0:80'
bind 'ssl://0.0.0.0:443?key=/etc/one/ovirtapi-ssl.key&cert=/etc/one/ovirtapi-ssl.crt'

stdout_redirect '/var/log/one/ovirtapi.log', '/var/log/one/ovirtapi.log', true
