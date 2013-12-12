/* -------------------------------------------------------------------------- */
/* Copyright 2002-2013, OpenNebula Project (OpenNebula.org), C12G Labs        */
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


#include "ExternalLeases.h"
#include "Nebula.h"
#include <cerrno>
#include <cstring>

/* ************************************************************************** */
/* External Leases class                                                        */
/* ************************************************************************** */

ExternalLeases::ExternalLeases(
    SqlDB *        db,
    int           _oid,
    unsigned int  _mac_prefix,
    unsigned int  _global[],
    unsigned int  _site[],
    string        _external_command):
        Leases(db, _oid, 0, _mac_prefix, _global, _site),
        external_command(_external_command)
{
    //size = 0;
}

/* ************************************************************************** */
/* External Leases :: Methods                                                 */
/* ************************************************************************** */

int ExternalLeases::get(int vid, string&  ip, string&  mac, unsigned int eui64[])
{
    ostringstream debug;
    debug << "ExternalLeases::get(" << vid << ", " << ip << ", " << mac << ")";
    NebulaLog::log("VNM", Log::DEBUG, debug);

    int rc = -1;

    // generate mac address for this lease
    string str_mac_prefix = mac_prefix_to_string(mac_prefix);
    string str_mac = generateRandomMac(str_mac_prefix);
    unsigned int num_mac[2];
    Leases::Lease::mac_to_number(str_mac, num_mac);

    debug.str("");
    debug << "str_mac_prefix=" << str_mac_prefix << "str_mac=" << str_mac << ", num_mac=" << num_mac;
    NebulaLog::log("VNM", Log::DEBUG, debug);

    // get an ip for the generated mac address from the external command
    ostringstream command;
    command << external_command << " get " << str_mac;
    string cmd_output;
    string cmd_error;
    int cmd_rc = runCommand(command.str(), cmd_output, cmd_error);

    debug.str("");
    debug << "runCommand cmd_rc=" << cmd_rc << ", cmd_output=" << cmd_output << ", cmd_error=" << cmd_error;
    NebulaLog::log("VNM", Log::DEBUG, debug);

    if (cmd_rc != 0) {
        ostringstream oes;
        oes << "Failed running external command: " << command << ": " << cmd_error;
        NebulaLog::log("VNM", Log::ERROR, oes);
        return -1;
    }
    // TODO: sanitize/parse ip from command output
    string str_ip = cmd_output;
    unsigned int num_ip;
    Leases::Lease::ip_to_number(str_ip, num_ip);

    debug.str("");
    debug << "str_ip=" << str_ip << ", num_ip=" << num_ip;
    NebulaLog::log("VNM", Log::DEBUG, debug);

    if (check(num_ip) == false)
    {
        Leases::Lease::mac_to_eui64(num_mac, eui64);

        rc = add(num_ip,num_mac,vid);

        if (rc == 0)
        {
            Leases::Lease::ip_to_string(num_ip,ip);
            Leases::Lease::mac_to_string(num_mac,mac);
        }
    }

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int ExternalLeases::set(int vid, const string&  ip, string&  mac, unsigned int eui64[])
{
    unsigned int num_ip;
    unsigned int num_mac[2];
    int          rc;

    ostringstream debug;
    debug << "ExternalLeases::set(" << vid << ", " << ip << ", " << mac << ")";
    NebulaLog::log("VNM", Log::DEBUG, debug);

    rc = Leases::Lease::ip_to_number(ip,num_ip);

    if (rc != 0)
    {
        return -1;
    }

    if (check(num_ip) == true)
    {
        return -1;
    }

    num_mac[1] = mac_prefix;
    num_mac[0] = num_ip;

    Leases::Lease::mac_to_eui64(num_mac, eui64);

    rc = add(num_ip,num_mac,vid);

    if (rc != 0)
    {
        return -1;
    }

    Leases::Lease::mac_to_string(num_mac,mac);

    return 0;
}

void ExternalLeases::release(const string& ip)
{
    ostringstream debug;
    debug << "ExternalLeases::release(" << ip << ")";
    NebulaLog::log("VNM", Log::DEBUG, debug);

    ostringstream command;
    command << external_command << " release " << ip;
    string cmd_output;
    string cmd_error;
    int cmd_rc = runCommand(command.str(), cmd_output, cmd_error);

    if (cmd_rc != 0) {
        ostringstream oes;
        oes << "Failed running external command: " << command << ": " << cmd_error;
        NebulaLog::log("VNM", Log::ERROR, oes);
    }

    // delete lease from leases and database
    del(ip);
}



/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int ExternalLeases::add(
    unsigned int    ip,
    unsigned int    mac[],
    int             vid,
    bool            used)
{
    ostringstream debug;
    debug << "ExternalLeases::add(" << ip << ", " << mac << ", " << vid << ", " << used << ")";
    NebulaLog::log("VNM", Log::DEBUG, debug);

    ostringstream    oss;

    Lease *         lease;
    string          xml_body;
    char *          sql_xml;

    int rc;

    lease = new Lease(ip,mac,vid,used);

    sql_xml = db->escape_str(lease->to_xml_db(xml_body).c_str());

    if ( sql_xml == 0 )
    {
        goto error_body;
    }

    oss << "INSERT INTO " << table << " ("<< db_names <<") VALUES ("
        <<          oid     << ","
        <<          ip      << ","
        << "'" <<   sql_xml << "')";

    db->free_str(sql_xml);

    rc = db->exec(oss);

    if ( rc != 0 )
    {
        goto error_db;
    }

    leases.insert( make_pair(ip,lease) );

    n_used++;

    return rc;


error_body:
    oss.str("");
    oss << "Error inserting lease, marshall error";
    goto error_common;

error_db:
    oss.str("");
    oss << "Error inserting lease in database.";

error_common:
    NebulaLog::log("VNM", Log::ERROR, oss);
    return -1;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int  ExternalLeases::del(const string& ip)
{
    ostringstream debug;
    debug << "ExternalLeases::del(" << ip << ")";
    NebulaLog::log("VNM", Log::DEBUG, debug);

    unsigned int    _ip;
    ostringstream   oss;
    int             rc;
    map<unsigned int, Lease *>::iterator  it_ip;

    // Remove lease from leases map

    if ( Lease::ip_to_number(ip,_ip) )
    {
        return 0;
    }

    it_ip = leases.find(_ip);

    if (it_ip == leases.end())
    {
        return 0; //Not in the map, not leased
    }

    // Erase it from DB

    oss << "DELETE FROM " << table << " WHERE oid='" << oid
    << "' AND ip='" << _ip << "'";

    rc = db->exec(oss);

    if ( rc == 0 )
    {
        n_used--;

        delete it_ip->second;

        leases.erase(it_ip);
    }

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

string ExternalLeases::mac_prefix_to_string(int mac_prefix) {
    ostringstream oss;
    unsigned int temp_byte;
    for (int i=1; i>=0; i--) {
        temp_byte = mac_prefix;
        temp_byte >>= (i)*8;
        temp_byte &= 255;
        oss.width(2);
        oss.fill('0');
        oss << hex << temp_byte;
        if (i != 0) oss << ':';
    }
    return oss.str();
}

string ExternalLeases::generateRandomMac(string mac_prefix) {
    ostringstream oss;
    char delimiter = ':';
    int segment;
    int segments = 6;
    size_t prefix_segments = count(mac_prefix.begin(), mac_prefix.end(), delimiter) + 1;
    int missing_segments = segments - prefix_segments;

    srand(time(NULL));

    // start mac address with given prefix, then fill up with random segments
    oss << mac_prefix;
    for (int i=0; i<missing_segments && (segment=rand()%32) > -1; i++) {
        oss << delimiter;
        oss.width(2);
        oss.fill('0');
        oss << hex << segment;
    }
    return oss.str();
}

int ExternalLeases::runCommand(string cmd, string& output, string& error) {
    /*
    string output;
    int rc = getStdoutFromCommand("echo foobar", output);
    */
    ostringstream debug;
    debug << "ExternalLeases::runCommand(" << cmd << ")";
    NebulaLog::log("VNM", Log::DEBUG, debug);

    int rc;
    FILE *stream;
    int MAX_BUFFER = 256;
    char buffer[MAX_BUFFER];
    cmd.append(" 2>&1");
    stream = popen(cmd.c_str(), "r");
    if (!stream){
        error.append(strerror(errno));
        return -1;
    }
    while (fgets(buffer, MAX_BUFFER, stream) != NULL) {
        output.append(buffer);
    }
    if (ferror(stream)) {
        // Handle error.
        return -1;
    }
    rc = pclose(stream);
    return rc;
}
