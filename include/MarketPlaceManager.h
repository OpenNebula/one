/* -------------------------------------------------------------------------- */
/* Copyright 2002-2024, OpenNebula Project, OpenNebula Systems                */
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

#ifndef MARKETPLACE_MANAGER_H_
#define MARKETPLACE_MANAGER_H_

#include "ProtocolMessages.h"
#include "DriverManager.h"
#include "Listener.h"

#include <atomic>

class MarketPlacePool;
class MarketPlaceAppPool;
class ImagePool;
class DatastorePool;

class ImageManager;
class RaftManager;

class MarketPlaceManager : public DriverManager<Driver<market_msg_t>>
{
public:

    /**
     *  Inititalizes the Marketplace manager:
     *    @param t, timer_period to wake up the manger to perform actions
     *    @param m, monitor_period to monitor marketplaces
     *    @param mad, list of drivers for the manager
     */
    MarketPlaceManager(time_t t, time_t m, const std::string& _mad_location);

    ~MarketPlaceManager() = default;

    /**
     * Initializes internal pointers to other managers. Must be called when
     * all the other managers exist in Nebula::instance
     */
    void init_managers();

    /**
     *  This functions starts the associated timer thread and drivers.
     *    @return 0 on success.
     */
    int start();

    /**
     *  Stops timer and drivers
     */
    void finalize()
    {
        terminate = true;

        timer_thread.stop();

        DriverManager::stop(drivers_timeout);
    };

    /**
     *  Loads the MarketPlace Driver defined in configuration file
     *   @param _mads configuration of drivers
     */
    int load_drivers(const std::vector<const VectorAttribute*>& _mads);

    /**
     *  Imports a new app into the marketplace. The marketplace app needs to
     *  include the ORIGIN_ID attribute so the driver can locate the app. An
     *  optional template maybe provided to export the app to a cloud.
     *    @param appid of the app
     *    @param market_data of the associated marketplace in XML format
     *    @param error descrition
     *
     *    @return 0 on success
     */
    int import_app(int appid, const std::string& market_data, std::string& err);

    /**
     *  Exports the app to this cloud. If an APPTEMPLATE64 is provided associated
     *  objects can also be created.
     *    @param appid of the app
     *    @param market_data of the associated marketplace in XML format
     *    @param error descrition
     *
     *    @return 0 on success
     */
    int export_app(int appid, const std::string& market_data, std::string& err);

    /**
     *  Deletes an app from the marketplace.
     *    @param appid of the app
     *    @param market_data of the associated marketplace in XML format
     *    @param error descrition
     *
     *    @return 0 on success
     */
    int delete_app(int appid, const std::string& market_data, std::string& err);

    /**
     *  Trigger a monitor action for the marketplace .
     *    @param ds_id id of the datastore to monitor
     */
    void monitor_market(int ds_id);

    /**
     *  Relsease resources locked by this app during the import phase
     *    @param appid of the app
     */
    void release_app_resources(int appid);

private:
    /**
     *  Generic name for the marketplace driver
     */
    static const char *  market_driver_name;

    /**
     *  Timer action async execution
     */
    Timer                 timer_thread;

    /**
     *  Timer period for the Image Manager.
     */
    time_t                timer_period;

    /**
     *  Marketplace monitor interval
     */
    time_t                monitor_period;

    /**
     *  Pointer to the marketplace pool
     */
    MarketPlacePool *     mppool = nullptr;

    /**
     *  Pointer to the app pool
     */
    MarketPlaceAppPool * apppool = nullptr;

    /**
     *  Pointer to the image pool
     */
    ImagePool *          ipool = nullptr;

    /**
     * Pointer to the image pool
     */
    DatastorePool *      dspool = nullptr;

    /**
     *  Pointer to the Image Manger
     */
    ImageManager *       imagem = nullptr;

    /**
     *  Pointer to the Raft Manger
     */
    RaftManager *        raftm = nullptr;

    /**
     *  Manager is terminating, do not execute any action
     */
    std::atomic<bool>    terminate{false};

    /**
     *  Returns a pointer to the marketplace driver.
     *    @return the marketplace manager driver or 0 in not found
     */
    const Driver<market_msg_t> * get() const
    {
        return DriverManager::get_driver(market_driver_name);
    }

    /**
     * Formats an XML message for the MAD
     *
     *    @param app_data marketplace app XML representation
     *    @param market_data marketplace XML representation
     *    @param extra_data additional XML formatted data for the driver
     *
     *    @return the XML message
     */
    static std::string format_message(
            const std::string& app_data,
            const std::string& market_data,
            const std::string& extra_data);

    // -------------------------------------------------------------------------
    // Protocol implementation, procesing messages from driver
    // -------------------------------------------------------------------------
    static void _undefined(std::unique_ptr<market_msg_t> msg);
    void _import(std::unique_ptr<market_msg_t> msg);
    void _delete(std::unique_ptr<market_msg_t> msg);
    void _monitor(std::unique_ptr<market_msg_t> msg);
    static void _log(std::unique_ptr<market_msg_t> msg);

    // -------------------------------------------------------------------------
    // Action Listener interface
    // -------------------------------------------------------------------------
    /**
     *  This function is executed periodically to monitor marketplaces..
     */
    void timer_action();

    static const int drivers_timeout = 10;
};

#endif /*MARKETPLACE_MANAGER_H*/

