require 'OneMonitorClientUtils'

class OneMonitorClient

    INPUT_METHOD="CSV"
    case INPUT_METHOD
    when "CSV" then include OneMonitorCSVClient
    end

    def initialize(ids, log_file_folder)
        #create filenames to read
        ids = [ids] unless ids.class == Array
        @file_names = {}
        ids.each do | id |
            @file_names[id] = OneMonitorClient.full_path(log_file_folder,id)
        end
        return @file_names
    end

    def get_multiple_data(columns,length)
        result = []
        @file_names.each do | id,file_name |
            result << get_data_for_id(id,columns,length)
        end
        return result
    end

    def get_data_for_id(id, columns, length)
        readOneMonitorFile(@file_names[id],columns,length)
    end

    def self.full_path(folder,id)
        "#{folder}/#{id}"
    end
end
