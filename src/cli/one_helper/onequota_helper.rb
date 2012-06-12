# -------------------------------------------------------------------------- #
# Copyright 2002-2012, OpenNebula Project Leads (OpenNebula.org)             #
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

require 'cli_helper'

class OneQuotaHelper

    #---------------------------------------------------------------------------
    #  Tables to format user quotas
    #---------------------------------------------------------------------------
    TABLE_DS = CLIHelper::ShowTable.new(nil, self) do
        column :"DATASTORE ID", "", :left, :size=>12 do |d|
            d["ID"] if !d.nil?
        end

        column :"IMAGES (used)", "", :right, :size=>14 do |d|
            d["IMAGES_USED"] if !d.nil?
        end

        column :"IMAGES (limit)", "", :right, :size=>14 do |d|
            d["IMAGES"] if !d.nil?
        end

        column :"SIZE (used)", "", :right, :size=>14 do |d|
            d["SIZE_USED"] if !d.nil?
        end

        column :"SIZE (limit)", "", :right, :size=>14 do |d|
            d["SIZE"] if !d.nil?
        end
    end

    TABLE_NET = CLIHelper::ShowTable.new(nil, self) do
        column :"NETWORK ID", "", :left, :size=>12 do |d|
            d["ID"] if !d.nil?
        end

        column :"LEASES (used)", "", :right, :size=>14 do |d|
            d["LEASES_USED"] if !d.nil?
        end

        column :"LEASES (limit)", "", :right, :size=>14 do |d|
            d["LEASES"] if !d.nil?
        end
    end

    TABLE_VM = CLIHelper::ShowTable.new(nil, self) do
        column :"VMS", "", :left, :size=>12 do |d|
            d["VMS"] if !d.nil?
        end

        column :"MEMORY (used)", "", :right, :size=>14 do |d|
            d["MEMORY_USED"] if !d.nil?
        end

        column :"MEMORY (limit)", "", :right, :size=>14 do |d|
            d["MEMORY"] if !d.nil?
        end

        column :"CPU (used)", "", :right, :size=>14 do |d|
            d["CPU_USED"] if !d.nil?
        end

        column :"CPU (limit)", "", :right, :size=>14 do |d|
            d["CPU"] if !d.nil?
        end
    end

    TABLE_IMG = CLIHelper::ShowTable.new(nil, self) do
        column :"IMAGE ID", "", :left, :size=>12 do |d|
            d["ID"] if !d.nil?
        end

        column :"RVMS (used)", "", :right, :size=>14 do |d|
            d["RVMS_USED"] if !d.nil?
        end

        column :"RVMS (limit)", "", :right, :size=>14 do |d|
            d["RVMS"] if !d.nil?
        end
    end

    HELP_QUOTA = <<-EOT.unindent
        #-----------------------------------------------------------------------
        # Supported quota limits:
        #
        #  DATASTORE = [
        #    ID     = <ID of the datastore>
        #    IMAGES = <Max. number of images in the datastore>
        #    SIZE   = <Max. storage capacity (Mb) used in the datastore>
        #  ]
        #
        #  VM = [
        #    VMS    = <Max. number of VMs>
        #    MEMORY = <Max. allocated memory (Mb)>
        #    CPU    = <Max. allocated CPU>
        #  ]
        #
        #  NETWORK = [
        #    ID     = <ID of the network>
        #    LEASES = <Max. number of IP leases from the network>
        #  ]
        #
        #  IMAGE = [
        #    ID        = <ID of the image>
        #    RVMS = <Max. number of VMs using the image>
        #  ]
        #
        #  In any quota 0 means unlimited. The usage counters "*_USED" are
        #  shown for information purposes and will NOT be modified.
        #-----------------------------------------------------------------------
    EOT

    #  Edits the quota template of a resource
    #  @param resource [PoolElement] to get the current info from
    #  @param path [String] path to the new contents. If nil a editor will be 
    #         used
    #  @return [String] contents of the new quotas
    def self.set_quota(resource, path)
        str = ""

        if path.nil?
            require 'tempfile'

            tmp  = Tempfile.new('one-cli')
            path = tmp.path

            rc = resource.info

            if OpenNebula.is_error?(rc)
                puts rc.message
                exit -1
            end

            tmp << HELP_QUOTA
            tmp << resource.template_like_str("DATASTORE_QUOTA") << "\n"
            tmp << resource.template_like_str("VM_QUOTA") << "\n"
            tmp << resource.template_like_str("NETWORK_QUOTA") << "\n"
            tmp << resource.template_like_str("IMAGE_QUOTA") << "\n"

            tmp.close

            editor_path = ENV["EDITOR"] ? ENV["EDITOR"] : EDITOR_PATH
            system("#{editor_path} #{path}")

            unless $?.exitstatus == 0
                puts "Editor not defined"
                exit -1
            end

            str = File.read(path)

            File.unlink(path)
        else
            str = File.read(path)
        end

        str
    end

    #  Outputs formated quota information to stdout
    #  @param qh [Hash] with the quotas for a given resource
    #
    def self.format_quota(qh)
        str_h1="%-80s"

        puts

        CLIHelper.print_header(str_h1 % "RESOURCE USAGE & QUOTAS",false)

        puts

        ds_quotas = [qh['DATASTORE_QUOTA']['DATASTORE']].flatten
        if !ds_quotas[0].nil?
            TABLE_DS.show(ds_quotas, {})
            puts
        end

        vm_quotas = [qh['VM_QUOTA']['VM']].flatten
        if !vm_quotas[0].nil?
            TABLE_VM.show(vm_quotas, {})
            puts
        end

        net_quotas = [qh['NETWORK_QUOTA']['NETWORK']].flatten
        if !net_quotas[0].nil?
            TABLE_NET.show(net_quotas, {})
            puts
        end

        image_quotas = [qh['IMAGE_QUOTA']['IMAGE']].flatten
        if !image_quotas[0].nil?
            TABLE_IMG.show(image_quotas, {})
        end
    end
end
