# Scheduled Action module
module OneDBFsck

    # Check Scheduled Actions
    def check_scheduled_actions
        @to_delete = []
        @item = Struct.new(:id, :type)

        # Check Scheduled Actions owner object exists
        check_resource_exists('BACKUPJOB', 'backupjob_pool')
        check_resource_exists('VM', 'vm_pool')
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

    # Fix broken Scheduled Actions
    def fix_scheduled_actions
        @db.transaction do
            # Removing hanging Scheduled Actions
            @to_delete.each do |o|
                @db[:schedaction_pool].where(:oid => o.id, :type => o.type).delete
            end
        end
    end

end
