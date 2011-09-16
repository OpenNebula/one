-- MySQL dump 10.13  Distrib 5.1.41, for debian-linux-gnu (i486)
--
-- Host: localhost    Database: onedb_test
-- ------------------------------------------------------
-- Server version	5.1.41-3ubuntu12.10

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `cluster_pool`
--

DROP TABLE IF EXISTS `cluster_pool`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `cluster_pool` (
  `oid` int(11) NOT NULL,
  `cluster_name` varchar(128) DEFAULT NULL,
  PRIMARY KEY (`oid`),
  UNIQUE KEY `cluster_name` (`cluster_name`)
) ENGINE=MyISAM DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cluster_pool`
--

LOCK TABLES `cluster_pool` WRITE;
/*!40000 ALTER TABLE `cluster_pool` DISABLE KEYS */;
INSERT INTO `cluster_pool` VALUES (0,'default');
/*!40000 ALTER TABLE `cluster_pool` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `history`
--

DROP TABLE IF EXISTS `history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `history` (
  `vid` int(11) NOT NULL DEFAULT '0',
  `seq` int(11) NOT NULL DEFAULT '0',
  `host_name` text,
  `vm_dir` text,
  `hid` int(11) DEFAULT NULL,
  `vm_mad` text,
  `tm_mad` text,
  `stime` int(11) DEFAULT NULL,
  `etime` int(11) DEFAULT NULL,
  `pstime` int(11) DEFAULT NULL,
  `petime` int(11) DEFAULT NULL,
  `rstime` int(11) DEFAULT NULL,
  `retime` int(11) DEFAULT NULL,
  `estime` int(11) DEFAULT NULL,
  `eetime` int(11) DEFAULT NULL,
  `reason` int(11) DEFAULT NULL,
  PRIMARY KEY (`vid`,`seq`)
) ENGINE=MyISAM DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `history`
--

LOCK TABLES `history` WRITE;
/*!40000 ALTER TABLE `history` DISABLE KEYS */;
INSERT INTO `history` VALUES (0,0,'host_0','/home/cmartin/trabajo/opennebula/install/var/',0,'vmm_dummy','tm_dummy',1316187929,1316187934,1316187929,1316187929,1316187929,1316187934,0,0,3),(1,0,'host_1','/home/cmartin/trabajo/opennebula/install/var/',1,'vmm_dummy','tm_dummy',1316187929,1316187935,1316187929,1316187929,1316187929,1316187935,0,0,3),(2,0,'host_2','/home/cmartin/trabajo/opennebula/install/var/',2,'vmm_dummy','tm_dummy',1316187930,1316187940,1316187930,1316187930,1316187930,1316187940,1316187940,1316187940,0),(3,0,'host_3','/home/cmartin/trabajo/opennebula/install/var/',3,'vmm_dummy','tm_dummy',1316187930,1316187941,1316187930,1316187930,1316187930,1316187941,0,0,3),(0,1,'host_1','/home/cmartin/trabajo/opennebula/install/var/',1,'vmm_dummy','tm_dummy',1316187934,0,1316187934,1316187934,1316187934,0,0,0,0),(1,1,'host_2','/home/cmartin/trabajo/opennebula/install/var/',2,'vmm_dummy','tm_dummy',1316187935,1316187936,0,0,1316187935,1316187936,1316187936,1316187936,2),(1,2,'host_0','/home/cmartin/trabajo/opennebula/install/var/',0,'vmm_dummy','tm_dummy',1316187937,1316187938,1316187937,1316187937,1316187937,1316187938,0,0,3),(1,3,'host_3','/home/cmartin/trabajo/opennebula/install/var/',3,'vmm_dummy','tm_dummy',1316187938,1316187939,1316187938,1316187938,1316187938,1316187939,1316187939,1316187939,0);
/*!40000 ALTER TABLE `history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `host_pool`
--

DROP TABLE IF EXISTS `host_pool`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `host_pool` (
  `oid` int(11) NOT NULL,
  `host_name` varchar(256) DEFAULT NULL,
  `state` int(11) DEFAULT NULL,
  `im_mad` varchar(128) DEFAULT NULL,
  `vm_mad` varchar(128) DEFAULT NULL,
  `tm_mad` varchar(128) DEFAULT NULL,
  `last_mon_time` int(11) DEFAULT NULL,
  `cluster` varchar(128) DEFAULT NULL,
  `template` text,
  PRIMARY KEY (`oid`),
  UNIQUE KEY `host_name` (`host_name`)
) ENGINE=MyISAM DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `host_pool`
--

LOCK TABLES `host_pool` WRITE;
/*!40000 ALTER TABLE `host_pool` DISABLE KEYS */;
INSERT INTO `host_pool` VALUES (1,'host_1',2,'im_dummy','vmm_dummy','tm_dummy',1316187946,'default','<TEMPLATE><CPUSPEED><![CDATA[2.2GHz]]></CPUSPEED><FREECPU><![CDATA[800]]></FREECPU><FREEMEMORY><![CDATA[16777216]]></FREEMEMORY><HYPERVISOR><![CDATA[dummy]]></HYPERVISOR><NAME><![CDATA[host_1]]></NAME><TOTALCPU><![CDATA[800]]></TOTALCPU><TOTALMEMORY><![CDATA[16777216]]></TOTALMEMORY><USEDCPU><![CDATA[0]]></USEDCPU><USEDMEMORY><![CDATA[0]]></USEDMEMORY></TEMPLATE>'),(3,'host_3',4,'im_dummy','vmm_dummy','tm_dummy',1316187931,'default','<TEMPLATE><CPUSPEED><![CDATA[2.2GHz]]></CPUSPEED><FREECPU><![CDATA[800]]></FREECPU><FREEMEMORY><![CDATA[16777216]]></FREEMEMORY><HYPERVISOR><![CDATA[dummy]]></HYPERVISOR><NAME><![CDATA[host_3]]></NAME><TOTALCPU><![CDATA[800]]></TOTALCPU><TOTALMEMORY><![CDATA[16777216]]></TOTALMEMORY><USEDCPU><![CDATA[0]]></USEDCPU><USEDMEMORY><![CDATA[0]]></USEDMEMORY></TEMPLATE>'),(4,'host_4',2,'im_dummy','vmm_dummy','tm_dummy',1316187946,'default','<TEMPLATE><CPUSPEED><![CDATA[2.2GHz]]></CPUSPEED><FREECPU><![CDATA[800]]></FREECPU><FREEMEMORY><![CDATA[16777216]]></FREEMEMORY><HYPERVISOR><![CDATA[dummy]]></HYPERVISOR><NAME><![CDATA[host_4]]></NAME><TOTALCPU><![CDATA[800]]></TOTALCPU><TOTALMEMORY><![CDATA[16777216]]></TOTALMEMORY><USEDCPU><![CDATA[0]]></USEDCPU><USEDMEMORY><![CDATA[0]]></USEDMEMORY></TEMPLATE>'),(0,'host_0',2,'im_dummy','vmm_dummy','tm_dummy',1316187946,'default','<TEMPLATE><CPUSPEED><![CDATA[2.2GHz]]></CPUSPEED><FREECPU><![CDATA[800]]></FREECPU><FREEMEMORY><![CDATA[16777216]]></FREEMEMORY><HYPERVISOR><![CDATA[dummy]]></HYPERVISOR><NAME><![CDATA[host_0]]></NAME><TOTALCPU><![CDATA[800]]></TOTALCPU><TOTALMEMORY><![CDATA[16777216]]></TOTALMEMORY><USEDCPU><![CDATA[0]]></USEDCPU><USEDMEMORY><![CDATA[0]]></USEDMEMORY></TEMPLATE>'),(2,'host_2',2,'im_dummy','vmm_dummy','tm_dummy',1316187946,'default','<TEMPLATE><CPUSPEED><![CDATA[2.2GHz]]></CPUSPEED><FREECPU><![CDATA[800]]></FREECPU><FREEMEMORY><![CDATA[16777216]]></FREEMEMORY><HYPERVISOR><![CDATA[dummy]]></HYPERVISOR><NAME><![CDATA[host_2]]></NAME><TOTALCPU><![CDATA[800]]></TOTALCPU><TOTALMEMORY><![CDATA[16777216]]></TOTALMEMORY><USEDCPU><![CDATA[0]]></USEDCPU><USEDMEMORY><![CDATA[0]]></USEDMEMORY></TEMPLATE>');
/*!40000 ALTER TABLE `host_pool` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `host_shares`
--

DROP TABLE IF EXISTS `host_shares`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `host_shares` (
  `hid` int(11) NOT NULL,
  `disk_usage` int(11) DEFAULT NULL,
  `mem_usage` int(11) DEFAULT NULL,
  `cpu_usage` int(11) DEFAULT NULL,
  `max_disk` int(11) DEFAULT NULL,
  `max_mem` int(11) DEFAULT NULL,
  `max_cpu` int(11) DEFAULT NULL,
  `free_disk` int(11) DEFAULT NULL,
  `free_mem` int(11) DEFAULT NULL,
  `free_cpu` int(11) DEFAULT NULL,
  `used_disk` int(11) DEFAULT NULL,
  `used_mem` int(11) DEFAULT NULL,
  `used_cpu` int(11) DEFAULT NULL,
  `running_vms` int(11) DEFAULT NULL,
  PRIMARY KEY (`hid`)
) ENGINE=MyISAM DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `host_shares`
--

LOCK TABLES `host_shares` WRITE;
/*!40000 ALTER TABLE `host_shares` DISABLE KEYS */;
INSERT INTO `host_shares` VALUES (0,0,0,0,0,16777216,800,0,16777216,800,0,0,0,0),(1,0,524288,0,0,16777216,800,0,16777216,800,0,0,0,1),(2,0,0,0,0,16777216,800,0,16777216,800,0,0,0,0),(3,0,0,0,0,16777216,800,0,16777216,800,0,0,0,0),(4,0,0,0,0,16777216,800,0,16777216,800,0,0,0,0);
/*!40000 ALTER TABLE `host_shares` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `image_pool`
--

DROP TABLE IF EXISTS `image_pool`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `image_pool` (
  `oid` int(11) NOT NULL,
  `uid` int(11) DEFAULT NULL,
  `name` varchar(128) DEFAULT NULL,
  `type` int(11) DEFAULT NULL,
  `public` int(11) DEFAULT NULL,
  `persistent` int(11) DEFAULT NULL,
  `regtime` int(11) DEFAULT NULL,
  `source` text,
  `state` int(11) DEFAULT NULL,
  `running_vms` int(11) DEFAULT NULL,
  `template` text,
  PRIMARY KEY (`oid`),
  UNIQUE KEY `name` (`name`)
) ENGINE=MyISAM DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `image_pool`
--

LOCK TABLES `image_pool` WRITE;
/*!40000 ALTER TABLE `image_pool` DISABLE KEYS */;
INSERT INTO `image_pool` VALUES (0,1,'image_0',2,0,0,1316187925,'/home/cmartin/trabajo/opennebula/install/var//images/f4f08f2ad6fcb19432db9da3161d144aa2d5e730',2,1,'<TEMPLATE><DEV_PREFIX><![CDATA[hd]]></DEV_PREFIX><EXTRA_ATT><![CDATA[EXTRA_VALUE FOR IMG 0]]></EXTRA_ATT><NAME><![CDATA[image_0]]></NAME><PATH><![CDATA[/dev/null]]></PATH><TYPE><![CDATA[DATABLOCK]]></TYPE></TEMPLATE>'),(3,4,'image_3',2,0,1,1316187926,'/home/cmartin/trabajo/opennebula/install/var//images/01a1e990037cabc5419076c78e21f96b8c889dbf',1,0,'<TEMPLATE><DEV_PREFIX><![CDATA[hd]]></DEV_PREFIX><EXTRA_ATT><![CDATA[EXTRA_VALUE FOR IMG 3]]></EXTRA_ATT><NAME><![CDATA[image_3]]></NAME><PATH><![CDATA[/dev/null]]></PATH><TYPE><![CDATA[DATABLOCK]]></TYPE></TEMPLATE>'),(4,5,'image_4',2,0,0,1316187926,'/home/cmartin/trabajo/opennebula/install/var//images/df76114f6749fb9ef6674649c809f28054c0d125',2,1,'<TEMPLATE><DEV_PREFIX><![CDATA[hd]]></DEV_PREFIX><EXTRA_ATT><![CDATA[EXTRA_VALUE FOR IMG 4]]></EXTRA_ATT><NAME><![CDATA[image_4]]></NAME><PATH><![CDATA[/dev/null]]></PATH><TYPE><![CDATA[DATABLOCK]]></TYPE></TEMPLATE>'),(1,2,'image_1',2,0,0,1316187925,'/home/cmartin/trabajo/opennebula/install/var//images/1dbcefd204efa3c32280d2c56a2d499f89790bae',1,0,'<TEMPLATE><DEV_PREFIX><![CDATA[hd]]></DEV_PREFIX><EXTRA_ATT><![CDATA[EXTRA_VALUE FOR IMG 1]]></EXTRA_ATT><NAME><![CDATA[image_1]]></NAME><PATH><![CDATA[/dev/null]]></PATH><TYPE><![CDATA[DATABLOCK]]></TYPE></TEMPLATE>'),(2,3,'image_2',2,0,0,1316187925,'/home/cmartin/trabajo/opennebula/install/var//images/a42e387dcd957218a4f5c86f1b586631ab769c17',1,0,'<TEMPLATE><DEV_PREFIX><![CDATA[hd]]></DEV_PREFIX><EXTRA_ATT><![CDATA[EXTRA_VALUE FOR IMG 2]]></EXTRA_ATT><NAME><![CDATA[image_2]]></NAME><PATH><![CDATA[/dev/null]]></PATH><TYPE><![CDATA[DATABLOCK]]></TYPE></TEMPLATE>');
/*!40000 ALTER TABLE `image_pool` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `leases`
--

DROP TABLE IF EXISTS `leases`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `leases` (
  `oid` int(11) NOT NULL DEFAULT '0',
  `ip` bigint(20) NOT NULL DEFAULT '0',
  `mac_prefix` bigint(20) DEFAULT NULL,
  `mac_suffix` bigint(20) DEFAULT NULL,
  `vid` int(11) DEFAULT NULL,
  `used` int(11) DEFAULT NULL,
  PRIMARY KEY (`oid`,`ip`)
) ENGINE=MyISAM DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `leases`
--

LOCK TABLES `leases` WRITE;
/*!40000 ALTER TABLE `leases` DISABLE KEYS */;
INSERT INTO `leases` VALUES (0,3232235521,512,3232235521,0,1),(0,3232235522,512,3232235522,-1,0),(0,3232235523,512,3232235523,-1,0),(0,3232235524,512,3232235524,-1,0),(0,3232235525,512,3232235525,-1,0),(1,3232235777,512,3232235777,-1,0),(1,3232235778,512,3232235778,-1,0),(1,3232235779,512,3232235779,-1,0),(1,3232235780,512,3232235780,-1,0),(1,3232235781,512,3232235781,-1,0),(2,3232236033,512,3232236033,-1,0),(2,3232236034,512,3232236034,-1,0),(2,3232236035,512,3232236035,-1,0),(2,3232236036,512,3232236036,-1,0),(2,3232236037,512,3232236037,-1,0),(4,3232236545,512,3232236545,4,1);
/*!40000 ALTER TABLE `leases` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `network_pool`
--

DROP TABLE IF EXISTS `network_pool`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `network_pool` (
  `oid` int(11) NOT NULL,
  `uid` int(11) DEFAULT NULL,
  `name` varchar(256) DEFAULT NULL,
  `type` int(11) DEFAULT NULL,
  `bridge` text,
  `public` int(11) DEFAULT NULL,
  `template` text,
  PRIMARY KEY (`oid`),
  UNIQUE KEY `name` (`name`)
) ENGINE=MyISAM DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `network_pool`
--

LOCK TABLES `network_pool` WRITE;
/*!40000 ALTER TABLE `network_pool` DISABLE KEYS */;
INSERT INTO `network_pool` VALUES (0,1,'vnet_fixed_0',1,'vbr1',0,'<TEMPLATE><BRIDGE><![CDATA[vbr1]]></BRIDGE><EXTRA_ATT><![CDATA[EXTRA_VALUE FOR VNET 0]]></EXTRA_ATT><LEASES><IP><![CDATA[192.168.0.1]]></IP></LEASES><LEASES><IP><![CDATA[192.168.0.2]]></IP></LEASES><LEASES><IP><![CDATA[192.168.0.3]]></IP></LEASES><LEASES><IP><![CDATA[192.168.0.4]]></IP></LEASES><LEASES><IP><![CDATA[192.168.0.5]]></IP></LEASES><NAME><![CDATA[vnet_fixed_0]]></NAME><TYPE><![CDATA[FIXED]]></TYPE></TEMPLATE>'),(1,2,'vnet_fixed_1',1,'vbr1',0,'<TEMPLATE><BRIDGE><![CDATA[vbr1]]></BRIDGE><EXTRA_ATT><![CDATA[EXTRA_VALUE FOR VNET 1]]></EXTRA_ATT><LEASES><IP><![CDATA[192.168.1.1]]></IP></LEASES><LEASES><IP><![CDATA[192.168.1.2]]></IP></LEASES><LEASES><IP><![CDATA[192.168.1.3]]></IP></LEASES><LEASES><IP><![CDATA[192.168.1.4]]></IP></LEASES><LEASES><IP><![CDATA[192.168.1.5]]></IP></LEASES><NAME><![CDATA[vnet_fixed_1]]></NAME><TYPE><![CDATA[FIXED]]></TYPE></TEMPLATE>'),(2,3,'vnet_fixed_2',1,'vbr1',1,'<TEMPLATE><BRIDGE><![CDATA[vbr1]]></BRIDGE><EXTRA_ATT><![CDATA[EXTRA_VALUE FOR VNET 2]]></EXTRA_ATT><LEASES><IP><![CDATA[192.168.2.1]]></IP></LEASES><LEASES><IP><![CDATA[192.168.2.2]]></IP></LEASES><LEASES><IP><![CDATA[192.168.2.3]]></IP></LEASES><LEASES><IP><![CDATA[192.168.2.4]]></IP></LEASES><LEASES><IP><![CDATA[192.168.2.5]]></IP></LEASES><NAME><![CDATA[vnet_fixed_2]]></NAME><TYPE><![CDATA[FIXED]]></TYPE></TEMPLATE>'),(3,4,'vnet_ranged_3',0,'vbr0',0,'<TEMPLATE><BRIDGE><![CDATA[vbr0]]></BRIDGE><EXTRA_ATT><![CDATA[EXTRA_VALUE FOR VNET 3]]></EXTRA_ATT><NAME><![CDATA[vnet_ranged_3]]></NAME><NETWORK_ADDRESS><![CDATA[192.168.3.0]]></NETWORK_ADDRESS><NETWORK_SIZE><![CDATA[C]]></NETWORK_SIZE><TYPE><![CDATA[RANGED]]></TYPE></TEMPLATE>'),(4,5,'vnet_ranged_4',0,'vbr0',1,'<TEMPLATE><BRIDGE><![CDATA[vbr0]]></BRIDGE><EXTRA_ATT><![CDATA[EXTRA_VALUE FOR VNET 4]]></EXTRA_ATT><NAME><![CDATA[vnet_ranged_4]]></NAME><NETWORK_ADDRESS><![CDATA[192.168.4.0]]></NETWORK_ADDRESS><NETWORK_SIZE><![CDATA[C]]></NETWORK_SIZE><TYPE><![CDATA[RANGED]]></TYPE></TEMPLATE>');
/*!40000 ALTER TABLE `network_pool` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_pool`
--

DROP TABLE IF EXISTS `user_pool`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user_pool` (
  `oid` int(11) NOT NULL,
  `user_name` varchar(256) DEFAULT NULL,
  `password` text,
  `enabled` int(11) DEFAULT NULL,
  PRIMARY KEY (`oid`),
  UNIQUE KEY `user_name` (`user_name`)
) ENGINE=MyISAM DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_pool`
--

LOCK TABLES `user_pool` WRITE;
/*!40000 ALTER TABLE `user_pool` DISABLE KEYS */;
INSERT INTO `user_pool` VALUES (0,'oneadmin','7bc8559a8fe509e680562b85c337f170956fcb06',1),(1,'user_0','90e3707afc67a2038d1088761fea5cd50bbd08bb',1),(2,'user_1','681aae69de00c2df72381c3e5f9d77e70e7e384c',1),(3,'user_2','a195b95bf777854dfe566d1ffef1b76a34dc15a1',1),(4,'user_3','05bf903dc5ff0f2f69f630d9a59bc0b6df8c1cff',1),(5,'user_4','1a6f9b4e378ab45beee6cde9396df5c6ea9863b8',1);
/*!40000 ALTER TABLE `user_pool` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vm_pool`
--

DROP TABLE IF EXISTS `vm_pool`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `vm_pool` (
  `oid` int(11) NOT NULL,
  `uid` int(11) DEFAULT NULL,
  `name` text,
  `last_poll` int(11) DEFAULT NULL,
  `state` int(11) DEFAULT NULL,
  `lcm_state` int(11) DEFAULT NULL,
  `stime` int(11) DEFAULT NULL,
  `etime` int(11) DEFAULT NULL,
  `deploy_id` text,
  `memory` int(11) DEFAULT NULL,
  `cpu` int(11) DEFAULT NULL,
  `net_tx` int(11) DEFAULT NULL,
  `net_rx` int(11) DEFAULT NULL,
  `last_seq` int(11) DEFAULT NULL,
  `template` text,
  PRIMARY KEY (`oid`)
) ENGINE=MyISAM DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vm_pool`
--

LOCK TABLES `vm_pool` WRITE;
/*!40000 ALTER TABLE `vm_pool` DISABLE KEYS */;
INSERT INTO `vm_pool` VALUES (0,1,'one-0',1316187945,3,3,1316187927,0,'dummy',0,0,12345,0,1,'<TEMPLATE><CONTEXT><FILES><![CDATA[/dev/null]]></FILES><TARGET><![CDATA[hdb]]></TARGET></CONTEXT><CPU><![CDATA[0]]></CPU><DISK><CLONE><![CDATA[YES]]></CLONE><DISK_ID><![CDATA[0]]></DISK_ID><IMAGE><![CDATA[image_0]]></IMAGE><IMAGE_ID><![CDATA[0]]></IMAGE_ID><READONLY><![CDATA[NO]]></READONLY><SAVE><![CDATA[NO]]></SAVE><SOURCE><![CDATA[/home/cmartin/trabajo/opennebula/install/var//images/f4f08f2ad6fcb19432db9da3161d144aa2d5e730]]></SOURCE><TARGET><![CDATA[hde]]></TARGET><TYPE><![CDATA[DISK]]></TYPE></DISK><DISK><DISK_ID><![CDATA[1]]></DISK_ID><READONLY><![CDATA[no]]></READONLY><SIZE><![CDATA[1024]]></SIZE><TARGET><![CDATA[hdd]]></TARGET><TYPE><![CDATA[swap]]></TYPE></DISK><EXTRA_ATT><![CDATA[EXTRA_VALUE FOR VM 0]]></EXTRA_ATT><MEMORY><![CDATA[512]]></MEMORY><NAME><![CDATA[one-0]]></NAME><NIC><BRIDGE><![CDATA[vbr1]]></BRIDGE><IP><![CDATA[192.168.0.1]]></IP><MAC><![CDATA[02:00:c0:a8:00:01]]></MAC><NETWORK><![CDATA[vnet_fixed_0]]></NETWORK><NETWORK_ID><![CDATA[0]]></NETWORK_ID></NIC><OS><INITRD><![CDATA[initrd.img]]></INITRD><KERNEL><![CDATA[vmlinuz]]></KERNEL><ROOT><![CDATA[sda]]></ROOT></OS><RANK><![CDATA[FREECPU]]></RANK><REQUIREMENTS><![CDATA[CPUSPEED > 1000]]></REQUIREMENTS><VMID><![CDATA[0]]></VMID></TEMPLATE>'),(1,2,'one-1',1316187930,6,0,1316187927,1316187939,'dummy',0,0,0,0,3,'<TEMPLATE><CONTEXT><FILES><![CDATA[/dev/null]]></FILES><TARGET><![CDATA[hdb]]></TARGET></CONTEXT><CPU><![CDATA[1]]></CPU><DISK><CLONE><![CDATA[YES]]></CLONE><DISK_ID><![CDATA[0]]></DISK_ID><IMAGE><![CDATA[image_1]]></IMAGE><IMAGE_ID><![CDATA[1]]></IMAGE_ID><READONLY><![CDATA[NO]]></READONLY><SAVE><![CDATA[NO]]></SAVE><SOURCE><![CDATA[/home/cmartin/trabajo/opennebula/install/var//images/1dbcefd204efa3c32280d2c56a2d499f89790bae]]></SOURCE><TARGET><![CDATA[hde]]></TARGET><TYPE><![CDATA[DISK]]></TYPE></DISK><DISK><DISK_ID><![CDATA[1]]></DISK_ID><READONLY><![CDATA[no]]></READONLY><SIZE><![CDATA[1024]]></SIZE><TARGET><![CDATA[hdd]]></TARGET><TYPE><![CDATA[swap]]></TYPE></DISK><EXTRA_ATT><![CDATA[EXTRA_VALUE FOR VM 1]]></EXTRA_ATT><MEMORY><![CDATA[512]]></MEMORY><NAME><![CDATA[one-1]]></NAME><NIC><BRIDGE><![CDATA[vbr1]]></BRIDGE><IP><![CDATA[192.168.1.1]]></IP><MAC><![CDATA[02:00:c0:a8:01:01]]></MAC><NETWORK><![CDATA[vnet_fixed_1]]></NETWORK><NETWORK_ID><![CDATA[1]]></NETWORK_ID></NIC><OS><INITRD><![CDATA[initrd.img]]></INITRD><KERNEL><![CDATA[vmlinuz]]></KERNEL><ROOT><![CDATA[sda]]></ROOT></OS><RANK><![CDATA[FREECPU]]></RANK><REQUIREMENTS><![CDATA[CPUSPEED > 1000]]></REQUIREMENTS><VMID><![CDATA[1]]></VMID></TEMPLATE>'),(2,3,'one-2',1316187930,6,0,1316187928,1316187940,'dummy',0,0,0,0,0,'<TEMPLATE><CONTEXT><FILES><![CDATA[/dev/null]]></FILES><TARGET><![CDATA[hdb]]></TARGET></CONTEXT><CPU><![CDATA[2]]></CPU><DISK><CLONE><![CDATA[YES]]></CLONE><DISK_ID><![CDATA[0]]></DISK_ID><IMAGE><![CDATA[image_2]]></IMAGE><IMAGE_ID><![CDATA[2]]></IMAGE_ID><READONLY><![CDATA[NO]]></READONLY><SAVE><![CDATA[NO]]></SAVE><SOURCE><![CDATA[/home/cmartin/trabajo/opennebula/install/var//images/a42e387dcd957218a4f5c86f1b586631ab769c17]]></SOURCE><TARGET><![CDATA[hde]]></TARGET><TYPE><![CDATA[DISK]]></TYPE></DISK><DISK><DISK_ID><![CDATA[1]]></DISK_ID><READONLY><![CDATA[no]]></READONLY><SIZE><![CDATA[1024]]></SIZE><TARGET><![CDATA[hdd]]></TARGET><TYPE><![CDATA[swap]]></TYPE></DISK><EXTRA_ATT><![CDATA[EXTRA_VALUE FOR VM 2]]></EXTRA_ATT><MEMORY><![CDATA[512]]></MEMORY><NAME><![CDATA[one-2]]></NAME><NIC><BRIDGE><![CDATA[vbr1]]></BRIDGE><IP><![CDATA[192.168.2.1]]></IP><MAC><![CDATA[02:00:c0:a8:02:01]]></MAC><NETWORK><![CDATA[vnet_fixed_2]]></NETWORK><NETWORK_ID><![CDATA[2]]></NETWORK_ID></NIC><OS><INITRD><![CDATA[initrd.img]]></INITRD><KERNEL><![CDATA[vmlinuz]]></KERNEL><ROOT><![CDATA[sda]]></ROOT></OS><RANK><![CDATA[FREECPU]]></RANK><REQUIREMENTS><![CDATA[CPUSPEED > 1000]]></REQUIREMENTS><VMID><![CDATA[2]]></VMID></TEMPLATE>'),(3,4,'one-3',1316187930,6,0,1316187928,1316187941,'dummy',0,0,0,0,0,'<TEMPLATE><CONTEXT><FILES><![CDATA[/dev/null]]></FILES><TARGET><![CDATA[hdb]]></TARGET></CONTEXT><CPU><![CDATA[3]]></CPU><DISK><CLONE><![CDATA[YES]]></CLONE><DISK_ID><![CDATA[0]]></DISK_ID><IMAGE><![CDATA[image_3]]></IMAGE><IMAGE_ID><![CDATA[3]]></IMAGE_ID><READONLY><![CDATA[NO]]></READONLY><SAVE><![CDATA[NO]]></SAVE><SOURCE><![CDATA[/home/cmartin/trabajo/opennebula/install/var//images/01a1e990037cabc5419076c78e21f96b8c889dbf]]></SOURCE><TARGET><![CDATA[hde]]></TARGET><TYPE><![CDATA[DISK]]></TYPE></DISK><DISK><DISK_ID><![CDATA[1]]></DISK_ID><READONLY><![CDATA[no]]></READONLY><SIZE><![CDATA[1024]]></SIZE><TARGET><![CDATA[hdd]]></TARGET><TYPE><![CDATA[swap]]></TYPE></DISK><EXTRA_ATT><![CDATA[EXTRA_VALUE FOR VM 3]]></EXTRA_ATT><MEMORY><![CDATA[512]]></MEMORY><NAME><![CDATA[one-3]]></NAME><NIC><BRIDGE><![CDATA[vbr0]]></BRIDGE><IP><![CDATA[192.168.3.1]]></IP><MAC><![CDATA[02:00:c0:a8:03:01]]></MAC><NETWORK><![CDATA[vnet_ranged_3]]></NETWORK><NETWORK_ID><![CDATA[3]]></NETWORK_ID></NIC><OS><INITRD><![CDATA[initrd.img]]></INITRD><KERNEL><![CDATA[vmlinuz]]></KERNEL><ROOT><![CDATA[sda]]></ROOT></OS><RANK><![CDATA[FREECPU]]></RANK><REQUIREMENTS><![CDATA[CPUSPEED > 1000]]></REQUIREMENTS><VMID><![CDATA[3]]></VMID></TEMPLATE>'),(4,5,'one-4',0,1,0,1316187928,0,'',0,0,0,0,-1,'<TEMPLATE><CONTEXT><FILES><![CDATA[/dev/null]]></FILES><TARGET><![CDATA[hdb]]></TARGET></CONTEXT><CPU><![CDATA[4]]></CPU><DISK><CLONE><![CDATA[YES]]></CLONE><DISK_ID><![CDATA[0]]></DISK_ID><IMAGE><![CDATA[image_4]]></IMAGE><IMAGE_ID><![CDATA[4]]></IMAGE_ID><READONLY><![CDATA[NO]]></READONLY><SAVE><![CDATA[NO]]></SAVE><SOURCE><![CDATA[/home/cmartin/trabajo/opennebula/install/var//images/df76114f6749fb9ef6674649c809f28054c0d125]]></SOURCE><TARGET><![CDATA[hde]]></TARGET><TYPE><![CDATA[DISK]]></TYPE></DISK><DISK><DISK_ID><![CDATA[1]]></DISK_ID><READONLY><![CDATA[no]]></READONLY><SIZE><![CDATA[1024]]></SIZE><TARGET><![CDATA[hdd]]></TARGET><TYPE><![CDATA[swap]]></TYPE></DISK><EXTRA_ATT><![CDATA[EXTRA_VALUE FOR VM 4]]></EXTRA_ATT><MEMORY><![CDATA[512]]></MEMORY><NAME><![CDATA[one-4]]></NAME><NIC><BRIDGE><![CDATA[vbr0]]></BRIDGE><IP><![CDATA[192.168.4.1]]></IP><MAC><![CDATA[02:00:c0:a8:04:01]]></MAC><NETWORK><![CDATA[vnet_ranged_4]]></NETWORK><NETWORK_ID><![CDATA[4]]></NETWORK_ID></NIC><OS><INITRD><![CDATA[initrd.img]]></INITRD><KERNEL><![CDATA[vmlinuz]]></KERNEL><ROOT><![CDATA[sda]]></ROOT></OS><RANK><![CDATA[FREECPU]]></RANK><REQUIREMENTS><![CDATA[CPUSPEED > 1000]]></REQUIREMENTS><VMID><![CDATA[4]]></VMID></TEMPLATE>');
/*!40000 ALTER TABLE `vm_pool` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2011-09-16  8:45:58
