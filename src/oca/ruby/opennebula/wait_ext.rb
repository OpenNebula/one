# -------------------------------------------------------------------------- #
# Copyright 2002-2021, OpenNebula Project, OpenNebula Systems                #
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

require 'ffi-rzmq'

require 'opennebula/host'
require 'opennebula/image'
require 'opennebula/virtual_machine'

# Module to decorate Wait classes with the following methods:
#   - Wait
#
# rubocop:disable Style/ClassAndModuleChildren
module OpenNebula::WaitExt

    # Wait classes and the name published in ZMQ
    WAIT = {
        OpenNebula::Host  => {
            :event => lambda {|o, s1, _s2|
                "EVENT STATE HOST/#{s1}//#{o['ID']}"
            },

            :in_state => lambda {|o, s1, _s2|
                obj_s = Integer(o['STATE'])
                inx_s = OpenNebula::Host::HOST_STATES.index(s1)

                obj_s == inx_s
            },

            :in_state_e => lambda {|s1, _s2, content|
                xml   = Nokogiri::XML(Base64.decode64(content))

                obj_s = Integer(xml.xpath('//HOST/STATE').text)
                inx_s = OpenNebula::Host::HOST_STATES.index(s1)

                obj_s == inx_s
            }
        },

        OpenNebula::Image  => {
            :event => lambda {|o, s1, _s2|
                "EVENT STATE IMAGE/#{s1}//#{o['ID']}"
            },

            :in_state => lambda {|o, s1, _s2|
                obj_s = Integer(o['STATE'])
                inx_s = OpenNebula::Image::IMAGE_STATES.index(s1)

                obj_s == inx_s
            },

            :in_state_e => lambda {|s1, _s2, content|
                xml   = Nokogiri::XML(Base64.decode64(content))

                obj_s = Integer(xml.xpath('//IMAGE/STATE').text)
                inx_s = OpenNebula::Image::IMAGE_STATES.index(s1)

                obj_s == inx_s
            }
        },

        OpenNebula::VirtualMachine => {
            :event => lambda {|o, s1, s2|
                "EVENT STATE VM/#{s1}/#{s2}/#{o['ID']}"
            },

            :in_state => lambda {|o, s1, s2|
                obj_s1 = Integer(o['STATE'])
                inx_s1 = OpenNebula::VirtualMachine::VM_STATE.index(s1)

                obj_s2 = Integer(o['LCM_STATE'])
                inx_s2 = OpenNebula::VirtualMachine::LCM_STATE.index(s2)

                obj_s1 == inx_s1 && obj_s2 == inx_s2
            },

            :in_state_e => lambda {|s1, s2, content|
                xml = Nokogiri::XML(Base64.decode64(content))

                obj_s1 = Integer(xml.xpath('//VM/STATE').text)
                inx_s1 = OpenNebula::VirtualMachine::VM_STATE.index(s1)

                obj_s2 = Integer(xml.xpath('//VM/LCM_STATE').text)
                inx_s2 = OpenNebula::VirtualMachine::LCM_STATE.index(s2)

                obj_s1 == inx_s1 && obj_s2 == inx_s2
            }
        }
    }

    def self.extend_object(obj)
        wait?(obj)

        class << obj

            # Wait until the element reaches some specific state
            # It waits until the state can be found in ZMQ event message
            #
            # @param state_str [String]  State name to wait
            # @param timeout   [Integer] Number of seconds to timeout event recv
            # @param cycles    [Integer] Number of recv cycles. After each one
            #                            object status is checked in OpenNebula.
            #                            Use -1 (default) to wait forever.
            def wait(state_str, timeout = 60, cycles = -1)
                wait2(state_str, '', timeout, cycles)
            end

            def wait2(sstr1, sstr2, timeout = 60, cycles = -1)
                wfun = WAIT[self.class]

                # Create subscriber
                subscriber = ZMQ::Context.new(1).socket(ZMQ::SUB)
                key        = ''
                content    = ''

                # Subscribe with timeout seconds
                #
                # Subscribe string:
                #
                #   EVENT STATE element_name/state_str//self.ID
                #
                #   - element_name: is the element name to find in the message
                #   - self.ID: returns element ID to find in the message
                begin
                    subscriber.setsockopt(ZMQ::RCVTIMEO, timeout * 1000)
                    subscriber.setsockopt(
                        ZMQ::SUBSCRIBE,
                        wfun[:event].call(self, sstr1, sstr2)
                    )

                    subscriber.connect('tcp://localhost:2101')

                    rco = info

                    return false if OpenNebula.is_error?(rco)

                    in_state = wfun[:in_state].call(self, sstr1, sstr2)
                    recvs    = 0

                    until in_state || (cycles != -1 && recvs >= cycles)
                        rc = subscriber.recv_string(key)
                        rc = subscriber.recv_string(content) if rc != -1

                        if rc == -1
                            return false if ZMQ::Util.errno != ZMQ::EAGAIN

                            rco = info

                            return false if OpenNebula.is_error?(rco)

                            in_state = wfun[:in_state].call(self, sstr1, sstr2)
                        else
                            in_state = wfun[:in_state_e].call(sstr1, sstr2,
                                                              content)
                        end

                        recvs += 1
                    end

                    in_state
                ensure
                    subscriber.setsockopt(
                        ZMQ::UNSUBSCRIBE,
                        wfun[:event].call(self, sstr1, sstr2)
                    )

                    subscriber.close
                end
            end

        end

        super
    end

    # Check if object has the method wait or not
    #
    # @param obj [Object or Class] Object to check class
    def self.wait?(obj)
        # Get obj class to find parents in wait class
        # rubocop:disable Style/TernaryParentheses
        (obj.is_a? Class) ? o_class = obj : o_class = obj.class
        # rubocop:enable Style/TernaryParentheses

        found   = false
        i_class = o_class

        while i_class
            if WAIT.keys.include?(i_class)
                found = true
                break
            end

            i_class = i_class.superclass
        end

        return if found

        raise StandardError, "Cannot extend #{o_class} with WaitExt"
    end

end
# rubocop:enable Style/ClassAndModuleChildren
