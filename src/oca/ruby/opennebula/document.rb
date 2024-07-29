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

require 'opennebula/lockable_ext'
require 'opennebula/pool_element'

module OpenNebula

    # All subclasses must define the DOCUMENT_TYPE constant.
    #
    # @example
    #   require 'opennebula/document'
    #
    #   module OpenNebula
    #       class CustomObject < Document
    #
    #           DOCUMENT_TYPE = 400
    #
    #       end
    #   end
    class Document < PoolElement

        #######################################################################
        # Constants and Class Methods
        #######################################################################

        DOCUMENT_METHODS = {
            :allocate   => 'document.allocate',
            :delete     => 'document.delete',
            :info       => 'document.info',
            :update     => 'document.update',
            :chown      => 'document.chown',
            :chmod      => 'document.chmod',
            :clone      => 'document.clone',
            :rename     => 'document.rename',
            :lock       => 'document.lock',
            :unlock     => 'document.unlock'
        }

        # Creates a Document Object description with just its identifier
        # this method should be used to create plain Document objects.
        # @param [Integer] pe_id the id of the object
        #
        # @return [Nokogiri::XML::Node, REXML::Element] the empty xml
        def self.build_xml(pe_id = nil)
            if pe_id
                obj_xml = "<DOCUMENT><ID>#{pe_id}</ID></DOCUMENT>"
            else
                obj_xml = '<DOCUMENT></DOCUMENT>'
            end

            XMLElement.build_xml(obj_xml, 'DOCUMENT')
        end

        # Class constructor
        #
        # @param [Nokogiri::XML::Node, REXML::Element] xml string
        #   created by the build_xml() method
        # @param [OpenNebula::Client] client the xml-rpc client
        #
        # @return [Document] the new object
        #
        # @example
        #   doc = Document.new(Document.build_xml(3),rpc_client)
        def initialize(xml, client)
            LockableExt.make_lockable(self, DOCUMENT_METHODS)

            super(xml, client)
        end

        #######################################################################
        # XML-RPC Methods for the Document Object
        #######################################################################

        # Retrieves the information of the given Document.
        #
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def info(decrypt = false)
            rc = super(DOCUMENT_METHODS[:info], 'DOCUMENT', decrypt)

            if !OpenNebula.is_error?(rc) && self['TYPE'].to_i != document_type
                return OpenNebula::Error.new("[DocumentInfo] Error getting document [#{@pe_id}].")
            end

            return rc
        end

        alias info! info

        # Allocates a new Document in OpenNebula
        #
        # @param description [String] The contents of the Document.
        #
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def allocate(description)
            super(DOCUMENT_METHODS[:allocate], description, document_type)
        end

        alias allocate_xml allocate

        # Deletes the Document
        #
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def delete
            rc = check_type
            return rc if OpenNebula.is_error?(rc)

            return call(DOCUMENT_METHODS[:delete], @pe_id)
        end

        # Replaces the template contents
        #
        # @param [String] new_template new template contents
        # @param append [true, false] True to append new attributes instead of
        #   replace the whole template
        #
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def update(new_template, append = false)
            rc = check_type
            return rc if OpenNebula.is_error?(rc)

            super(DOCUMENT_METHODS[:update], new_template, append ? 1 : 0)
        end

        # Replaces the raw template contents
        #
        # @param template [String] New template contents, in the form KEY = VAL
        # @param append [true, false] True to append new attributes instead of
        #   replace the whole template
        #
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def update_raw(template_raw, append = false)
            rc = check_type
            return rc if OpenNebula.is_error?(rc)

            return call(DOCUMENT_METHODS[:update], @pe_id, template_raw, append ? 1 : 0)
        end

        # Changes the owner/group
        #
        # @param [Integer] uid the new owner id. Set to -1 to leave the current one
        # @param [Integer] gid the new group id. Set to -1 to leave the current one
        #
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def chown(uid, gid)
            rc = check_type
            return rc if OpenNebula.is_error?(rc)

            super(DOCUMENT_METHODS[:chown], uid, gid)
        end

        # Changes the Document permissions.
        #
        # @param octet [String] Permissions octed , e.g. 640
        #
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def chmod_octet(octet)
            rc = check_type
            return rc if OpenNebula.is_error?(rc)

            super(DOCUMENT_METHODS[:chmod], octet)
        end

        # Changes the Document permissions.
        # Each [Integer] argument must be 1 to allow, 0 deny, -1 do not change
        #
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def chmod(owner_u, owner_m, owner_a, group_u, group_m, group_a, other_u,
                  other_m, other_a)
            rc = check_type
            return rc if OpenNebula.is_error?(rc)

            super(DOCUMENT_METHODS[:chmod], owner_u, owner_m, owner_a, group_u,
                group_m, group_a, other_u, other_m, other_a)
        end

        # Clones this Document into a new one
        #
        # @param name [String] Name for the new Document.
        #
        # @return [Integer, OpenNebula::Error] The new Document ID in case
        #   of success, Error otherwise
        def clone(name)
            rc = check_type
            return rc if OpenNebula.is_error?(rc)

            return Error.new('ID not defined') unless @pe_id

            rc = @client.call(DOCUMENT_METHODS[:clone], @pe_id, name)

            return rc
        end

        # Renames this Document
        #
        # @param name [String] New name for the Document.
        #
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def rename(name)
            return call(DOCUMENT_METHODS[:rename], @pe_id, name)
        end

        #######################################################################
        # Helpers to get Document information
        #######################################################################

        # Returns the group identifier
        # @return [Integer] the element's group ID
        def gid
            self['GID'].to_i
        end

        # Returns the owner user ID
        # @return [Integer] the element's owner user ID
        def owner_id
            self['UID'].to_i
        end

        # Returns true if the GROUP_U permission bit is set
        # @return [true, false] true if the GROUP_U permission bit is set
        def public?
            if self['PERMISSIONS/GROUP_U'] == '1' || self['PERMISSIONS/OTHER_U'] == '1'
                true
            else
                false
            end
        end

        def document_type
            self.class::DOCUMENT_TYPE
        end

        private

        def set_publish(published)
            group_u = published ? 1 : 0

            chmod(-1, -1, -1, group_u, -1, -1, -1, -1, -1)
        end

        def check_type
            type = self['TYPE']

            if type.nil? && @pe_id
                rc = @client.call(DOCUMENT_METHODS[:info], @pe_id)

                return rc if OpenNebula.is_error?(rc)

                xmldoc = XMLElement.new
                xmldoc.initialize_xml(rc, 'DOCUMENT')

                type = xmldoc['TYPE']
            end

            if !type.nil? && type.to_i != document_type
                return OpenNebula::Error.new(
                    "[DocumentInfo] Error getting document [#{@pe_id}]."
                )
            end

            return
        end

    end

end
