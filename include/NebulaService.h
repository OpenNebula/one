/* -------------------------------------------------------------------------- */
/* Copyright 2002-2023, OpenNebula Project, OpenNebula Systems                */
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

#ifndef NEBULA_SERVICE_H_
#define NEBULA_SERVICE_H_

#include "NebulaTemplate.h"
#include "NebulaLog.h"
#include <assert.h>
#include <memory>

/**
 *  This is the base class for the OpenNebula daemon. It provides access to
 *  configuration and basic services. Only one instance of NebulaService
 *  can exists.
 */
class NebulaService
{
public:

    static NebulaService& instance()
    {
        assert(nebula_service);

        return *nebula_service;
    };

    // --------------------------------------------------------------
    // Environment & Configuration
    // --------------------------------------------------------------

    /**
     *  Returns the value of LOG->DEBUG_LEVEL in config file
     *   @param default_ value returned if level not found in config
     *   @return the debug level, to instantiate Log'ers
     */
    Log::MessageType get_debug_level(
        Log::MessageType default_ = Log::ERROR) const;

    /**
     *  Returns the value of LOG->SYSTEM in oned.conf file
     *      @return the logging system CERR, FILE_TS or SYSLOG
     */
    NebulaLog::LogType get_log_system(
        NebulaLog::LogType default_ = NebulaLog::UNDEFINED) const;

    /**
     *  Returns the value of ONE_LOCATION env variable. When this variable is
     *  not defined the nebula location is "/".
     *      @return the nebula location.
     */
    const std::string& get_nebula_location() const
    {
        return nebula_location;
    };

    /**
     *  Returns the path where mad executables are stored, if ONE_LOCATION is
     *  defined this path points to $ONE_LOCATION/bin, otherwise it is
     *  /usr/lib/one/mads.
     *      @return the mad execs location.
     */
    const std::string& get_mad_location() const
    {
        return mad_location;
    };

    /**
     *  Returns the path where defaults for mads are stored, if ONE_LOCATION is
     *  defined this path points to $ONE_LOCATION/etc, otherwise it is /etc/one
     *      @return the mad defaults location.
     */
    const std::string& get_defaults_location() const
    {
        return etc_location;
    };

    /**
     *  Returns the path where logs (oned.log, schedd.log,...) are generated
     *  if ONE_LOCATION is defined this path points to $ONE_LOCATION/var,
     *  otherwise it is /var/log/one.
     *      @return the log location.
     */
    const std::string& get_log_location() const
    {
        return log_location;
    };

    /**
     *  Returns the default var location. When ONE_LOCATION is defined this path
     *  points to $ONE_LOCATION/var, otherwise it is /var/lib/one.
     *      @return the log location.
     */
    const std::string& get_var_location() const
    {
        return var_location;
    };

    /**
     *  Returns the default share location. When ONE_LOCATION is defined this path
     *  points to $ONE_LOCATION/share, otherwise it is /usr/share/one.
     *      @return the log location.
     */
    const std::string& get_share_location() const
    {
        return share_location;
    };

    /**
     *  Returns the default vms location. When ONE_LOCATION is defined this path
     *  points to $ONE_LOCATION/var/vms, otherwise it is /var/lib/one/vms. This
     *  location stores vm related files: deployment, transfer, context, and
     *  logs (in self-contained mode only)
     *      @return the vms location.
     */
    const std::string& get_vms_location() const
    {
        return vms_location;
    };

    /**
     *  Returns the version of oned
     *    @return the version
     */
    static std::string version()
    {
       std::ostringstream os;
       os << "OpenNebula " << code_version();
       os << " (" << GITVERSION << ")";

       return os.str();
    };

    /**
     *  Returns the version of oned
     * @return
     */
    static std::string code_version()
    {
        return "6.99.80"; // bump version
    }

    /**
     * Version needed for the DB, shared tables
     * @return
     */
    static std::string shared_db_version()
    {
        return "6.8.0";
    }

    /**
     * Version needed for the DB, local tables
     * @return
     */
    static std::string local_db_version()
    {
        return "6.8.0";
    }

    /**
     *  Gets an XML document with all of the configuration attributes
     *    @return the XML
     */
    std::string get_configuration_xml() const
    {
        std::string xml;
        return config->to_xml(xml);
    };

protected:

    // -----------------------------------------------------------------------
    //Constructors and = are private to only access the class through instance
    // -----------------------------------------------------------------------

    NebulaService()
    {
        assert(!nebula_service && "Trying to create second NebulaServcie");
        nebula_service = this;

        const char * nl = getenv("ONE_LOCATION");

        if (nl == 0) //OpenNebula installed under root directory
        {
            nebula_location = "/";

            mad_location     = "/usr/lib/one/mads/";
            etc_location     = "/etc/one/";
            log_location     = "/var/log/one/";
            var_location     = "/var/lib/one/";
            remotes_location = "/var/lib/one/remotes/";
            vms_location     = "/var/lib/one/vms/";
            share_location   = "/usr/share/one";
        }
        else
        {
            nebula_location = nl;

            if ( nebula_location.at(nebula_location.size()-1) != '/' )
            {
                nebula_location += "/";
            }

            mad_location     = nebula_location + "lib/mads/";
            etc_location     = nebula_location + "etc/";
            log_location     = nebula_location + "var/";
            var_location     = nebula_location + "var/";
            remotes_location = nebula_location + "var/remotes/";
            vms_location     = nebula_location + "var/vms/";
            share_location   = nebula_location + "share/";
        }
    };

    virtual ~NebulaService()
    {
        nebula_service = nullptr;
    };

    std::unique_ptr<NebulaTemplate> config;

    // ---------------------------------------------------------------
    // Environment variables
    // ---------------------------------------------------------------

    std::string  nebula_location;

    std::string  mad_location;
    std::string  etc_location;
    std::string  log_location;
    std::string  var_location;
    std::string  remotes_location;
    std::string  vms_location;
    std::string  share_location;

private:
    static NebulaService* nebula_service;
};

#endif /*NEBULA_SERVICE_H_*/
