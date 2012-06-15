#!/usr/bin/env ruby

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

require 'open3'
require 'net/http'
require 'uri'
require 'optparse'
require 'digest'
require 'fileutils'

require 'pp'


class Stream
    BLOCK_SIZE=1024*64

    TYPES={
        "application/x-gzip" => "gunzip -c -",
        "application/x-bzip2" => "bunzip2 -c -",
    }

    POSTPROCESS_TYPE={
        "application/x-tar" => "tar -xf #IN# -C #OUT#",
        "application/zip" => "unzip -d #OUT# #IN#"
    }

    DIGEST={
        "md5"       => lambda { Digest::MD5.new },
        "sha1"      => lambda { Digest::SHA1.new },
        "sha256"    => lambda { Digest::SHA2.new(256) },
        "sha384"    => lambda { Digest::SHA2.new(384) },
        "sha512"    => lambda { Digest::SHA2.new(512) },
    }

    def initialize(from, to, options={})
        @from=from
        @to=to
        @options=options

        @digests={}

        @uncompress_proc=nil
        @compr_in=nil
        @compr_out=nil

        @writer_thread=nil

        prepare_digests
    end

    def open_output_file
        if @to=='-'
            @output_file=STDOUT
        else
            begin
                @output_file=File.open(@to, "w")
            rescue
                STDERR.puts "Error opening output file '#{@to}"
                exit(-1)
            end
        end
    end

    def prepare_digests
        @options.each do |key, value|
            if DIGEST.has_key?(key)
                @digests[key]={
                    :hash => value,
                    :digest => DIGEST[key].call
                }
            end
        end
    end

    def process(data)
        begin
            @compr_in.write(data)
            @compr_in.flush
        rescue Errno::EPIPE
            STDERR.puts "Error uncompressing image."
            exit(-1)
        end

        @digests.each do |name, algo|
            algo[:digest] << data
        end
    end

    def type(header)
        io=Open3.popen3("file -b --mime-type -")
        io[0].write(header)
        io[0].close
        out=io[1].read.strip
        io[1].close
        out
    end

    def set_compress(header)
        t=type(header)

        compr=TYPES[t]

        if compr
            @uncompress_proc=Open3.popen3(compr)
        else
            @uncompress_proc=Open3.popen3("cat")
        end

        @compr_in=@uncompress_proc[0]
        @compr_out=@uncompress_proc[1]
    end

    def start_file_writer
        @writer_thread=Thread.new do
            while(!@compr_out.eof?)
                data=@compr_out.read(BLOCK_SIZE)
                if data
                    #STDERR.puts "Compr reader #{data.length}"
                    @output_file.write(data)
                    #STDERR.puts "File writer #{data.length}"
                else
                    #STDERR.puts "Data is empty!"
                end
            end
        end
    end

    def http_downloader(url)
        uri=URI(url)

        Net::HTTP.start(uri.host, uri.port) do |http|
            request=Net::HTTP::Get.new(uri.request_uri)

            http.request(request) do |response|
                response.read_body(&process)
            end
        end
    end

    def wget_downloader(url)
        @popen=Open3.popen3("wget -O -  '#{url}'")
        @popen[0].close
        @popen[1]
    end

    def check_hashes
        fail=false

        @digests.each do |name, d|
            given=d[:hash].downcase
            computed=d[:digest].hexdigest.downcase
            if given!=computed
                fail=true
                STDERR.puts "Digest #{name} does not match. "<<
                    "#{given}!=#{computed}"
            end
        end

        exit(-1) if fail
    end

    def download
        io=nil

        begin
            case @from
            when '-'
                io=STDIN
            when /^https?:\/\//
                io=wget_downloader(@from)
            when /^file:\/\/(.*)$/
                name=$1
                io=open(name, 'r')
            else
                io=open(@from, 'r')
            end
        rescue # Errno::ENOENT
            STDERR.puts "File not found"
            exit(-1)
        end

        header=io.read(BLOCK_SIZE)

        if !header
            if @popen
                STDERR.puts @popen[2].read.strip.split("\n").last
                exit(-1)
            end
        end

        open_output_file

        set_compress(header)
        start_file_writer

        download_stderr=""

        process(header)

        while(!io.eof?)
            @popen[2].read_nonblock(BLOCK_SIZE, download_stderr) if @popen
            data=io.read(BLOCK_SIZE)
            process(data)
        end

        @finished=true

        @compr_in.close_write

        @writer_thread.join

        check_hashes

        postprocess if @to!='-'
    end

    def postprocess
        f=open(@to)
        header=f.read(BLOCK_SIZE)
        f.close

        t=type(header)

        if POSTPROCESS_TYPE.has_key?(t)
            if @to[0,1]=='/'
                to=@to
            else
                to=ENV['PWD']+'/'+@to
            end

            tmp_file="#{to}.tmp"
            FileUtils.mv(to, tmp_file)

            FileUtils.mkdir(to)

            cmd=POSTPROCESS_TYPE[t]
            cmd.gsub!('#IN#', tmp_file)
            cmd.gsub!('#OUT#', @to)

            system(cmd)
            status=$?

            if !status.success?
                STDERR.puts "Error uncompressing archive"
                exit(-1)
            end

            FileUtils.rm(tmp_file)
        end
    end
end


options={}

OptionParser.new do |opts|
    opts.banner="Usage: download_helper <source> <destination>"

    Stream::DIGEST.each do |name, value|
        opts.on("--#{name} HASH", "Check #{name} hash") do |v|
            options[name]=v
        end
    end
end.parse!

if ARGV.length<2
    STDERR.puts "You need to specify source and destination"
    exit(-1)
end

input=ARGV[0]
output=ARGV[1]


s=Stream.new(input, output, options)
s.download

