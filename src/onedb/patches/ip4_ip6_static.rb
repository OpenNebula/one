# -------------------------------------------------------------------------- #
# Copyright 2002-2024, OpenNebula Project, OpenNebula Systems                #
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

# This patch changes the type of an AR to IP4_6_STATIC and also lets
# us add or change parameters. The AR must be specified in the extra
# option. For example, to change network 2, ar 1 and add ip6 and
# prefix_length you can use:
#
#     onedb patch -s one.db ip4_6_static.rb \
#       --extra vn=2;ar=1;ip6=2001::1;prefix_length=48
#
# You can also specify several ARs separated by ,:
#
#     vn=3;ar=0;ip6=2001::1;prefix_length=48,vn=3;ar=1;ip6=2001::2;prefix_length=64

if !ONE_LOCATION
    LOG_LOCATION = "/var/log/one"
else
    LOG_LOCATION = ONE_LOCATION + "/var"
end

LOG              = LOG_LOCATION + "/onedb-fsck.log"

require 'nokogiri'

module OneDBPatch
    def is_hot_patch(ops)
        return false
    end

    def check_db_version(ops)
    end

    def parse_options(all_ops)
        ops = all_ops[:extra]
        return [] if !ops

        ops = [ops] unless Array === ops

        ops.map do |str|
            vars = {}
            str.split(';').each do |v|
                k,v = v.split('=')
                vars[k.strip.upcase] = v.strip
            end

            vars
        end
    end

    def patch(ops)
        init_log_time()

        ars = parse_options(ops)

        @db.transaction do
            ars.each do |ar|
                ar_vn = ar.delete('VN')
                ar_ar = ar.delete('AR')

                @db[:network_pool].where(oid: ar_vn).each do |vn|
                    doc = nokogiri_doc(vn[:body], 'network_pool')
                    doc_ar = doc.root.at_xpath("AR_POOL/AR[AR_ID=#{ar_ar}]")

                    ar['TYPE'] = 'IP4_6_STATIC'

                    ar.each do |k,v|
                        # Remove old value
                        doc_ar.search(k).remove

                        # Create new element and add it to the ar
                        elem = doc_ar.document.create_element(k)
                        elem.content = v
                        doc_ar.add_child(elem)
                    end

                    body = doc.root.to_s
                    @db[:network_pool].where(oid: ar_vn).update(body: body)
                end
            end
        end
    end
end
