# -------------------------------------------------------------------------- #
# Copyright 2002-2026, OpenNebula Project, OpenNebula Systems                #
#                                                                            #
# Licensed under the Ap@ache License, Version 2.0 (the "License"); you may    #
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

module OneKS

    # The ClusterDocumentPool is a set of Kubernetes cluster document elements
    class ClusterDocumentPool < ODS::Pool

        # Defines the class and document type for this pool
        DOCUMENT_CLASS = OneKS::Cluster
        DOCUMENT_TYPE  = OneKS::Cluster::DOCUMENT_TYPE

    end

    # The K8sGroupDocumentPool is a set of Kubernetes groups document elements
    class K8sGroupDocumentPool < ODS::Pool

        # Defines the class and document type for this pool
        DOCUMENT_CLASS = OneKS::K8sGroup
        DOCUMENT_TYPE  = OneKS::K8sGroup::DOCUMENT_TYPE

        DOCUMENT_TYPES = {
            :ControlPlane => OneKS::ControlPlane,
            :NodeGroup    => OneKS::NodeGroup
        }

        # Returns the first group in the pool matching the provided name
        def by_name(name)
            find {|group| group.name.to_s == name.to_s }
        end

        # Returns an array with all VMS registered as part of the group
        def vms
            flat_map do |group|
                group.vms.map do |vm_id|
                    { :id         => vm_id,
                      :group_id   => group.id,
                      :cluster_id => group.cluster_id }
                end
            end
        end

    end

end
