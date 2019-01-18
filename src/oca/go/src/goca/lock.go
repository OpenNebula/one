package goca

type Lock struct {
	Locked int `xml:"LOCKED"`
	Owner  int `xml:"OWNER"`
	Time   int `xml:"TIME"`
	ReqID  int `xml:"REQ_ID"`
}
