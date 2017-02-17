require 'fileutils'
require 'tempfile'

module VCenterDriver

class FileHelper

    def self.get_img_name(disk, vm_id)
        if disk["PERSISTENT"] == "YES"
            return disk["SOURCE"]
        else
            if disk["SOURCE"]
                image_name = disk["SOURCE"].split(".").first
            else
                image_name = "one" #For volatile disks
            end
            disk_id  = disk["DISK_ID"]
            return "#{image_name}-#{vm_id}-#{disk_id}.vmdk"
        end
    end

    def self.get_img_name_from_path(path, vm_id, disk_id)
        return "#{path.split(".").first}-#{vm_id}-#{disk_id}.vmdk"
    end

    def self.is_remote_or_needs_unpack?(file)
        return is_remote?(file) || needs_unpack?(file)
    end

    def self.is_remote?(file)
        file.match(%r{^https?://})
    end

    def self.is_vmdk?(file)
        type = %x{file #{file}}

        type.include? "VMware"
    end

    def self.get_type(file)
        type = %x{file -b --mime-type #{file}}
        if $?.exitstatus != 0
            STDERR.puts "Can not read file #{file}"
            exit(-1)
        end
        type.strip
    end

    def self.needs_unpack?(file_path)
        type = get_type(file_path)
        type.gsub!(%r{^application/(x-)?}, '')
        return %w{bzip2 gzip tar}.include?(type)
    end

    def self.vcenter_file_info(file_path)
        if File.directory?(file_path)
            files = Dir["#{file_path}/*.vmdk"]
            found = false
            count = 0
            last  = nil

            files.each do |f|
                if get_type(f).strip == "text/plain"
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
                    STDERR.puts "Could not find vmdk"
                    exit(-1)
                end
            end
        end

        case get_type(file_path).strip
        when "application/octet-stream"
            return {
                :type   => :standalone,
                :file   => file_path,
                :dir    => File.dirname(file_path)
            }
        when "application/x-iso9660-image"
            return {
                :type   => :standalone,
                :file   => file_path,
                :dir    => File.dirname(file_path),
                :extension => '.iso'
            }
        when "text/plain"
            info = {
                :type   => :flat,
                :file   => file_path,
                :dir    => File.dirname(file_path)
            }

            files_list = []
            descriptor = File.read(file_path).split("\n")
            flat_files = descriptor.select {|l| l.start_with?("RW")}

            flat_files.each do |f|
                files_list << info[:dir] + "/" +
                    f.split(" ")[3].chomp.chomp('"').reverse.chomp('"').reverse
            end

            info[:flat_files] = files_list

            return info
        else
            STDERR.puts "Unrecognized file type"
            exit(-1)
        end
    end

end # class FileHelper

end # module VCenterDriver