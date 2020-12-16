# History module
module OneDBFsck

    # Check history records
    def check_history
        check_history_etime

        log_time

        check_history_opened
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
            log_error("History record for VM #{row[:vid]} seq # #{row[:seq]} " \
                      'is not closed (etime = 0)', false)
        end
    end

    # Check that etime is not 0 in DONE vms
    def check_history_opened
        history_fix = @fixes_history = []

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
                vm_doc = nokogiri_doc(vm_row[:body])
                etime  = vm_doc.root.at_xpath('ETIME').text.to_i
            end

            history_doc = nokogiri_doc(row[:body])

            %w[RETIME ESTIME EETIME ETIME].each do |att|
                elem = history_doc.root.at_xpath(att)

                elem.content = etime if elem.text == '0'
            end

            row[:body]  = history_doc.root.to_s
            row[:etime] = etime

            history_fix.push(row)
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
    end

end
