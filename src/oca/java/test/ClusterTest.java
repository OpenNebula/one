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
import static org.junit.Assert.assertTrue;

import org.junit.After;
import org.junit.AfterClass;
import org.junit.Before;
import org.junit.BeforeClass;
import org.junit.Test;
import org.opennebula.client.Client;
import org.opennebula.client.OneResponse;
import org.opennebula.client.cluster.Cluster;
import org.opennebula.client.cluster.ClusterPool;
import org.opennebula.client.host.Host;


public class ClusterTest
{

    private static Cluster cluster;
    private static ClusterPool clusterPool;

    private static Host host;

    private static Client client;

    private static OneResponse res;
    private static String name = "new_test_cluster";
    private static int hid = -1;

    /**
     * @throws java.lang.Exception
     */
    @BeforeClass
    public static void setUpBeforeClass() throws Exception
    {
        client      = new Client();
        clusterPool = new ClusterPool(client);

        res = Host.allocate(client, "new_test_host",
                "im_dummy", "vmm_dummy", "tm_dummy");
        try{
            hid = Integer.parseInt( res.getMessage() );
        }catch(NumberFormatException e)
        {
            System.err.println("Test initilization failed (setUpBeforeClass).");
        }
        host = new Host(hid, client);
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
        res = Cluster.allocate(client, name);

        int clid = Integer.parseInt(res.getMessage());
        cluster  = new Cluster(clid, client);
    }

    /**
     * @throws java.lang.Exception
     */
    @After
    public void tearDown() throws Exception
    {
        cluster.delete();
    }

    @Test
    public void allocate()
    {
        String allocate_name = "allocation_test";
        res = Cluster.allocate(client, allocate_name);
        assertTrue( !res.isError() );

        clusterPool.info();

        boolean found = false;
        for(Cluster c : clusterPool)
        {
            found = found || c.getName().equals(allocate_name);
        }

        assertTrue( found );
    }

    @Test
    public void update()
    {
        res = cluster.info();
        assertTrue( !res.isError() );
        
//        assertTrue( cluster.getId().equals("1") );
//        assertTrue( cluster.id() == 1 );
        assertTrue( cluster.getName().equals(name) );
    }

    @Test
    public void addHost()
    {
        res = cluster.add(hid);
        assertTrue( !res.isError() );

        res = host.info();
        assertTrue( !res.isError() );
        assertTrue( host.getCluster().equals(name) );
    }

    @Test
    public void removeHost()
    {
        assertTrue( hid > -1 );

        res = cluster.remove(hid);
        assertTrue( !res.isError() );

        res = host.info();
        assertTrue( !res.isError() );

        assertTrue( host.getCluster().equals("default") );
    }

    @Test
    public void attributes()
    {
        res = cluster.info();
        assertTrue( !res.isError() );

//        assertTrue( cluster.xpath("ID").equals("1") );
        assertTrue( cluster.xpath("NAME").equals(name) );
    }

    @Test
    public void delete()
    {
        res = cluster.delete();
        assertTrue( !res.isError() );

        res = cluster.info();
        assertTrue( res.isError() );
    }
}
