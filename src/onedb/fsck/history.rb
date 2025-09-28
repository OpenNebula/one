# History module
module OneDBFsck

    # Check history records
    def check_history
        @fixes_history = []
        @showback_delete = Set[]

        check_history_etime

        log_time

        check_history_opened

        log_time

        check_history_retime

        check_history_seq

        log_error('Removing possibly corrupted records from VM showback '\
            "please run 'oneshowback calculate` to recalculate "\
            'the showback') unless @showback_delete.empty?
    end

    # Check that etime from non last seq is 0
    def check_history_etime
        # DATA: check history etime

        # Bug #4000 may cause history records with etime=0 when they should
        # be closed. The last history can be fixed with the VM etime, but
        # previous history entries need to be fixed manually

        # Query to select history elements that:
        #   - have etime = 0
        #   - are not the last seq
        @db.fetch('SELECT vid,seq ' \
                  'FROM history ' \
                  'WHERE (etime = 0 AND seq <> ' \
                  '(SELECT MAX(seq) ' \
                  'FROM history AS subhistory ' \
                  'WHERE history.vid = subhistory.vid))') do |row|
            query = "SELECT * FROM history WHERE vid=#{row[:vid]} AND seq=#{row[:seq]}"

            etime = eetime = retime = 0

            @db.fetch(query) do |history|
                doc = nokogiri_doc(history[:body], 'history')

                etime =  doc.root.at_xpath('ETIME').text.to_i
                eetime = doc.root.at_xpath('EETIME').text.to_i
                retime = doc.root.at_xpath('RETIME').text.to_i

                etime = eetime if etime == 0 && eetime != 0
                etime = retime if etime == 0 && retime != 0

                if etime != 0
                    elem = doc.root.at_xpath('ETIME')

                    elem = doc.root.add_child('ETIME') if elem.nil?

                    elem.content = etime

                    history[:etime] = etime
                    history[:body]  = doc.root.to_s

                    @fixes_history.push(history)
                    @showback_delete.add(history[:vid])
                end
            end

            log_error("History record for VM #{row[:vid]} seq # #{row[:seq]} " \
                      'is not closed (etime = 0)', etime != 0)
        end
    end

    # Check that etime is not 0 in DONE vms
    def check_history_opened
        history_fix = @fixes_history

        # DATA: go through all bad history records (etime=0) and ask
        # DATA: new time values to fix them

        # Query to select history elements that have:
        #   - etime = 0
        #   - is last seq
        #   - VM is DONE
        @db.fetch('SELECT * ' \
                  'FROM history ' \
                  'WHERE (etime = 0 AND vid IN ' \
                  '(SELECT oid FROM vm_pool WHERE state=6) AND ' \
                  'seq = (SELECT MAX(seq) FROM history AS subhistory ' \
                  'WHERE history.vid=subhistory.vid))') do |row|
            log_error("History record for VM #{row[:vid]} seq # #{row[:seq]} " \
                      'is not closed (etime = 0), but the VM is in state DONE')

            etime = 0
            query = "SELECT body FROM vm_pool WHERE oid=#{row[:vid]}"

            @db.fetch(query) do |vm_row|
                vm_doc = nokogiri_doc(vm_row[:body], 'vm_pool')
                etime  = vm_doc.root.at_xpath('ETIME').text.to_i
            end

            history_doc = nokogiri_doc(row[:body], 'history')

            ['RETIME', 'ESTIME', 'EETIME', 'ETIME'].each do |att|
                elem = history_doc.root.at_xpath(att)

                elem.content = etime if elem.text == '0'
            end

            row[:body]  = history_doc.root.to_s
            row[:etime] = etime

            history_fix.push(row)
            @showback_delete.add(row[:vid])
        end
    end

    # Check that RETIME is 0 and ETIME is not 0
    def check_history_retime
        history_fix = @fixes_history

        # DATA: go through all history records with ETIME != 0
        # DATA: check if RETIME != 0

        @db.fetch('SELECT * ' \
                  'FROM history ' \
                  'WHERE etime > 0') do |row|
            history_doc = nokogiri_doc(row[:body], 'history')
            rstime  = history_doc.root.at_xpath('RSTIME')
            retime  = history_doc.root.at_xpath('RETIME')
            estime  = history_doc.root.at_xpath('ESTIME').text.to_i

            if rstime.text.to_i != 0 && retime.text.to_i == 0
                log_error("History for VM #{row[:vid]} seq # #{row[:seq]} "\
                    'is closed (etime != 0), but retime = 0')

                if estime != 0
                    retime.content = estime
                else
                    retime.content = row[:etime]
                end

                row[:body] = history_doc.root.to_s

                history_fix.push(row)
                @showback_delete.add(row[:vid])
            end
        end

        # Query to select history elements that have:
        #   - etime = 0
        #   - is last seq
        #   - VM is RUNNING
        # If RETIME != 0, change it to 0
        @db.fetch('SELECT * ' \
                  'FROM history ' \
                  'WHERE (etime = 0 AND vid IN ' \
                  '(SELECT oid FROM vm_pool WHERE state=3) AND ' \
                  'seq = (SELECT MAX(seq) FROM history AS subhistory ' \
                  'WHERE history.vid=subhistory.vid))') do |row|
            history_doc = nokogiri_doc(row[:body], 'history')
            retime = history_doc.root.at_xpath('RETIME')

            if retime.text.to_i != 0
                log_error("History for VM #{row[:vid]} seq # #{row[:seq]} "\
                    "has RETIME = #{retime.text}, but it's still running")

                retime.content = '0'

                row[:body] = history_doc.root.to_s

                history_fix.push(row)
                @showback_delete.add(row[:vid])
            end
        end
    end

    def check_history_seq
        @history_delete = {}

        # Query to select history elements with max seq
        @db.fetch('SELECT vid, MAX(seq) AS max_seq ' \
                  'FROM history ' \
                  'GROUP BY vid') do |row|
            # Skip iteration if VM doesn't have last seq, it should never happen
            last_seq = @vms_last_history[row[:vid]]
            next if last_seq.nil?

            if row[:max_seq] != last_seq
                log_error("VM #{row[:vid]} history last seq # #{last_seq} "\
                          "doesn't match last seq in DB # #{row[:max_seq]}")

                @history_delete[row[:vid]] = [last_seq + 1, row[:max_seq]]
            end
        end
    end

    # Fix the broken history records
    def fix_history
        # DATA: FIX: update history records with fixed data
        # DATA: TODO: check all fixes to always do the same (update vs rewrite)
        @db.transaction do
            @fixes_history.each do |row|
                @db[:history].where(:vid => row[:vid],
                                    :seq => row[:seq]).update(row)
            end
        end

        @db.transaction do
            @history_delete.each do |vid, seq|
                @db[:history].where(:vid => vid, :seq => seq[0]..seq[1]).delete
            end
        end

        @db.transaction do
            @showback_delete.each do |vid|
                @db[:vm_showback].where(:vmid => vid).delete
            end
        end
    end

end
