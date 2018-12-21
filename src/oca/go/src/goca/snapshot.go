package goca

// An user can take snapshot on VM, or on VM disks

// Common part
type snapshot struct {
	Children string `xml:"CHILDREN"` //minOccur=0
	Active   string `xml:"ACTIVE"`   //minOccur=0
	Date     int    `xml:"DATE"`
	ID       int    `xml:"ID"`
	Name     string `xml:"NAME"` //minOccur=0
	Parent   int    `xml:"PARENT"`
	Size     int    `xml:"SIZE"`
}

// Image entity related
type ImageSnapshot struct {
	AllowOrphans string     `xml:"ALLOW_ORPHANS"`
	CurrentBase  int        `xml:"CURRENT_BASE"`
	NextSnapshot int        `xml:"NEXT_SNAPSHOT"`
	Snapshots    []snapshot `xml:"SNAPSHOT"`
}

// VM entity related
type VMSnapshot struct {
	HypervisorID string `xml:"HYPERVISOR_ID"`
	Name         string `xml:"NAME"`
	ID           int    `xml:"SNAPSHOT_ID"`
	Time         string `xml:"TIME"`
}

type vmHistoryRecordSnapshot struct {
	ImageSnapshot
	DiskID int `xml:"DISK_ID"`
}

type vmMonitoringSnapshotSize struct {
	DiskID int `xml:"DISK_ID"`
	Size   int `xml:"SIZE"`
}
