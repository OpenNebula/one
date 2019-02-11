package goca

//import "fmt"

type Permissions struct {
	OwnerU int `xml:"OWNER_U"`
	OwnerM int `xml:"OWNER_M"`
	OwnerA int `xml:"OWNER_A"`
	GroupU int `xml:"GROUP_U"`
	GroupM int `xml:"GROUP_M"`
	GroupA int `xml:"GROUP_A"`
	OtherU int `xml:"OTHER_U"`
	OtherM int `xml:"OTHER_M"`
	OtherA int `xml:"OTHER_A"`
}

func (p *Permissions) String() string {
	permStr := [8]string{"---", "--a", "-m-", "-ma", "u--", "u-a", "um-", "uma"}
	owner := permStr[p.OwnerU<<2|p.OwnerM<<1|p.OwnerA]
	group := permStr[p.GroupU<<2|p.GroupM<<1|p.GroupA]
	other := permStr[p.OtherU<<2|p.OtherM<<1|p.OtherA]
	return owner + group + other
}
