/*******************************************************************************
 * Copyright 2002-2016, OpenNebula Project, OpenNebula Systems
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
import org.opennebula.client.datastore.Datastore;
import org.opennebula.client.host.Host;
import org.opennebula.client.image.Image;
import org.opennebula.client.vm.VirtualMachine;
import org.opennebula.client.vm.VirtualMachinePool;


public class VirtualMachineTest
{

    private static VirtualMachine vm;
    private static VirtualMachinePool vmPool;

    private static Client client;

    private static int hid_A, hid_B;

    private static OneResponse res;
    private static String name = "new_test_machine";


    /**
     *  Wait until the VM changes to the specified state.
     *  There is a time-out of 10 seconds.
     */
    void waitAssert(VirtualMachine vm, String state, String lcmState)
    {
        int n_steps     = 100;
        int step        = 100;

        int i = 0;

        vm.info();

        while( !( (vm.stateStr().equals(state) && (!state.equals("ACTIVE") || vm.lcmStateStr().equals(lcmState) ))|| i > n_steps ))
        {
            try{ Thread.sleep(step); } catch (Exception e){}

            vm.info();
            i++;
        }

        assertTrue( vm.stateStr().equals(state) );
        if(state.equals("ACTIVE"))
        {
            assertTrue( vm.lcmStateStr().equals(lcmState) );
        }
    }

    /**
     * @throws java.lang.Exception
     */
    @BeforeClass
    public static void setUpBeforeClass() throws Exception
    {
        client      = new Client();
        vmPool      = new VirtualMachinePool(client);


        res = Host.allocate(client, "host_A",
                            "dummy", "dummy", "dummy");
        hid_A = Integer.parseInt( res.getMessage() );

        res = Host.allocate(client, "host_B",
                            "dummy", "dummy", "dummy");
        hid_B = Integer.parseInt( res.getMessage() );

        Datastore systemDs = new Datastore(0, client);
        systemDs.update("TM_MAD = dummy");
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
        String template = "NAME = " + name + "\n"+
                          "MEMORY = 512\n" +
                          "CPU = 1\n" +
                          "CONTEXT = [DNS = 192.169.1.4]";

        res = VirtualMachine.allocate(client, template);
        int vmid = !res.isError() ? Integer.parseInt(res.getMessage()) : -1;

        vm = new VirtualMachine(vmid, client);
    }

    /**
     * @throws java.lang.Exception
     */
    @After
    public void tearDown() throws Exception
    {
        vm.finalizeVM();
        waitAssert(vm, "DONE", "-");

        vm = null;
    }

    @Test
    public void allocate()
    {
        res = vmPool.info();
        assertTrue( res.getErrorMessage(), !res.isError() );

        boolean found = false;
        for(VirtualMachine vm : vmPool)
        {
            found = found || vm.getName().equals(name);
        }

        assertTrue( found );
    }

    @Test
    public void update()
    {
        res = vm.info();
        assertTrue( res.getErrorMessage(), !res.isError() );

        assertTrue( vm.getName().equals(name) );
    }

    @Test
    public void hold()
    {
        res = vm.hold();
        assertTrue( res.getErrorMessage(), !res.isError() );
        waitAssert(vm, "HOLD", "-");
    }

    @Test
    public void release()
    {
        vm.hold();

        res = vm.release();
        assertTrue( res.getErrorMessage(), !res.isError() );
        waitAssert(vm, "PENDING", "-");
    }

    @Test
    public void deploy()
    {
        res = vm.deploy(hid_A);
        assertTrue( res.getErrorMessage(), !res.isError() );
        waitAssert(vm, "ACTIVE", "RUNNING");
    }

    @Test
    public void migrate()
    {
        vm.deploy(hid_A);
        waitAssert(vm, "ACTIVE", "RUNNING");

        res = vm.migrate(hid_B);
        assertTrue( res.getErrorMessage(), !res.isError() );
        waitAssert(vm, "ACTIVE", "RUNNING");
    }

    @Test
    public void liveMigrate()
    {
        vm.deploy(hid_A);
        waitAssert(vm, "ACTIVE", "RUNNING");

        res = vm.liveMigrate(hid_B);
        assertTrue( res.getErrorMessage(), !res.isError() );
        waitAssert(vm, "ACTIVE", "RUNNING");
    }

    @Test
    public void shutdown()
    {
        vm.deploy(hid_A);
        waitAssert(vm, "ACTIVE", "RUNNING");

        res = vm.shutdown();
        assertTrue( res.getErrorMessage(), !res.isError() );
        waitAssert(vm, "DONE", "-");
    }

    @Test
    public void cancel()
    {
        vm.deploy(hid_A);
        waitAssert(vm, "ACTIVE", "RUNNING");

        res = vm.cancel();
        assertTrue( res.getErrorMessage(), !res.isError() );
        waitAssert(vm, "DONE", "-");
    }

    @Test
    public void stop()
    {
        vm.deploy(hid_A);
        waitAssert(vm, "ACTIVE", "RUNNING");

        res = vm.stop();
        assertTrue( res.getErrorMessage(), !res.isError() );
        waitAssert(vm, "STOPPED", "-");
    }

    @Test
    public void suspend()
    {
        vm.deploy(hid_A);
        waitAssert(vm, "ACTIVE", "RUNNING");

        res = vm.suspend();
        assertTrue( res.getErrorMessage(), !res.isError() );
        waitAssert(vm, "SUSPENDED", "-");
    }

    @Test
    public void resume()
    {
        vm.deploy(hid_A);
        waitAssert(vm, "ACTIVE", "RUNNING");

        vm.suspend();
        waitAssert(vm, "SUSPENDED", "-");

        res = vm.resume();
        assertTrue( res.getErrorMessage(), !res.isError() );
        waitAssert(vm, "ACTIVE", "RUNNING");
    }

    @Test
    public void finalizeVM()
    {
        vm.deploy(hid_A);
        waitAssert(vm, "ACTIVE", "RUNNING");
        res = vm.finalizeVM();

        assertTrue( res.getErrorMessage(), !res.isError() );
        waitAssert(vm, "DONE", "-");
    }

    @Test
    public void restart()
    {
        // TODO
    }

    @Test
    public void resubmit()
    {
        vm.deploy(hid_A);
        waitAssert(vm, "ACTIVE", "RUNNING");
        res = vm.resubmit();

        assertTrue( res.getErrorMessage(), !res.isError() );
        waitAssert(vm, "PENDING", "-");
    }

    @Test
    public void attributes()
    {
        res = vm.info();
        assertTrue( res.getErrorMessage(), !res.isError() );

        assertTrue( vm.xpath("NAME").equals(name) );
        assertTrue( vm.xpath("TEMPLATE/MEMORY").equals("512") );
//        assertTrue( vm.xpath("ID").equals("0") );
        assertTrue( vm.xpath("TEMPLATE/MEMORY").equals("512") );
        assertTrue( vm.xpath("TEMPLATE/CONTEXT/DNS").equals("192.169.1.4") );
    }

    // TODO
/*
    @Test
    public void savedisk()
    {
        String img_template =
                "NAME = \"test_img\"\n" +
                "PATH = /etc/hosts\n" +
                "ATT1 = \"VAL1\"\n" +
                "ATT2 = \"VAL2\"";

        res = Image.allocate(client, img_template, 1);
        assertTrue( res.getErrorMessage(), !res.isError() );

        int imgid = Integer.parseInt(res.getMessage());

        Image img = new Image(imgid, client);
        ImageTest.waitAssert(img, "READY");


        String template = "NAME = savedisk_vm\n"+
                          "MEMORY = 512\n" +
                          "CPU = 1\n" +
                          "CONTEXT = [DNS = 192.169.1.4]\n" +
                          "DISK = [ IMAGE = test_img ]";

        res = VirtualMachine.allocate(client, template);
        assertTrue( res.getErrorMessage(), !res.isError() );

        int vmid = !res.isError() ? Integer.parseInt(res.getMessage()) : -1;

        vm = new VirtualMachine(vmid, client);

        res = vm.deploy(hid_A);
        assertTrue( res.getErrorMessage(), !res.isError() );

        waitAssert(vm, "ACTIVE", "RUNNING");

        res = vm.savedisk(0, "New_image");
        assertTrue( res.getErrorMessage(), !res.isError() );

        int new_imgid = Integer.parseInt(res.getMessage());
        assertTrue( new_imgid == imgid+1 );

        res = vm.info();
        assertTrue( res.getErrorMessage(), !res.isError() );
    }
*/
    @Test
    public void resize()
    {
        res = vm.resize("CPU = 2.5\nMEMORY = 512\nVCPU = 0", true);
        assertTrue( res.getErrorMessage(), !res.isError() );

        res = vm.resize("CPU = 1\nMEMORY = 128\nVCPU = 2", false);
        assertTrue( res.getErrorMessage(), !res.isError() );
    }
}
