/*******************************************************************************
 * Copyright 2002-2015, OpenNebula Project, OpenNebula Systems
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
import org.opennebula.client.vdc.*;
import org.opennebula.client.group.*;
import org.opennebula.client.cluster.*;


public class VdcTest
{

    private static Vdc vdc;
    private static VdcPool vdcPool;

    private static Client client;

    private static OneResponse res;
    private static int cont = 0;

    private static String template()
    {
        cont++;

        return  "NAME = \"test_vdc_" + cont + "\"\n" +
                "ATT1 = \"VAL1\"\n" +
                "ATT2 = \"VAL2\"";
    }

    /**
     * @throws java.lang.Exception
     */
    @BeforeClass
    public static void setUpBeforeClass() throws Exception
    {
        client  = new Client();
        vdcPool = new VdcPool(client);

        Group.allocate(client, "testgroup");
        Cluster.allocate(client, "testcluster");
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
        res = Vdc.allocate(client, template());

        int vdcid = res.isError() ? -1 : Integer.parseInt(res.getMessage());
        vdc = new Vdc(vdcid, client);
    }

    /**
     * @throws java.lang.Exception
     */
    @After
    public void tearDown() throws Exception
    {
        vdc.delete();
    }

    @Test
    public void allocate()
    {
        vdc.delete();

        res = Vdc.allocate(client, template());
        assertTrue( res.getErrorMessage(), !res.isError() );

        int vdcid = res.isError() ? -1 : Integer.parseInt(res.getMessage());
        vdc = new Vdc(vdcid, client);


        res = vdcPool.info();
        assertTrue( res.getErrorMessage(), !res.isError() );

        boolean found = false;
        for(Vdc vdc : vdcPool)
        {
            found = found || vdc.getName().equals("test_vdc_"+cont);
        }

        assertTrue( found );
    }

    @Test
    public void info()
    {
        res = vdc.info();
        assertTrue( res.getErrorMessage(), !res.isError() );

//        assertTrue( vdc.getId().equals("0") );
//        assertTrue( vdc.id() == 0 );
        assertTrue( vdc.getName().equals("test_vdc_"+cont) );
    }

    @Test
    public void update()
    {
        res = vdc.info();
        assertTrue( res.getErrorMessage(), !res.isError() );

        assertTrue( vdc.xpath("TEMPLATE/ATT1").equals( "VAL1" ) );
        assertTrue( vdc.xpath("TEMPLATE/ATT2").equals( "VAL2" ) );

        String new_template =  "ATT2 = NEW_VAL\n" +
                        "ATT3 = VAL3";

        res = vdc.update(new_template);
        assertTrue( res.getErrorMessage(), !res.isError() );


        res = vdc.info();
        assertTrue( res.getErrorMessage(), !res.isError() );
        assertTrue( vdc.xpath("TEMPLATE/ATT1").equals( "" ) );
        assertTrue( vdc.xpath("TEMPLATE/ATT2").equals( "NEW_VAL" ) );
        assertTrue( vdc.xpath("TEMPLATE/ATT3").equals( "VAL3" ) );
    }

    @Test
    public void attributes()
    {
        res = vdc.info();
        assertTrue( res.getErrorMessage(), !res.isError() );

//        assertTrue( vdc.xpath("ID").equals("0") );
        assertTrue( vdc.xpath("NAME").equals("test_vdc_"+cont) );
    }

    @Test
    public void addGroup()
    {
        res = vdc.addGroup(100);
        assertTrue( res.getErrorMessage(), !res.isError() );

        res = vdc.info();
        assertTrue( res.getErrorMessage(), !res.isError() );

        assertTrue( vdc.xpath("GROUPS/ID").equals("100") );
    }

    @Test
    public void addCluster()
    {
        res = vdc.addCluster(0, 100);
        assertTrue( res.getErrorMessage(), !res.isError() );

        res = vdc.info();
        assertTrue( res.getErrorMessage(), !res.isError() );

        assertTrue( vdc.xpath("CLUSTERS/CLUSTER/ZONE_ID").equals("0") );
        assertTrue( vdc.xpath("CLUSTERS/CLUSTER/CLUSTER_ID").equals("100") );
    }

    @Test
    public void delete()
    {
        res = vdc.delete();
        assertTrue( res.getErrorMessage(), !res.isError() );

//        res = vdc.info();
//        assertTrue( res.isError() );
    }
}
