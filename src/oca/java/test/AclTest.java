/*******************************************************************************
 * Copyright 2002-2011, OpenNebula Project Leads (OpenNebula.org)
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
import static org.junit.Assert.*;

import org.junit.After;
import org.junit.AfterClass;
import org.junit.Before;
import org.junit.BeforeClass;
import org.junit.Test;
import org.opennebula.client.Client;
import org.opennebula.client.OneResponse;
import org.opennebula.client.acl.*;

public class AclTest
{

    private static Acl          acl;
    private static AclPool      aclPool;

    private static Client       client;

    private static OneResponse  res;

    /**
     * @throws java.lang.Exception
     */
    @BeforeClass
    public static void setUpBeforeClass() throws Exception
    {
        client  = new Client();
        aclPool = new AclPool(client);
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
    }

    /**
     * @throws java.lang.Exception
     */
    @After
    public void tearDown() throws Exception
    {
        for(Acl rule : aclPool)
        {
            if( rule.id() != 0 && rule.id() != 1 )
            {
                rule.delete();
            }
        }
    }

    @Test
    public void defaultRules()
    {
        res = aclPool.info();
        assertTrue( !res.isError() );

        assertEquals(2, aclPool.getLength());
    }

    @Test
    public void hexAllocate()
    {
        // Allocate rule "#1 VM+HOST/@1 INFO+CREATE"
        res = Acl.allocate(client, "0x100000001", "0x3200000001", "0x11");
        assertTrue( !res.isError() );

        aclPool.info();
        acl = aclPool.getById( res.getIntMessage() );

        assertNotNull(acl);

        assertEquals(res.getIntMessage(),   acl.id());
        assertEquals(0x100000001L,          acl.user());
        assertEquals(0x3200000001L,         acl.resource());
        assertEquals(0x11L,                 acl.rights());
        assertEquals("#1 VM+HOST/@1 CREATE+INFO", acl.toString());
    }

    @Test
    public void numericAllocate()
    {
        // Allocate rule "#1 VM+HOST/@1 INFO+CREATE"
        res = Acl.allocate(client, 0x100000001L, 214748364801L, 0x11L);
        assertTrue( !res.isError() );

        aclPool.info();
        acl = aclPool.getById( res.getIntMessage() );

        assertNotNull(acl);

        assertEquals(res.getIntMessage(),   acl.id());
        assertEquals(0x100000001L,          acl.user());
        assertEquals(0x3200000001L,         acl.resource());
        assertEquals(0x11L,                 acl.rights());
        assertEquals("#1 VM+HOST/@1 CREATE+INFO", acl.toString());
    }

    @Test
    public void ruleAllocate()
    {
        try
        {
            res = Acl.allocate(client, "@507 IMAGE/#456 CREATE");
            assertTrue( !res.isError() );

            aclPool.info();
            acl = aclPool.getById( res.getIntMessage() );

            assertNotNull(acl);

            assertEquals(res.getIntMessage(),   acl.id());
            assertEquals(0x2000001fbL,          acl.user());
            assertEquals(0x81000001c8L,         acl.resource());
            assertEquals(0x1L,                 acl.rights());
            assertEquals("@507 IMAGE/#456 CREATE", acl.toString());
        }
        catch (RuleParseException e)
        {
            assertTrue( false );
        }
    }

    @Test
    public void parseRules()
    {
        String[] rules = {
            "#3 TEMPLATE/#0 INFO",
            "#2 IMAGE/#0 INFO",
            "@107 IMAGE+TEMPLATE/@100 INFO",
            "* VM+IMAGE+TEMPLATE/@100 CREATE+INFO+INFO_POOL",
            "#2345 VM+IMAGE+TEMPLATE/* CREATE+INFO+INFO_POOL+INFO_POOL_MINE+INSTANTIATE",
            "@7 HOST/@100 INFO+INFO_POOL+USE+DEPLOY",
        };

        long[] users = {
            0x100000003L,
            0x100000002L,
            0x20000006bL,
            0x400000000L,
            0x100000929L,
            0x200000007L
        };

        long[] resources = {
            0x20100000000L,
            0x8100000000L,
            0x28200000064L,
            0x29200000064L,
            0x29400000000L,
            0x2200000064L
        };

        long[] rights = {
            0x10L,
            0x10L,
            0x10L,
            0x31L,
            0xf1L,
            0x234L
        };

        for( int i = 0; i < rules.length; i++ )
        {
            try
            {
                res = Acl.allocate(client, rules[i]);
                assertTrue( !res.isError() );

                aclPool.info();
                acl = aclPool.getById( res.getIntMessage() );

                assertNotNull(acl);

                assertEquals(res.getIntMessage(),   acl.id());
                assertEquals(users[i],              acl.user());
                assertEquals(resources[i],          acl.resource());
                assertEquals(rights[i],             acl.rights());
            }
            catch (RuleParseException e)
            {
                assertTrue(
                        "Rule " + rules[i]
                                + " has been wrongly reported as invalid; "
                                + e.getMessage(),
                        false);
            }
        }
    }

    @Test
    public void delete()
    {
        try
        {
            res = Acl.allocate(client, "#1 HOST/@2 INFO_POOL");
            assertTrue( !res.isError() );

            aclPool.info();
            assertTrue( aclPool.getLength() == 3 );

            res = Acl.delete(client, res.getIntMessage());
            assertTrue( !res.isError() );

            aclPool.info();
            assertTrue( aclPool.getLength() == 2 );
        }
        catch (RuleParseException e)
        {
            assertTrue(
                    "Rule has been wrongly reported as invalid; "
                            + e.getMessage(),
                    false);
        }
    }

    @Test
    public void wrongRules()
    {
        String[] rules = {
                "#-3 TEMPLATE/#0 INFO",
                "#+3 TEMPLATE/#0 INFO",
                "@3+ TEMPLATE/#0 INFO",
                "*3 TEMPLATE/#0 INFO",
                "# TEMPLATE/#0 INFO",
                "@@ TEMPLATE/#0 INFO",
                "@#3 TEMPLATE/#0 INFO",
                "#3 TEMPLATE+HOS/#0 INFO",
                "#3 /#0 INFO",
                "#3 TEMPLATE/# INFO",
                "#3 TEMPLATE/#5 INFO CREATE",
                "#3 TEMPLATE/#5",
                "#3     ",
                "",
                "#2 IMAGE @10654 INFO",
                "#2 IMAGE/ INFO",
                "#2 IMAGE#0 INFO",
                "#2 IMAGE/# INFO",
                "#2 IMAGE/@- INFO",
                "#2 IMAGE/#0/#0 INFO",
                "#2 IMAGE/#0/INFO CREATE",
                "#2 IMAGE/#0/INFO+CREATE",
                "#2 IMAGE/#0 IFO",
                "#2 IMAGE/#0 INFO+CREAT",
            };

            for( int i = 0; i < rules.length; i++ )
            {
                try
                {
                    res = Acl.allocate(client, rules[i]);

                    assertTrue( "Rule " + rules[i] +
                            " should have thrown an exception",
                            false);
                }
                catch (RuleParseException e)
                {
                }
            }
    }
}
