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

require 'one_helper'
require 'one_helper/onevm_helper'

# CLI helper for oneimage command
class OneImageHelper < OpenNebulaHelper::OneHelper

    # This list contains prefixes that should skip adding user home to the path
    # This must have the same content as the case $FROM in downloader.sh
    PREFIXES = ['http', 'https', 'ssh', 's3', 'rbd', 'vcenter', 'lxd']

    TEMPLATE_OPTIONS=[
        {
            :name => 'description',
            :large => '--description description',
            :format => String,
            :description => 'Description for the new Image'
        },
        {
            :name => 'type',
            :large => '--type type',
            :format => String,
            :description => "Type of the new Image: \
            #{Image::IMAGE_TYPES.join(', ')}",

            :proc => lambda do |o, _options|
                type=o.strip.upcase

                if Image::IMAGE_TYPES.include? type
                    [0, type]
                else
                    [-1, "Type should be: #{Image::IMAGE_TYPES.join(', ')}"]
                end
            end
        },
        {
            :name => 'persistent',
            :large => '--persistent',
            :description => 'Tells if the image will be persistent'
        },
        {
            :name => 'prefix',
            :large => '--prefix prefix',
            :description => "Device prefix for the disk (eg. hd, sd, xvd\n"<<
                ' '*31<<'or vd)',
            :format => String,
            :proc => lambda do |o, _options|
                prefix=o.strip.downcase
                if ['hd', 'sd', 'xvd', 'vd'].include? prefix
                    [0, prefix]
                else
                    [-1, 'The prefix must be hd, sd, xvd or vd']
                end
            end
        },
        {
            :name => 'target',
            :large => '--target target',
            :description => 'Device the disk will be attached to',
            :format => String
        },
        {
            :name => 'path',
            :large => '--path path',
            :description => 'Path of the image file',
            :format => String,
            :proc => lambda do |o, _options|
                next [0, o] if o.match(%r{^(#{PREFIXES.join('|')})://})

                if o[0, 1]=='/'
                    path=o
                else
                    path=Dir.pwd+'/'+o
                end

                [0, path]
            end
        },
        {
            :name => 'format',
            :large => '--format format',
            :description => 'Format of the image (raw, qcow2, ...)',
            :format => String
        },
        {
            :name => 'fs',
            :large => '--fs filesystem',
            :description => 'Filesystem to format the image (ext4, xfs, ...)',
            :format => String
        },
        {
            :name => 'disk_type',
            :large => '--disk_type disk_type',
            :description => "Type of the image \n"<<
                ' ' * 31 << "BLOCK, CDROM, RBD or FILE \n" \
                '(for others, check the documentation) ',
            :format => String
        },
        {
            :name => 'vcenter_disk_type',
            :large => '--vcenter_disk_type vcenter_disk_type',
            :description => "The vCenter Disk Type of the image \n"<<
                ' ' * 31 <<
                'for vCenter: THIN, THICK, ZEROEDTHICK ' \
                '(for others, check the documentation) ',
            :format => String
        },
        {
            :name => 'vcenter_adapter_type',
            :large => '--vcenter_adapter_type vcenter_adapter_type',
            :description => 'Controller that will handle this image in ' \
                'vCenter (lsiLogic, ide, busLogic). For other '\
                'values check the documentation',
            :format => String
        },
        {
            :name => 'source',
            :large => '--source source',
            :description =>
                "Source to be used. Useful for not file-based\n"<<
                    ' '*31<<'images',
            :format => String
        },
        {
            :name => 'size',
            :large => '--size size',
            :description => "Size in MB. \
            Used for DATABLOCK type or SOURCE based images.",

            :format => String,
            :proc => lambda do |o, _options|
                m=o.strip.match(/^(\d+(?:\.\d+)?)(m|mb|g|gb)?$/i)

                if !m
                    [-1, 'Size value malformed']
                else
                    multiplier=case m[2]
                               when /(g|gb)/i
                                   1024
                               else
                                   1
                               end

                    value=m[1].to_f*multiplier

                    [0, value.floor]
                end
            end
        },
        OpenNebulaHelper::DRY
    ]

    IMAGE = {
        :name => 'no_check_capacity',
        :large => '--no_check_capacity',
        :description =>
            'Do not check Datastore capacity, only for admins.'
    }

    FILTERS = [
        {
            :name => 'backup',
            :large => '--backup',
            :description => 'Show only backup type images',
            :format => String
        }
    ]

    def self.rname
        'IMAGE'
    end

    def self.conf_file
        'oneimage.yaml'
    end

    def self.state_to_str(id)
        id = id.to_i
        state_str = Image::IMAGE_STATES[id]
        Image::SHORT_IMAGE_STATES[state_str]
    end

    def self.type_to_str(id)
        id = id.to_i
        type_str = Image::IMAGE_TYPES[id]
        Image::SHORT_IMAGE_TYPES[type_str]
    end

    def format_pool(options)
        config_file = self.class.table_conf

        CLIHelper::ShowTable.new(config_file, self) do
            column :ID, 'ONE identifier for the Image', :size=>4 do |d|
                d['ID']
            end

            column :USER, 'Username of the Image owner', :left,
                   :size=>10 do |d|
                helper.user_name(d, options)
            end

            column :GROUP, 'Group of the Image', :left,
                   :size=>10 do |d|
                helper.group_name(d, options)
            end

            column :NAME, 'Name of the Image', :left, :size=>15 do |d|
                d['NAME']
            end

            column :DATASTORE, 'Name of the Datastore', :left, :size=>10 do |d|
                d['DATASTORE']
            end

            column :TYPE, 'Type of the Image', :left, :size=>4 do |d, _e|
                OneImageHelper.type_to_str(d['TYPE'])
            end

            column :REGTIME, 'Registration time of the Image',
                   :size=>15 do |d|
                OpenNebulaHelper.time_to_str(d['REGTIME'])
            end

            column :PERSISTENT, 'Whether the Image is persistent or not',
                   :size=>3 do |d|
                OpenNebulaHelper.boolean_to_str(d['PERSISTENT'])
            end

            column :STAT, 'State of the Image', :left, :size=>4 do |d|
                OneImageHelper.state_to_str(d['STATE'])
            end

            column :RVMS, 'Number of VMs currently running from this Image',
                   :size=>4 do |d|
                d['RUNNING_VMS']
            end

            column :SIZE, 'Size of the image',
                   :size=>7 do |d|
                OpenNebulaHelper.unit_to_str(d['SIZE'].to_i, options, 'M')
            end

            default :ID, :USER, :GROUP, :NAME, :DATASTORE, :SIZE, :TYPE,
                    :PERSISTENT, :STAT, :RVMS
        end
    end

    def check_orphans
        orphans = []
        xpath = '/VMTEMPLATE_POOL/VMTEMPLATE/TEMPLATE/DISK'

        pool = factory_pool
        tmpl_pool = OpenNebula::TemplatePool.new(@client, -2)

        pool.info
        tmpl_pool.info

        pool.each do |img|
            next if img['TYPE'].to_i == 6 # skip backup images

            attrs = { :id    => img['ID'],
                      :name  => img['NAME'],
                      :uname => img['UNAME'] }

            orphans << img['ID'] if check_orphan(tmpl_pool, xpath, 'IMAGE', attrs)
        end

        orphans
    end

    private

    def factory(id = nil)
        if id
            OpenNebula::Image.new_with_id(id, @client)
        else
            xml=OpenNebula::Image.build_xml
            OpenNebula::Image.new(xml, @client)
        end
    end

    def factory_pool(user_flag = -2)
        OpenNebula::ImagePool.new(@client, user_flag)
    end

    def format_resource(image, _options = {})
        str='%-15s: %-20s'
        str_h1='%-80s'

        path = image['PATH']
        iformat = image['FORMAT']

        size = OpenNebulaHelper.unit_to_str(image['SIZE'].to_i, {}, 'M')
        lock = OpenNebulaHelper.level_lock_to_str(image['LOCK/LOCKED'])
        regtime = OpenNebulaHelper.time_to_str(image['REGTIME'])
        pers = OpenNebulaHelper.boolean_to_str(image['PERSISTENT'])

        CLIHelper.print_header(str_h1 % "IMAGE #{image['ID']} INFORMATION")
        puts format(str, 'ID', image.id.to_s)
        puts format(str, 'NAME', image.name)
        puts format(str, 'USER', image['UNAME'])
        puts format(str, 'GROUP', image['GNAME'])
        puts format(str, 'LOCK', lock)
        puts format(str, 'DATASTORE', image['DATASTORE'])
        puts format(str, 'TYPE', image.type_str)
        puts format(str, 'REGISTER TIME', regtime)
        puts format(str, 'PERSISTENT', pers)
        puts format(str, 'SOURCE', image['SOURCE'])
        puts format(str, 'PATH', path) if path && !path.empty?
        puts format(str, 'FORMAT', iformat) if iformat && !iformat.empty?
        puts format(str, 'SIZE', size)
        puts format(str, 'STATE', image.short_state_str)
        puts format(str, 'RUNNING_VMS', image['RUNNING_VMS'])
        puts

        CLIHelper.print_header(str_h1 % 'PERMISSIONS', false)

        ['OWNER', 'GROUP', 'OTHER'].each do |e|
            mask = '---'
            mask[0] = 'u' if image["PERMISSIONS/#{e}_U"] == '1'
            mask[1] = 'm' if image["PERMISSIONS/#{e}_M"] == '1'
            mask[2] = 'a' if image["PERMISSIONS/#{e}_A"] == '1'

            puts format(str, e, mask)
        end

        if image.has_elements?('/IMAGE/SNAPSHOTS/SNAPSHOT')
            puts
            CLIHelper.print_header(str_h1 % 'IMAGE SNAPSHOTS', false)
            format_snapshots(image)
        end

        puts

        CLIHelper.print_header(str_h1 % 'IMAGE TEMPLATE', false)
        puts image.template_str

        vms=image.retrieve_elements('VMS/ID')

        return unless vms

        if image.type_str.casecmp('backup').zero?
            CLIHelper.print_header(str_h1 % 'BACKUP INFORMATION', false)
            puts format(str, 'VM', vms[0])

            if image.has_elements?('/IMAGE/BACKUP_INCREMENTS/INCREMENT')
                puts format(str, 'TYPE', 'INCREMENTAL')

                puts

                CLIHelper.print_header('BACKUP INCREMENTS', false)
                format_backup_increments(image)
            else
                puts format(str, 'TYPE', 'FULL')
            end
        else
            puts
            CLIHelper.print_header('VIRTUAL MACHINES', false)
            puts

            vms.map! {|e| e.to_i }
            onevm_helper=OneVMHelper.new
            onevm_helper.client=@client
            onevm_helper.list_pool({ :ids=>vms, :no_pager => true },
                                   false)

        end
    end

    def format_snapshots(image)
        table=CLIHelper::ShowTable.new(nil, self) do
            column :AC, 'Is active', :left, :size => 2 do |d|
                if d['ACTIVE'] == 'YES'
                    '=>'
                else
                    ''
                end
            end
            column :ID, 'Snapshot ID', :size=>3 do |d|
                d['ID']
            end

            column :PARENT, 'Snapshot Parent ID', :size=>6 do |d|
                d['PARENT']
            end

            column :CHILDREN, 'Snapshot Children IDs', :size=>10 do |d|
                d['CHILDREN']
            end

            column :SIZE, '', :left, :size=>8 do |d|
                if d['SIZE']
                    OpenNebulaHelper.unit_to_str(
                        d['SIZE'].to_i,
                        {},
                        'M'
                    )
                else
                    '-'
                end
            end

            column :NAME, 'Snapshot Name', :left, :size=>37 do |d|
                d['NAME']
            end

            column :DATE, 'Snapshot creation date', :size=>15 do |d|
                OpenNebulaHelper.time_to_str(d['DATE'])
            end

            default :AC, :ID, :PARENT, :DATE, :SIZE, :NAME
        end

        # Convert snapshot data to an array
        image_hash = image.to_hash
        image_snapshots = [image_hash['IMAGE']['SNAPSHOTS']['SNAPSHOT']].flatten
        table.show(image_snapshots)
    end

    def format_backup_increments(image)
        table=CLIHelper::ShowTable.new(nil, self) do
            column :ID, 'Increment ID', :size=>3 do |d|
                d['ID']
            end

            column :PID, 'Parent increment ID', :size=>3 do |d|
                d['PARENT_ID']
            end

            column :TYPE, 'T', :size=>1 do |d|
                d['TYPE'][0]
            end

            column :SIZE, '', :left, :size=>8 do |d|
                if d['SIZE']
                    OpenNebulaHelper.unit_to_str(
                        d['SIZE'].to_i,
                        {},
                        'M'
                    )
                else
                    '-'
                end
            end

            column :DATE, 'Creation date', :size=>15 do |d|
                OpenNebulaHelper.time_to_str(d['DATE'])
            end

            column :SOURCE, 'Backup source', :left, :size=>37 do |d|
                d['SOURCE']
            end

            default :ID, :PID, :TYPE, :SIZE, :DATE, :SOURCE
        end

        ihash      = image.to_hash
        increments = [ihash['IMAGE']['BACKUP_INCREMENTS']['INCREMENT']].flatten

        table.show(increments)
    end

    class << self

        def create_image_variables(options, name)
            if name.is_a?(Array)
                names = name
            else
                names = [name]
            end

            t = ''
            names.each do |n|
                if options[n]
                    t << "#{n.to_s.upcase}=\"#{options[n]}\"\n"
                end
            end

            t
        end

        def create_image_template(options)
            template_options = TEMPLATE_OPTIONS.map do |o|
                o[:name].to_sym
            end

            template_options << :name

            template = create_image_variables(
                options,
                template_options - [:persistent, :dry, :prefix]
            )

            if options[:persistent]
                template << "PERSISTENT=YES\n"
            end

            if options[:prefix]
                template << "DEV_PREFIX=\"#{options[:prefix]}\"\n"
            end

            [0, template]
        end

        def create_template_options_used?(options, conflicting_opts)
            # Get the template options names as symbols, options hash uses symbols
            template_options=TEMPLATE_OPTIONS.map do |o|
                o[:name].to_sym
            end

            # Check if one at least one of the template options is in options hash
            conflicting_opts.replace(options.keys & template_options)

            !conflicting_opts.empty?
        end

    end

end
