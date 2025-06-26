# -------------------------------------------------------------------------- #
# Copyright 2019-2022, OpenNebula Systems S.L.                               #
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

# frozen_string_literal: true

# Migrator
module Migrator

    HOOK_ARGS_OLD = %w[$ID $PREV_STATE $PREV_LCM_STATE]
    HOOK_TMPL_DIR = '/etc/one/migration-5.10.0-hooks'

    # Preupgrade steps
    def pre_up
        ['/var/lib/one/remotes/etc/datastore/fs',
         '/var/lib/one/remotes/etc/market',
         '/var/lib/one/remotes/etc/market/http'].each do |dir|
            @fops.mkdir(dir)
            @fops.chown(dir, 'oneadmin', 'oneadmin')
            @fops.chmod(dir, 0o750)
        end
    end

    # Upgrade steps
    def up
        process('/etc/one/oned.conf', 'Augeas::ONE') do |old, new|
            break unless old && new

            feature3380(old)
        end
    end

    def feature3380(old)
        # Update VM_HOOKs
        ret = manage_vm_hooks(old)

        # Update HOST_HOOKs
        ret = manage_host_hooks(old) || ret

        # Update VNET_HOOK, VROUTER_HOOK, USER_HOOK, GROUP_HOOK, IMAGE_HOOK
        ret = manage_generic_hooks(old) || ret

        if ret
            # rubocop:disable Layout/LineLength
            warn_log('Templates for the new hooks have been created in' \
                     " #{HOOK_TMPL_DIR}. You need to review them and" \
                     ' import the hooks using the onehook command!' \
                     ' Please read the OpenNebula hooks documentation' \
                     ' (http://docs.opennebula.org/5.10/integration/infrastructure_integration/hooks.html)' \
                     ' and check that the generated hooks match the' \
                     ' expected behavior.')
            # rubocop:enable Layout/LineLength
        end
    rescue StandardError => e
        error_log("Failed to migrate OpenNebula hooks due to '#{e.message}'." \
                  ' Skipping the error, hooks must be migrated manually!')
    end

    ######################################################################
    # VM Hook related methods
    ######################################################################

    def manage_vm_hooks(old)
        ret = false

        debug_log('Processing VM hooks')

        old.match('VM_HOOK').each do |path|
            hook = {}

            on = aug_unquote(old.get("#{path}/ON[1]"))
            on.upcase! if on

            case on
            when 'CREATE'
                manage_vm_create(old, path)
                next
            when 'CUSTOM'
                hook['STATE'] = old.get("#{path}/STATE[1]")
                hook['LCM_STATE'] = old.get("#{path}/LCM_STATE[1]")
            end

            hook['ON'] = on
            hook['NAME'] = aug_unquote(old.get("#{path}/NAME[1]"))
            hook['COMMAND'] = old.get("#{path}/COMMAND[1]")

            hook['ARGUMENTS'] = old.get("#{path}/ARGUMENTS[1]")
            hook['ARGUMENTS'] ||= ''

            hook['REMOTE'] = old.get("#{path}/REMOTE[1]")
            hook['REMOTE'] ||= 'no'

            # Newly added attributes
            hook['TYPE'] = 'state'
            hook['RESOURCE'] = 'VM'

            if HOOK_ARGS_OLD.any? {|w| hook['ARGUMENTS'].include? w }
                legacy_hook(hook)
                next
            end

            create_hook_tmpl(hook)

            ret = true
        end

        ret
    end

    def manage_vm_create(old, path)
        2.times do |i|
            hook = {}

            hook['NAME'] = aug_unquote(old.get("#{path}/NAME[1]"))
            hook['NAME'] << "-#{i}"

            hook['ARGUMENTS'] = old.get("#{path}/ARGUMENTS[1]")
            hook['ARGUMENTS'] ||= ''

            hook['TYPE'] = 'api'
            hook['COMMAND'] = old.get("#{path}/COMMAND[1]")

            if i == 0
                hook['CALL'] = 'one.vm.allocate'
            else
                hook['CALL'] = 'one.template.instantiate'
            end

            if HOOK_ARGS_OLD.any? {|w| hook['ARGUMENTS'].include? w }
                legacy_hook(hook)
                break
            end

            create_hook_tmpl(hook)
        end
    end

    ######################################################################
    # Host Hook related methods
    ######################################################################

    def manage_host_hooks(old)
        ret = false

        debug_log('Processing HOST hooks')

        old.match('HOST_HOOK').each do |path|
            hook = {}

            on = aug_unquote(old.get("#{path}/ON[1]"))
            on.upcase! if on

            hook['NAME'] = aug_unquote(old.get("#{path}/NAME[1]"))
            hook['COMMAND'] = old.get("#{path}/COMMAND[1]")

            hook['ARGUMENTS'] = old.get("#{path}/ARGUMENTS[1]")
            hook['ARGUMENTS'] ||= ''

            case on
            when 'CREATE'
                manage_create(hook, resource)
            when 'ENABLE'
                hook['TYPE'] = 'api'
                hook['CALL'] = 'one.host.enable'
            else
                # Managed different state names
                if on == 'DISABLE'
                    hook['STATE'] = 'DISABLED'
                else
                    hook['STATE'] = on
                end

                hook['REMOTE'] = old.get("#{path}/REMOTE[1]")

                # Newly added attributes
                hook['TYPE'] = 'state'
                hook['RESOURCE'] = 'HOST'
            end

            if HOOK_ARGS_OLD.any? {|w| hook['ARGUMENTS'].include? w }
                legacy_hook(hook)
                next
            end

            create_hook_tmpl(hook)

            ret = true
        end

        ret
    end

    ######################################################################
    # Generic Hook related methods
    ######################################################################

    def manage_generic_hooks(old)
        ret = false

        %w[VNET USER GROUP IMAGE VROUTER].each do |t|
            debug_log("Processing #{t} hooks")

            old.match("#{t}_HOOK").each do |path|
                hook = {}

                on = aug_unquote(old.get("#{path}/ON[1]"))
                on.upcase! if on

                hook['NAME'] = aug_unquote(old.get("#{path}/NAME[1]"))
                hook['COMMAND'] = old.get("#{path}/COMMAND[1]")

                hook['ARGUMENTS'] = old.get("#{path}/ARGUMENTS[1]")
                hook['ARGUMENTS'] ||= ''

                if t == 'VNET'
                    resource = 'vn'
                else
                    resource = t.downcase
                end

                case on
                when 'CREATE'
                    manage_create(hook, resource)
                when 'REMOVE'
                    manage_delete(hook, resource)
                end

                if HOOK_ARGS_OLD.any? {|w| hook['ARGUMENTS'].include? w }
                    legacy_hook(hook)
                    next
                end

                create_hook_tmpl(hook)

                ret = true
            end
        end

        ret
    end

    ######################################################################
    # Utils
    ######################################################################

    # resource param must match with the name of the resouces at ONE API call.
    def manage_create(hook, resource)
        hook['TYPE'] = 'api'
        hook['CALL'] = "one.#{resource}.allocate"
    end

    # resource param must match with the name of the resouces at ONE API call.
    def manage_delete(hook, resource)
        hook['TYPE'] = 'api'
        hook['CALL'] = "one.#{resource}.delete"
    end

    def create_hook_tmpl(hook, write = true)
        # render hook template
        tmpl = "  ### HOOK #{hook['NAME']} TEMPLATE START ###\n"
        hook.each do |key, val|
            next if val.nil? || val.empty?

            tmpl += "  #{key} = #{aug_quote(val)}\n"
        end
        tmpl += "  ### HOOK #{hook['NAME']} TEMPLATE END ###\n"

        # optionally write to file
        if write
            unless @fops.exist?(HOOK_TMPL_DIR)
                @fops.mkdir(HOOK_TMPL_DIR)
                @fops.chown(HOOK_TMPL_DIR, 'root', 'oneadmin')
                @fops.chmod(HOOK_TMPL_DIR, 0o750)
            end

            fn = "#{HOOK_TMPL_DIR}/#{hook['NAME']}"

            @fops.file_write(fn, tmpl)
            @fops.chown(fn, 'root', 'oneadmin')
            @fops.chmod(fn, 0o640)

            warn_log("Review and manually import hook '#{hook['NAME']}'" \
                     " from template at #{fn}")
        end

        tmpl
    end

    def legacy_hook(hook)
        hook['ARGUMENTS'] = ''

        error_log("Hook '#{hook['NAME']}' must be migrated manually." \
                  ' Past arguments $ID, $PREV_STATE, $PREV_LCM_STATE' \
                  ' are not supported anymore. Hook scripts need to be' \
                  ' adapted to new hook system. Find below a version of' \
                  " hook template without arguments:\n" \
                  "#{create_hook_tmpl(hook, false).chomp}")
    end

    def warn_log(msg)
        if defined?(OneCfg::LOG)
            OneCfg::LOG.warn(msg)
        else
            STDERR.puts "WARNING: #{msg}"
        end
    end

    def error_log(msg)
        if defined?(OneCfg::LOG)
            OneCfg::LOG.error(msg)
        else
            STDOUT.puts "ERROR #{msg}"
        end
    end

    def debug_log(msg)
        if defined?(OneCfg::LOG)
            OneCfg::LOG.debug(msg)
        else
            STDERR.puts "DEBUG: #{msg}"
        end
    end

    def aug_unquote(str)
        OneCfg::Config::Type::Augeas.unquote(str)
    end

    def aug_quote(str)
        OneCfg::Config::Type::Augeas.quote(str)
    end

end
