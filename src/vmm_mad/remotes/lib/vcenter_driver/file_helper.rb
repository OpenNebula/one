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

require 'fileutils'
require 'tempfile'

##############################################################################
# Module VCenterDriver
##############################################################################
module VCenterDriver

    ##########################################################################
    # Class FileHelper
    ##########################################################################
    class FileHelper

        def self.sanitize(text)
            # Bad as defined by wikipedia:
            # https://en.wikipedia.org/wiki/Filename in
            # Reserved_characters_and_words
            # Also have to escape the backslash
            bad_chars = ['/', '\\', '?', '%', '*', ':',
                         '|', '"', '<', '>', '.', ' ']
            bad_chars.each do |bad_char|
                text.gsub!(bad_char, '_')
            end
            text
        end

        def self.get_img_name(
            disk,
            vm_id,
            _vm_name,
            instantiate_as_persistent = false
        )
            if disk['PERSISTENT'] == 'YES' || disk['TYPE'] == 'CDROM'
                disk['SOURCE']
            else
                disk_id = disk['DISK_ID']
                if disk['SOURCE']
                    if instantiate_as_persistent &&
                       disk['OPENNEBULA_MANAGED'] &&
                       disk['OPENNEBULA_MANAGED'].upcase == 'NO'
                        disk['SOURCE'] # Treat this disk as if was persistent
                    else
                        image_name = disk['SOURCE'].split('.').first
                        "#{image_name}-#{vm_id}-#{disk_id}.vmdk"
                    end
                else
                    ds_volatile_dir =
                        disk['VCENTER_DS_VOLATILE_DIR'] || 'one-volatile'
                    "#{ds_volatile_dir}/#{vm_id}/one-#{vm_id}-#{disk_id}.vmdk"
                end
            end
        end

        # REMOVE: no need to change...
        def self.get_img_name_from_path(path, vm_id, disk_id)
            # NOTE: This will probably fail if the basename contains '.'
            "#{path.split('.').first}-#{vm_id}-#{disk_id}.vmdk"
        end

        def self.remote_or_needs_unpack?(file)
            !remote?(file).nil? || needs_unpack?(file)
        end

        def self.remote?(file)
            file.match(%r{^https?://}) || file.match(%r{^s3?://})
        end

        def self.from_s3?(file)
            file.match(%r{^s3?://})
        end

        def self.vmdk?(file)
            type = `file #{file}`

            type.include? 'VMware'
        end

        def self.iso?(file)
            type = `file #{file}`

            type.include? 'ISO'
        end

        def self.get_type(file)
            type = `file -P bytes=256 -b --mime-type #{file}`
            if $?.exitstatus != 0 # rubocop:disable Style/SpecialGlobalVars
                STDERR.puts "Can not read file #{file}"
                exit(-1)
            end
            type.strip
        end

        def self.needs_unpack?(file_path)
            type = get_type(file_path)
            type.gsub!(%r{^application/(x-)?}, '')
            ['bzip2', 'gzip', 'tar'].include?(type)
        end

        def self.vcenter_file_info(file_path)
            if File.directory?(file_path)
                files = Dir["#{file_path}/*.vmdk"]
                found = false
                count = 0
                last  = nil

                files.each do |f|
                    if get_type(f).strip == 'text/plain'
                        file_path = f
                        found = true
                        break
                    else
                        count += 1
                        last = f
                    end
                end

                if !found
                    if count == 1
                        file_path = last
                        found = true
                    else
                        STDERR.puts 'Could not find vmdk'
                        exit(-1)
                    end
                end
            end

            case get_type(file_path).strip
            when 'application/octet-stream'
                {
                    :type   => :standalone,
                    :file   => file_path,
                    :dir    => File.dirname(file_path)
                }
            when 'application/x-iso9660-image'
                {
                    :type   => :standalone,
                    :file   => file_path,
                    :dir    => File.dirname(file_path),
                    :extension => '.iso'
                }
            when 'text/plain'
                info = {
                    :type   => :flat,
                    :file   => file_path,
                    :dir    => File.dirname(file_path)
                }

                files_list = []
                descriptor = File.read(file_path).split("\n")
                flat_files = descriptor.select {|l| l.start_with?('RW') }

                flat_files.each do |f|
                    files_list <<
                        info[:dir] +
                        '/' +
                        f
                        .split(' ')[3]
                        .chomp
                        .chomp('"')
                        .reverse
                        .chomp('"')
                        .reverse
                end

                info[:flat_files] = files_list

                info
            else
                STDERR.puts 'Unrecognized file type'
                exit(-1)
            end
        end

        def self.escape_path(path)
            path.gsub(' ', '%20')
        end

        def self.unescape_path(path)
            path.gsub('%20', ' ')
        end

        # Recursively downloads vmdk related files and returns filenames
        def self.get_all_filenames_in_descriptor(descriptor_url, ds)
            descriptor_filename = File.basename descriptor_url.path
            # Build array of files to download
            files_to_download = [descriptor_filename]
            image_source = descriptor_url.host + descriptor_url.path
            descriptor_content = ds.get_text_file image_source
            flat_files = descriptor_content.select {|l| l.start_with?('RW') }
            flat_files.each do |file|
                # Get the filename from lines of type
                # RW 2048000 VMFS "filename-flat.vdmdk"
                file_to_download = file.split(' ')[3][1..-2]
                files_to_download << file_to_download
                image_path =
                    File
                    .dirname(
                        descriptor_url.host+descriptor_url.path
                    )
                next unless ds.descriptor?(
                    image_path + '/' + file_to_download
                )

                files_to_download <<
                    download_all_filenames_in_descriptor(
                        image_path + '/' + file_to_download
                    )
            end

            files_to_download
        end

        def self.download_vmdks(files_to_download, url_prefix, temp_folder, ds)
            # Download files
            url_prefix += '/'

            VCenterDriver::VIClient.in_silence do
                files_to_download.each do |file|
                    ds.download_file(url_prefix + file, temp_folder + file)
                end
            end
        end

        # Receives a VMDK descriptor or file, downloads all
        # related files, creates a tar.gz and dumps it in stdout
        def self.dump_vmdk_tar_gz(vcenter_url, ds)
            image_source = vcenter_url.host + vcenter_url.path
            if ds.descriptor?(image_source)
                files_to_download =
                    get_all_filenames_in_descriptor(
                        vcenter_url,
                        ds
                    )

                descriptor_name = File.basename vcenter_url.path
                temp_folder = VAR_LOCATION + '/vcenter/' + descriptor_name + '/'
                unless File.directory?(temp_folder)
                    FileUtils
                        .mkdir_p(
                            temp_folder
                        )
                end

                image_path = File.dirname(vcenter_url.host+vcenter_url.path)
                download_vmdks(files_to_download, image_path, temp_folder, ds)

                # Create tar.gz
                rs = system(
                    "cd #{temp_folder} \&& tar czf #{descriptor_name}.tar.gz \
                    #{files_to_download.join(' ')} > /dev/null 2>&1"
                )
                unless rs
                    FileUtils.rm_rf temp_folder
                    raise "Error creating tar file for #{descriptor_name}"
                end

                # Cat file to stdout
                rs = system("cat #{temp_folder + descriptor_name}.tar.gz")
                unless rs
                    FileUtils.rm_rf temp_folder
                    raise "Error reading tar for #{descriptor_name}"
                end

                # Delete tar.gz
                rs = system(
                    "cd #{temp_folder} \
                    && rm #{descriptor_name}.tar.gz #{
                        files_to_download
                        .join(' ')}"
                )
                unless rs
                    FileUtils.rm_rf temp_folder
                    raise "Error removing tar for #{descriptor_name}"
                end
            else
                # Setting "." as the source will read from the stdin
                VCenterDriver::VIClient.in_stderr_silence do
                    descriptor_name = File.basename vcenter_url.path
                    file_to_download = [vcenter_url.path]
                    temp_folder =
                        VAR_LOCATION + '/vcenter/' + descriptor_name + '/'

                    unless File
                           .directory?(
                               temp_folder + File
                               .dirname(
                                   vcenter_url
                                   .path
                               ) + '/'
                           )
                        FileUtils
                            .mkdir_p(temp_folder + File
                            .dirname(
                                vcenter_url
                                .path
                            ) + '/')
                    end

                    download_vmdks(
                        file_to_download,
                        vcenter_url.host,
                        temp_folder,
                        ds
                    )

                    temp_folder += File.dirname(vcenter_url.path)

                    # Create tar.gz
                    rs = system(
                        "cd #{temp_folder} && tar czf #{descriptor_name}.tar.gz\
                         #{descriptor_name} > /dev/null 2>&1"
                    )
                    unless rs
                        (
                            FileUtils
                            .rm_rf(
                                temp_folder
                            )
                            raise "Error creating tar \
                            file for #{descriptor_name}")
                    end

                    # Cat file to stdout
                    rs = system(
                        "cat #{temp_folder + '/' + descriptor_name}.tar.gz"
                    )
                    unless rs
                        (
                            FileUtils
                            .rm_rf(
                                temp_folder
                            )
                            raise "Error reading tar for #{descriptor_name}")
                    end # rubocop:disable Style/Semicolon

                    # Delete tar.gz
                    rs = system(
                        "cd #{temp_folder} \
                        && rm #{descriptor_name}.tar.gz #{descriptor_name}"
                    )
                    unless rs
                        (
                            FileUtils
                            .rm_rf(
                                temp_folder
                            )
                            raise "Error removing tar for #{descriptor_name}")
                    end # rubocop:disable Style/Semicolon
                end
            end
        end

    end
    # class FileHelper

end
# module VCenterDriver
