/* -------------------------------------------------------------------------- */
/* Copyright 2002-2010, OpenNebula Project Leads (OpenNebula.org)             */
/*                                                                            */
/* Licensed under the Apache License, Version 2.0 (the "License"); you may    */
/* not use this file except in compliance with the License. You may obtain    */
/* a copy of the License at                                                   */
/*                                                                            */
/* http://www.apache.org/licenses/LICENSE-2.0                                 */
/*                                                                            */
/* Unless required by applicable law or agreed to in writing, software        */
/* distributed under the License is distributed on an "AS IS" BASIS,          */
/* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.   */
/* See the License for the specific language governing permissions and        */
/* limitations under the License.                                             */
/* -------------------------------------------------------------------------- */

#include "LifeCycleManagerTest.h"

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void show_options ()
{
    cout << "Options:\n";
    cout << "    -h  --help         Show this help\n"
            "    -s  --sqlite       Run Sqlite tests (default)\n"
            "    -m  --mysql        Run MySQL tests\n"
            "    -l  --log          Keep the log file, test.log\n";
};


int main(int argc, char ** argv)
{
    // Option flags
    bool sqlite_flag = true;
    bool log_flag    = false;

    // Long options
    const struct option long_opt[] =
    {
        { "sqlite", 0,  NULL,   's'},
        { "mysql",  0,  NULL,   'm'},
        { "log",    0,  NULL,   'l'},
        { "help",   0,  NULL,   'h'}
    };

    int c;
    while ((c = getopt_long (argc, argv, "smlh", long_opt, NULL)) != -1)
        switch (c)
        {
            case 'm':
                sqlite_flag = false;
                break;
            case 'l':
                log_flag = true;
                break;
            case 'h':
                show_options();
                return 0;
        }

    // We need to set the log file, otherwise it will end in a dead-lock
    NebulaLog::init_log_system(NebulaLog::FILE, Log::DEBUG, "test.log");
    NebulaLog::log("Test", Log::INFO, "Test started");


    CppUnit::TextUi::TestRunner runner;

    SETUP_XML_WRITER(runner, "output.xml")

    runner.addTest( LifeCycleManagerTest::suite() );

    if (sqlite_flag)
    {
        NebulaTest::instance().setMysql(false);
        NebulaLog::log("Test", Log::INFO, "Running Sqlite tests...");
        cout << "\nRunning Sqlite tests...\n";
    }
    else
    {
        NebulaTest::instance().setMysql(true);
        NebulaLog::log("Test", Log::INFO, "Running MySQL tests...");
        cout << "\nRunning MySQL tests...\n";
    }

    runner.run();

    END_XML_WRITER

    if (!log_flag)
        remove("test.log");

    NebulaLog::finalize_log_system();

    return 0;
}