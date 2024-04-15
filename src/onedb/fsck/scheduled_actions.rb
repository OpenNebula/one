# Scheduled Action module
module OneDBFsck

    # Check Scheduled Actions
    def check_scheduled_actions
        @to_delete = []
        @to_update = []
        @item = Struct.new(:id, :type)

        # Check Scheduled Actions owner object exists
        check_resource_exists('BACKUPJOB', 'backupjob_pool')
        check_resource_exists('VM', 'vm_pool')
        check_attributes
    end

    def check_resource_exists(resource_name, pool_name)
        # Query to select Scheduled Actions without owner
        query = 'SELECT oid FROM schedaction_pool ' \
                "WHERE type = '#{resource_name}' AND " \
                'NOT EXISTS (SELECT oid ' \
                "FROM #{pool_name} WHERE #{pool_name}.oid = schedaction_pool.parent_id "
        query += "AND #{pool_name}.state != 6" if resource_name == 'VM'
        query += ')'

        @db.fetch(query) do |row|
            log_error("Scheduled action #{row[:oid]} of object type #{resource_name}" \
                      ' does not have an owner', true)
            @to_delete << @item.new(row[:oid], resource_name)
        end
    end

    def check_attributes
        # Fix missing attributes in Scheduled Actions
        query = 'SELECT * FROM schedaction_pool;'

        @db.fetch(query) do |row|
            update = false
            doc = nokogiri_doc(row[:body], 'schedaction_pool')

            optional_args = { 'MESSAGE' => '',
                              'ARGS' => '',
                              'DONE' => -1,
                              'REPEAT' => -1,
                              'DAYS' => '',
                              'END_TYPE' => -1,
                              'END_VALUE' => -1 }

            optional_args.each do |att_name, default_value|
                att = doc.root.at_xpath(att_name)

                next unless att.nil?

                update = true

                log_error("Scheduled action #{row[:oid]} doesn't have '#{att_name}' attribute",
                          true)
                att = doc.create_element(att_name)
                doc.root.add_child(att).content = default_value
            end

            if update
                row[:body] = doc.root.to_s

                @to_update << row
            end
        end
    end

    # Fix broken Scheduled Actions
    def fix_scheduled_actions
        @db.transaction do
            # Remove hanging Scheduled Actions
            @to_delete.each do |o|
                @db[:schedaction_pool].where(:oid => o.id, :type => o.type).delete
            end

            # Fix missing attributes in Scheduled Actions
            @to_update.each do |row|
                @db[:schedaction_pool].where(:oid => row[:oid],
                                             :type => row[:type]).update(:body => row[:body])
            end
        end
    end

end
