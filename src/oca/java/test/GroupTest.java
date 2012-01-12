/*******************************************************************************
 * Copyright 2002-2012, OpenNebula Project Leads (OpenNebula.org)
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
import static org.junit.Assert.assertTrue;

import org.junit.After;
import org.junit.AfterClass;
import org.junit.Before;
import org.junit.BeforeClass;
import org.junit.Test;
import org.opennebula.client.Client;
import org.opennebula.client.OneResponse;
import org.opennebula.client.group.Group;
import org.opennebula.client.group.GroupPool;

public class GroupTest
{

    private static Group        group;
    private static GroupPool    groupPool;

    private static Client       client;

    private static OneResponse  res;

    private static String       group_name = "test_group";

    /**
     * @throws java.lang.Exception
     */
    @BeforeClass
    public static void setUpBeforeClass() throws Exception
    {
        client      = new Client();
        groupPool   = new GroupPool(client);
    }

    /**
     * @throws java.lang.Exception
     */
    @AfterClass
    public static void tearDownAfterClass() throws Exception
    {
    }

    /**
     * @throws java.lang.Exception
     */
    @Before
    public void setUp() throws Exception
    {
        res = Group.allocate(client, group_name);

        int group_id = res.isError() ? -1 : Integer.parseInt(res.getMessage()); 
        group = new Group(group_id, client);
    }

    /**
     * @throws java.lang.Exception
     */
    @After
    public void tearDown() throws Exception
    {
        group.delete();
    }

    @Test
    public void allocate()
    {
        group.delete();

        res = Group.allocate(client, group_name);
        assertTrue( !res.isError() );

        int group_id = res.isError() ? -1 : Integer.parseInt(res.getMessage()); 
        group = new Group(group_id, client);


        groupPool.info();

        boolean found = false;
        for(Group img : groupPool)
        {
            found = found || img.getName().equals(group_name);
        }

        assertTrue( found );
    }

    @Test
    public void info()
    {
        res = group.info();
        assertTrue( !res.isError() );

        assertTrue( group.id() >= 100 );
        assertTrue( group.getName().equals(group_name) );
    }

    @Test
    public void delete()
    {
        res = group.delete();
        assertTrue( !res.isError() );

        res = group.info();
        assertTrue( res.isError() );

        res = groupPool.info();
        assertTrue( !res.isError() );

        boolean found = false;
        for(Group g : groupPool)
        {
            found = found || g.getName().equals(group_name);
        }

        assertTrue( !found );
    }

//  Commented out, secondary groups do not exist any more
/*
    @Test
    public void userGroupRelations()
    {
        Hashtable<String, User> users   = new Hashtable<String, User>();
        Hashtable<String, Group> groups = new Hashtable<String, Group>();

        // Create all users and groups. Add user_* to corresponding group_*
        String[] names = {"a", "b", "c", "d"};
        for(String name : names)
        {
            res = User.allocate(client, "user_"+name, "password");
            assertTrue( !res.isError() );

            users.put(  name,
                        new User(Integer.parseInt(res.getMessage()), client )
                    );

            res = Group.allocate(client, "group_"+name);
            assertTrue( !res.isError() );

            groups.put(  name,
                    new Group(Integer.parseInt(res.getMessage()), client )
                );

            users.get(name).addgroup( groups.get(name).id() );
        }

        // Add all users to group_b
        for( User u : users.values() )
        {
            u.addgroup( groups.get("b").id() );
        }

        // Change user_c & _d main group
        users.get("c").chgrp( groups.get("d").id() );
        users.get("d").chgrp( groups.get("c").id() );


        // Check cross-references so far
        for( User u : users.values() )
        {
            assertTrue( !u.info().isError() );
        }

        for( Group g : groups.values() )
        {
            assertTrue( !g.info().isError() );
        }

        assertTrue(  users.get("a").isPartOf( groups.get("a").id() ) );
        assertTrue(  users.get("a").isPartOf( groups.get("b").id() ) );
        assertFalse( users.get("a").isPartOf( groups.get("c").id() ) );
        assertFalse( users.get("a").isPartOf( groups.get("d").id() ) );
                                                                       
        assertFalse( users.get("b").isPartOf( groups.get("a").id() ) );
        assertTrue(  users.get("b").isPartOf( groups.get("b").id() ) );
        assertFalse( users.get("b").isPartOf( groups.get("c").id() ) );
        assertFalse( users.get("b").isPartOf( groups.get("d").id() ) );
                                                                       
        assertFalse( users.get("c").isPartOf( groups.get("a").id() ) );
        assertTrue(  users.get("c").isPartOf( groups.get("b").id() ) );
        assertTrue(  users.get("c").isPartOf( groups.get("c").id() ) );
        assertTrue(  users.get("c").isPartOf( groups.get("d").id() ) );
                                                                       
        assertFalse( users.get("d").isPartOf( groups.get("a").id() ) );
        assertTrue(  users.get("d").isPartOf( groups.get("b").id() ) );
        assertTrue(  users.get("d").isPartOf( groups.get("c").id() ) );
        assertTrue(  users.get("d").isPartOf( groups.get("d").id() ) );

        assertTrue(  groups.get("a").contains( users.get("a").id() ) );
        assertFalse( groups.get("a").contains( users.get("b").id() ) );
        assertFalse( groups.get("a").contains( users.get("c").id() ) );
        assertFalse( groups.get("a").contains( users.get("d").id() ) );

        assertTrue(  groups.get("b").contains( users.get("a").id() ) );
        assertTrue(  groups.get("b").contains( users.get("b").id() ) );
        assertTrue(  groups.get("b").contains( users.get("c").id() ) );
        assertTrue(  groups.get("b").contains( users.get("d").id() ) );

        assertFalse( groups.get("c").contains( users.get("a").id() ) );
        assertFalse( groups.get("c").contains( users.get("b").id() ) );
        assertTrue(  groups.get("c").contains( users.get("c").id() ) );
        assertTrue(  groups.get("c").contains( users.get("d").id() ) );
        assertFalse( groups.get("d").contains( users.get("a").id() ) );
        assertFalse( groups.get("d").contains( users.get("b").id() ) );
        assertTrue(  groups.get("d").contains( users.get("c").id() ) );
        assertTrue(  groups.get("d").contains( users.get("d").id() ) );
    }
*/
}
