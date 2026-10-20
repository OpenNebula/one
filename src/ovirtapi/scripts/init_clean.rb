#!/usr/bin/env ruby

require 'yaml'
require 'fileutils'
require 'etc'

# Load configuration
config_location = ENV['ONE_LOCATION'] ? "#{ENV['ONE_LOCATION']}/etc/one" : '/etc/one'
CONFIG = YAML.load_file("#{config_location}/ovirtapi-server.yml")
TMP_IMAGES_PATH = CONFIG['app']['tmp_images_path']

def self.wipe_tmp_directory
    # Create the tmp images path directory if it does not exist
    unless Dir.exist?(TMP_IMAGES_PATH)
        FileUtils.mkdir_p(TMP_IMAGES_PATH, :mode => 0o755)
    end

    # Change ownership to oneadmin:oneadmin
    passwd_entry = Etc.getpwnam('oneadmin')
    oneadmin_uid = passwd_entry.uid
    oneadmin_gid = passwd_entry.gid
    FileUtils.chown_R(oneadmin_uid, oneadmin_gid, TMP_IMAGES_PATH)

    # Remove all files and directories inside the tmp images path
    max_retries = 3
    retries = 0
    success = false
    until success || retries >= max_retries
        Dir.glob(File.join(TMP_IMAGES_PATH, '{*,.*}'), File::FNM_DOTMATCH).each do |file|
            next if ['.', '..'].include?(File.basename(file))

            if File.directory?(file) && !File.symlink?(file)
                FileUtils.rm_rf(file)
            else
                File.delete(file)
            end
        end

        remaining_files = Dir.entries(TMP_IMAGES_PATH) - ['.', '..']
        if !remaining_files.empty?
            retries += 1
            sleep 1 if retries < max_retries
        else
            success = true
        end
    end

    return 0 if success

    STDERR.puts "Error: Unable to completely clean tmp images path at #{TMP_IMAGES_PATH} after #{max_retries} attempts."
    return 1
end

def main
    return wipe_tmp_directory
end

exit main