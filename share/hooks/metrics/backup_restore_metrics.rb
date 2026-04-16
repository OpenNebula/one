#!/usr/bin/env ruby

# -------------------------------------------------------------------------- #
# Copyright 2002-2026, OpenNebula Project, OpenNebula Systems                #
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

require 'json'
require 'fileutils'
require 'base64'
require 'rexml/document'
require 'rbconfig'
require 'opennebula'

STATE_DIR  = '/var/lib/one'
STATE_FILE = File.join(STATE_DIR, 'state.json')
LOCK_FILE  = File.join(STATE_DIR, 'state.lock')

CHECK_INTERVAL = 10
MAX_CHECKS     = 360

ERROR_PATTERNS = [
    /Command execution failed/i,
    /Command failed:/i,
    /\bresult FAILURE\b/i,
    /<ERROR>/i,
    /Error creating VM template/i,
    /No route to host/i,
    /Connection refused/i,
    /Connection timed out/i,
    /Broken pipe/i,
    /Permission denied/i,
    /No such file or directory/i,
    /Wrong restic datastore configuration/i,
    /No such snapshot/i,
    /Backup does not contain any disks/i,
    /Unable to pull disks/i,
    /Unable to remove snapshots/i,
    /unable to create lock in backend/i,
    /repository is already locked/i,
    /Fatal: unable to open config file/i,
    /cannot list backup contents/i,
    /\bFatal:\b/i,
    /\brsync error\b/i,
    /\brsync:\b/i,
    /Failed to execute datastore driver operation:\s+backup/i,
    /Failed to execute datastore driver operation:\s+restore/i,
    /\bBACKUP:\b/i,
    /\bRESTORE:\b/i
].freeze

def die(msg)
    warn msg
    exit 1
end

def one_client
    @one_client ||= OpenNebula::Client.new
end

def text_at(element, path)
    node = REXML::XPath.first(element, path)
    node&.text
end

def parse_call_info(xml_str)
    doc = REXML::Document.new(xml_str)

    result = text_at(doc, '//CALL_INFO/RESULT')
    vm_id = nil

    REXML::XPath.each(doc, '//CALL_INFO/PARAMETERS/PARAMETER') do |param|
        position = text_at(param, 'POSITION')
        type     = text_at(param, 'TYPE')
        value    = text_at(param, 'VALUE')

        if type == 'IN' && position == '2'
            vm_id = value
            break
        end
    end

    [vm_id, result]
end

def fetch_vm(vm_id)
    vm = OpenNebula::VirtualMachine.new_with_id(vm_id.to_i, one_client)
    rc = vm.info
    return if OpenNebula.is_error?(rc)

    vm
rescue StandardError
    nil
end

def fetch_vm_name(vm_id)
    vm = fetch_vm(vm_id)
    return 'unknown' unless vm

    vm['NAME'] || 'unknown'
end

def vm_states(vm_id)
    vm = fetch_vm(vm_id)
    return [nil, nil] unless vm

    state     = vm.state_str
    lcm_state = vm.lcm_state_str

    [state.to_s, lcm_state.to_s]
rescue StandardError
    [nil, nil]
end

def vm_log_path(vm_id)
    "/var/log/one/#{vm_id}.log"
end

def current_log_offset(vm_id)
    path = vm_log_path(vm_id)
    return 0 unless File.exist?(path)

    File.size(path)
rescue StandardError
    0
end

def read_log_delta(vm_id, offset)
    path = vm_log_path(vm_id)
    return '' unless File.exist?(path)

    File.open(path, 'rb') do |f|
        size = f.size
        return '' if offset >= size

        f.seek(offset)
        f.read.to_s
    end
rescue StandardError
    ''
end

def running_states_for(event)
    case event
    when 'backup'
        ['BACKUP', 'BACKUP_POWEROFF']
    when 'restore'
        ['RESTORE']
    else
        []
    end
end

def operation_running_now?(event, lcm_state)
    running_states_for(event).include?(lcm_state.to_s)
end

def with_locked_state
    FileUtils.mkdir_p(STATE_DIR)
    File.write(LOCK_FILE, '') unless File.exist?(LOCK_FILE)

    File.open(LOCK_FILE, 'r+') do |lock|
        lock.flock(File::LOCK_EX)

        state =
            if File.exist?(STATE_FILE) && !File.empty?(STATE_FILE)
                JSON.parse(File.read(STATE_FILE))
            else
                {}
            end

        yield state

        tmp_file = "#{STATE_FILE}.tmp"
        File.write(tmp_file, JSON.pretty_generate(state))
        File.rename(tmp_file, STATE_FILE)
    end
end

def ensure_vm_entry(state, vm_id, vm_name)
    state[vm_id] ||= {
        'vm_id' => vm_id,
      'vm_name' => vm_name
    }

    state[vm_id]['vm_id']   = vm_id
    state[vm_id]['vm_name'] = vm_name
end

def mark_running(vm_id, vm_name, event, attrs)
    with_locked_state do |state|
        ensure_vm_entry(state, vm_id, vm_name)

        state[vm_id]["#{event}_in_progress"] = 1
        state[vm_id]["#{event}_started_ts"]  = attrs[:started_ts]
        state[vm_id]["#{event}_log_offset"]  = attrs[:log_offset]
        state[vm_id]["#{event}_watcher_pid"] = attrs[:pid]
    end
end

def mark_finished(vm_id, vm_name, event, status_value, error_text = nil)
    with_locked_state do |state|
        ensure_vm_entry(state, vm_id, vm_name)

        state[vm_id]["#{event}_in_progress"] = 0
        state[vm_id]["#{event}_status"]      = status_value
        state[vm_id]["#{event}_ts"]          = Time.now.to_i

        if status_value == 1
            state[vm_id].delete("#{event}_error")
        else
            state[vm_id]["#{event}_error"] = error_text.to_s
        end

        state[vm_id].delete("#{event}_started_ts")
        state[vm_id].delete("#{event}_log_offset")
        state[vm_id].delete("#{event}_watcher_pid")
    end
end

def spawn_watcher(vm_id, vm_name, event, started_ts, log_offset)
    pid = Process.spawn(
        RbConfig.ruby, __FILE__, 'watch',
        vm_id.to_s,
        vm_name.to_s,
        event.to_s,
        started_ts.to_s,
        log_offset.to_s,
        :out => '/dev/null',
        :err => '/dev/null'
    )

    Process.detach(pid)
    pid
end

def find_error_line(text)
    text.each_line.find do |line|
        ERROR_PATTERNS.any? {|re| line.match?(re) }
    end
end

def run_watcher(vm_id, vm_name, event, _started_ts, log_offset)
    seen_running = false

    MAX_CHECKS.times do
        _state, lcm_state = vm_states(vm_id)

        if operation_running_now?(event, lcm_state)
            seen_running = true
            sleep CHECK_INTERVAL
            next
        end

        unless seen_running
            sleep CHECK_INTERVAL
            next
        end

        sleep 2

        log_delta = read_log_delta(vm_id, log_offset)
        error_line = find_error_line(log_delta)

        if error_line
            mark_finished(vm_id, vm_name, event, 0, error_line.strip)
        else
            mark_finished(vm_id, vm_name, event, 1, nil)
        end

        return
    end

    mark_finished(vm_id, vm_name, event, 0, 'timeout')
end

def run_hook_mode
    raw_input = STDIN.read.to_s.strip
    die 'Empty stdin payload' if raw_input.empty?

    match = raw_input.match(/\A(.+)\s+(backup|restore)\z/m)
    die 'Invalid stdin payload format' unless match

    payload_b64 = match[1]
    event       = match[2]

    decoded_xml =
        begin
            Base64.decode64(payload_b64)
        rescue StandardError => e
            die "Failed to decode base64 payload: #{e}"
        end

    vm_id, result = parse_call_info(decoded_xml)
    die 'Failed to parse VM_ID from hook payload' if vm_id.nil? || vm_id.empty?

    vm_name = fetch_vm_name(vm_id)
    api_ok  = (result == '1')

    unless api_ok
        mark_finished(vm_id, vm_name, event, 0, 'api call failed')
        return
    end

    started_ts = Time.now.to_i
    log_offset = current_log_offset(vm_id)

    pid = spawn_watcher(vm_id, vm_name, event, started_ts, log_offset)
    mark_running(
        vm_id,
        vm_name,
        event,
        {
            :started_ts => started_ts,
            :log_offset => log_offset,
            :pid        => pid
        }
    )
end

def run_watch_mode
    vm_id      = ARGV[1]
    vm_name    = ARGV[2]
    event      = ARGV[3]
    started_ts = ARGV[4].to_i
    log_offset = ARGV[5].to_i

    unless vm_id && vm_name && ['backup', 'restore'].include?(event)
        die 'Usage: watch <vm_id> <vm_name> <backup|restore> <started_ts> ' \
            '<log_offset>'
    end
    run_watcher(vm_id, vm_name, event, started_ts, log_offset)
end

if ARGV[0] == 'watch'
    run_watch_mode
else
    run_hook_mode
end
