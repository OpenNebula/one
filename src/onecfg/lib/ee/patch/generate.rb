# -------------------------------------------------------------------------- #
# Copyright 2019-2025, OpenNebula Systems S.L.                               #
#                                                                            #
# Licensed under the OpenNebula Software License                             #
# (the "License"); you may not use this file except in compliance with       #
# the License. You may obtain a copy of the License as part of the software  #
# distribution.                                                              #
#                                                                            #
# See https://github.com/OpenNebula/one/blob/master/LICENSE.onsla            #
# (or copy bundled with OpenNebula in /usr/share/doc/one/).                  #
#                                                                            #
# Unless agreed to in writing, software distributed under the License is     #
# distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY   #
# KIND, either express or implied. See the License for the specific language #
# governing permissions and  limitations under the License.                  #
# -------------------------------------------------------------------------- #

# rubocop:disable Style/ClassAndModuleChildren
module OneCfg::EE::Patch

    # Class for generating patches
    class Generate

        # Class constructor
        def initialize(prefix)
            # Map to store file => diff
            @files = {}
            @prefix = prefix
        end

        # Add a file diff to be processed
        #
        # @param file_name [String]
        # @param metadata  [String] patch information
        def add(file_name, metadata)
            pre_name = OneCfg::Config::Utils.prefixed(file_name, @prefix)

            @files[pre_name] = metadata
        end

        def generate_hintings
            hintings = ''

            generate do |file, diff|
                ret = OneCfg::Config::Utils.unprefixed(file.name, @prefix)
                ret << "\n"
                ret << file.hintings(diff).map {|l| "- #{l}" }.join("\n")
                ret << "\n\n"

                hintings << ret
            end

            hintings.strip
        end

        def generate_yaml
            yaml = { 'patches' => {} }

            generate do |file, diff|
                diff ||= []

                # short file class name
                f_type = \
                    file.class
                        .to_s
                        .gsub("#{OneCfg::Config::Files::TYPE_CLASS_NAME}::", '')

                file_name = OneCfg::Config::Utils.unprefixed(file.name, @prefix)

                yaml['patches'][file_name] = {
                    'class'  => f_type,
                    'change' => diff
                }
            end

            yaml.to_yaml
        end

        def generate_line
            hintings = ''

            generate do |file, diff|
                ret = ''
                fname = OneCfg::Config::Utils.unprefixed(file.name, @prefix)

                ret << file.hintings(diff).map {|l| "#{fname} #{l}" }.join("\n")

                hintings << "#{ret}\n"
            end

            hintings.strip
        end

        private

        def generate(&block)
            @files.each do |file_name, metadata|
                type    = metadata['class']
                content = metadata['content']

                file = OneCfg::Config::Files.type_class(type).new(file_name)

                next unless file.exist?

                OneCfg::LOG.info("Comparing '#{file_name}'")
                file.load

                Tempfile.open('diff') do |tmp|
                    tmp.write(content)
                    tmp.close

                    dist_new = file.class.new(tmp.path)
                    dist_new.load

                    diff = dist_new.diff(file)

                    next if diff.nil?

                    block.call(file, diff)
                end
            end
        end

    end

end
# rubocop:enable Style/ClassAndModuleChildren
