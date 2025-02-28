/* -------------------------------------------------------------------------- */
/* Copyright 2002-2025, OpenNebula Project, OpenNebula Systems                */
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

#ifndef PLAN_H_
#define PLAN_H_

#include <string>
#include <libxml/tree.h>

class ActionXML
{
public:
    ActionXML(xmlNodePtr root)
    {
        action = xmlNewChild(root, NULL, BAD_CAST "ACTION", NULL);
    }

    ActionXML(xmlNodePtr root, int vid, int hid, int did): ActionXML(root)
    {
        add(action, "VM_ID",   vid);
        add(action, "HOST_ID", hid);
        add(action, "DS_ID",   did);
    }

    ~ActionXML() = default;

    void migrate()
    {
        add(action, "OPERATION", "migrate");
    }

    void deploy()
    {
        add(action, "OPERATION", "deploy");
    }

    void add_nic(int nid, int vnid)
    {
        xmlNodePtr nic = xmlNewChild(action, NULL, BAD_CAST "NIC", NULL);

        add(nic, "NIC_ID", nid);

        add(nic, "NETWORK_ID", vnid);
    }

private:
    static void add(xmlNodePtr elem, const char * name, const char *val)
    {
        xmlNewChild(elem, NULL, BAD_CAST name, BAD_CAST val);
    }

    static void add(xmlNodePtr elem, const char * name, int val)
    {
        add(elem, name, std::to_string(val).c_str());
    }

    xmlNodePtr action;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class PlanXML
{
public:
    PlanXML(const std::string& id = "-1")
    {
        doc  = xmlNewDoc(BAD_CAST "1.0");
        root = xmlNewNode(NULL, BAD_CAST "PLAN");

        xmlDocSetRootElement(doc, root);

        xmlNewChild(root, NULL, BAD_CAST "ID", BAD_CAST id.c_str());
    };

    ~PlanXML()
    {
        xmlFreeDoc(doc);
    };

    void write()
    {
        xmlSaveFormatFileEnc("-", doc, "UTF-8", 1);
    }

    ActionXML add_action(int vid, int hid, int did)
    {
        return ActionXML(root, vid, hid, did);
    }

private:
    xmlDocPtr  doc;
    xmlNodePtr root;
};

#endif /*PLAN_H_*/
