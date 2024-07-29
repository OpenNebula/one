/*******************************************************************************
 * Copyright 2002-2024, OpenNebula Project, OpenNebula Systems
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 ******************************************************************************/
package org.opennebula.client.acl;


import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

import org.opennebula.client.Client;
import org.opennebula.client.OneResponse;
import org.opennebula.client.PoolElement;
import org.w3c.dom.Node;

/**
 * This class represents an OpenNebula ACL rule.
 * It also offers static XML-RPC call wrappers.
 * <br>
 * There is not a public constructor, because the information for an individual
 * ACL rule cannot be retrieved from OpenNebula.
 * <br>
 * Instead, Acl objects should be obtained using AclPool.getById, after the
 * info method has been called.
 *
 * @see AclPool#getById
 */
public class Acl extends PoolElement{

    private static final String METHOD_PREFIX   = "acl.";
    private static final String ADDRULE         = METHOD_PREFIX + "addrule";
    private static final String DELRULE         = METHOD_PREFIX + "delrule";

    private static final Map<String, Long> USERS;
    private static final Map<String, Long> RESOURCES;
    private static final Map<String, Long> RIGHTS;

    static {
        HashMap<String, Long> tmpUsers = new HashMap<String, Long>();
        tmpUsers.put("#", 0x0000000100000000L);
        tmpUsers.put("@", 0x0000000200000000L);
        tmpUsers.put("*", 0x0000000400000000L);
        tmpUsers.put("%", 0x0000000800000000L);

        USERS = Collections.unmodifiableMap(tmpUsers);

        HashMap<String, Long> tmpResources = new HashMap<String, Long>();

        tmpResources.put("VM"       , 0x0000001000000000L);
        tmpResources.put("HOST"     , 0x0000002000000000L);
        tmpResources.put("NET"      , 0x0000004000000000L);
        tmpResources.put("IMAGE"    , 0x0000008000000000L);
        tmpResources.put("USER"     , 0x0000010000000000L);
        tmpResources.put("TEMPLATE" , 0x0000020000000000L);
        tmpResources.put("GROUP"    , 0x0000040000000000L);
        tmpResources.put("DATASTORE", 0x0000100000000000L);
        tmpResources.put("CLUSTER"  , 0x0000200000000000L);
        tmpResources.put("DOCUMENT" , 0x0000400000000000L);
        tmpResources.put("ZONE"     , 0x0000800000000000L);
        tmpResources.put("SECGROUP" , 0x0001000000000000L);
        tmpResources.put("VDC"      , 0x0002000000000000L);
        tmpResources.put("VROUTER"  , 0x0004000000000000L);
        tmpResources.put("MARKETPLACE",    0x0008000000000000L);
        tmpResources.put("MARKETPLACEAPP", 0x0010000000000000L);
        tmpResources.put("VMGROUP",        0x0020000000000000L);
        tmpResources.put("VNTEMPLATE",     0x0040000000000000L);

        RESOURCES = Collections.unmodifiableMap(tmpResources);

        HashMap<String, Long> tmpRights = new HashMap<String, Long>();

        tmpRights.put("USE"     , 0x1L);
        tmpRights.put("MANAGE"  , 0x2L);
        tmpRights.put("ADMIN"   , 0x4L);
        tmpRights.put("CREATE"  , 0x8L);

        RIGHTS = Collections.unmodifiableMap(tmpRights);
    }

    /**
     * @see PoolElement
     */
    protected Acl(Node xmlElement, Client client)
    {
        super(xmlElement, client);
    }

    // =================================
    // Static XML-RPC methods
    // =================================

    /**
     * Allocates a new ACl rule in OpenNebula
     *
     * @param client XML-RPC Client.
     * @param user A string containing a hex number, e.g. 0x100000001
     * @param resource A string containing a hex number, e.g. 0x2100000001
     * @param rights A string containing a hex number, e.g. 0x10
     * @return If successful the message contains the associated
     * id generated for this rule.
     */
    public static OneResponse allocate(Client client, String user,
            String resource, String rights)
    {
        return client.call(ADDRULE, user, resource, rights);
    }

    /**
     * Allocates a new ACl rule in OpenNebula
     *
     * @param client XML-RPC Client.
     * @param user A string containing a hex number, e.g. 0x100000001
     * @param resource A string containing a hex number, e.g. 0x2100000001
     * @param rights A string containing a hex number, e.g. 0x10
     * @param zone A string containing a hex number, e.g. 0x10
     * @return If successful the message contains the associated
     * id generated for this rule.
     */
    public static OneResponse allocate(Client client, String user,
            String resource, String rights, String zone)
    {
        return client.call(ADDRULE, user, resource, rights, zone);
    }

    /**
     * Allocates a new ACl rule in OpenNebula
     *
     * @param client XML-RPC Client.
     * @param user 64b encoded user
     * @param resource 64b encoded user
     * @param rights 64b encoded user
     * @return If successful the message contains the associated
     * id generated for this rule.
     */
    public static OneResponse allocate(Client client, long user, long resource,
            long rights)
    {
        return allocate(client,
                Long.toHexString(user),
                Long.toHexString(resource),
                Long.toHexString(rights));
    }

    /**
     * Allocates a new ACl rule in OpenNebula
     *
     * @param client XML-RPC Client.
     * @param user 64b encoded user
     * @param resource 64b encoded
     * @param rights 64b encoded
     * @param zone 64b encoded
     * @return If successful the message contains the associated
     * id generated for this rule.
     */
    public static OneResponse allocate(Client client, long user, long resource,
            long rights, long zone)
    {
        return allocate(client,
                Long.toHexString(user),
                Long.toHexString(resource),
                Long.toHexString(rights),
                Long.toHexString(zone));
    }

    /**
     * Allocates a new ACl rule in OpenNebula
     *
     * @param client XML-RPC Client.
     * @param rule a rule string, e.g. "#5 HOST+VM/@12 INFO+CREATE+DELETE"
     * @return If successful the message contains the associated
     * id generated for this rule.
     * @throws RuleParseException If the rule syntax is wrong.
     */
    public static OneResponse allocate(Client client, String rule)
            throws RuleParseException
    {
        String[] components = parseRule(rule);

        if (components.length > 3)
        {
            return allocate(client, components[0], components[1],
                components[2], components[3]);
        }
        else
        {
            return allocate(client, components[0], components[1], components[2]);
        }
    }

    /**
     * Deletes an ACL rule from OpenNebula.
     *
     * @param client XML-RPC Client.
     * @param id The ACL rule id.
     * @return A encapsulated response.
     */
    public static OneResponse delete(Client client, int id)
    {
        return client.call(DELRULE, id);
    }

    // =================================
    // Instanced object XML-RPC methods
    // =================================

    /**
     * Deletes the ACL rule from OpenNebula.
     *
     * @see Acl#delete(Client, int)
     */
    public OneResponse delete()
    {
        return delete(client, id);
    }

    // =================================
    // Helpers
    // =================================

    public long user()
    {
        long ret = 0;

        try
        {
            ret = Long.parseLong( xpath("USER"), 16 );
        }
        catch (NumberFormatException e)
        {}

        return ret;
    }

    public long resource()
    {
        long ret = 0;

        try
        {
            ret = Long.parseLong( xpath("RESOURCE"), 16 );
        }
        catch (NumberFormatException e)
        {}

        return ret;
    }

    public long rights()
    {
        long ret = 0;

        try
        {
            ret = Long.parseLong( xpath("RIGHTS"), 16 );
        }
        catch (NumberFormatException e)
        {}

        return ret;
    }

    public long zone()
    {
        long ret = 0;

        try
        {
            ret = Long.parseLong( xpath("ZONE"), 16 );
        }
        catch (NumberFormatException e)
        {}

        return ret;
    }

    public String toString()
    {
        String st = xpath("STRING");

        if( st == null )
        {
            st = "";
        }

        return st;
    }

    // =================================
    // Rule parsing
    // =================================

    /**
     * Parses a rule string, e.g. "#5 HOST+VM/@12 INFO+CREATE+DELETE"
     *
     * @param rule an ACL rule in string format
     * @return an Array containing 4 Strings (hex 64b numbers). 3 if the rule
     * does not have the zone component, for compatibility
     * @throws RuleParseException If the rule syntax is wrong.
     */
    public static String[] parseRule(String rule) throws RuleParseException
    {
        String [] components = rule.split(" ");

        if( components.length != 3 && components.length != 4 )
        {
            throw new RuleParseException(
                    "String needs three components: User, Resource, Rights");
        }

        String [] ret = new String[components.length];

        ret[0] = parseUsers(components[0]);
        ret[1] = parseResources(components[1]);
        ret[2] = parseRights(components[2]);

        if(components.length > 3)
        {
            ret[3] = parseZone(components[3]);
        }

        return ret;
    }

    /**
     * Converts a string in the form [#<id>, @<id>, *] to a hex. number
     *
     * @param users Users component string
     * @return A string containing a hex number
     */
    private static String parseUsers(String users) throws RuleParseException
    {
        return Long.toHexString( calculateIds(users) );
    }

    /**
     * Converts a resources string to a hex. number
     *
     * @param resources Resources component string
     * @return A string containing a hex number
     */
    private static String parseResources(String resources)
            throws RuleParseException
    {
        long ret = 0;
        String[] resourcesComponents = resources.split("/");

        if( resourcesComponents.length != 2 )
        {
            throw new RuleParseException("Resource '"+resources+"' malformed");
        }

        for( String resource : resourcesComponents[0].split("\\+") )
        {
            resource = resource.toUpperCase();

            if( !RESOURCES.containsKey(resource) )
            {
                throw new RuleParseException("Resource '" + resource
                        + "' does not exist");
            }

            ret += RESOURCES.get(resource);
        }

        ret += calculateIds(resourcesComponents[1]);

        return Long.toHexString(ret);
    }

    /**
     * Converts a rights string to a hex. number
     *
     * @param rights Rights component string
     * @return A string containing a hex number
     */
    private static String parseRights(String rights) throws RuleParseException
    {
        long ret = 0;


        for( String right : rights.split("\\+") )
        {
            right = right.toUpperCase();

            if( !RIGHTS.containsKey(right) )
            {
                throw new RuleParseException("Right '" + right
                        + "' does not exist");
            }

            ret = ret | RIGHTS.get(right);
        }

        return Long.toHexString(ret);
    }

    /**
     * Converts a string in the form [#<id>, *] to a hex. number
     *
     * @param zone Zone component string
     * @return A string containing a hex number
     */
    private static String parseZone(String zone) throws RuleParseException
    {
        return Long.toHexString( calculateIds(zone) );
    }

    /**
     * Calculates the numeric value for a String containing an individual
     * (#id), group (@id) or all (*) ID component
     *
     * @param id Rule Id string
     * @return the numeric value for the given id_str
     */
    private static long calculateIds(String id) throws RuleParseException
    {
        if( !id.matches("^([#@%]\\d+|\\*)$") )
        {
            throw new RuleParseException("ID string '" + id + "' malformed");
        }

        long value = USERS.get( "" + id.charAt(0) );

        if( id.charAt(0) != '*' )
        {
            value += Long.parseLong( id.substring(1) );
        }

        return value;
    }
}
