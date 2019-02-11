package goca

import (
	"encoding/xml"
	"fmt"
)

// Common part

// UnmatchedTag contains the tag informations
type UnmatchedTag struct {
	XMLName xml.Name
	Content string `xml:",chardata"`
	//FullContent   string `xml:",innerxml"` // for debug purpose, allow to see what's inside some tags
}

// Store unmatched tags in a map
// Inspired from: https://stackoverflow.com/questions/30928770/marshall-map-to-xml-in-go/33110881

// NOTE: to be used in flat xml part with distinct tag names
// If it's not flat: the hash will contains key with empty values
// If there is several tags with the same name : only the last value will be stored

// UnmatchedTagsMap store tags not handled by Unmarshal in a map, it should be labelled with `xml",any"`
type unmatchedTagsMap map[string]string

func (m *unmatchedTagsMap) UnmarshalXML(d *xml.Decoder, start xml.StartElement) error {
	if *m == nil {
		*m = unmatchedTagsMap{}
	}

	e := UnmatchedTag{}
	err := d.DecodeElement(&e, &start)
	if err != nil {
		return err
	}

	// Fail the parsing of the whole xml
	//if _, ok := (*m)[e.XMLName.Local]; ok {
	//	return fmt.Errorf("UnmatchedTagsMap: UnmarshalXML: Tag %s:  multiple entries with the same name", e.XMLName.Local)
	//}
	(*m)[e.XMLName.Local] = e.Content

	return nil
}

func (u *unmatchedTagsMap) GetContentByName(name string) string {
	return ((map[string]string)(*u))[name]
}

// Store unmatched tags in a slice

// NOTE: to be used in flat xml part

// UnmatchedTagsSlice store tags not handled by Unmarshal in a slice, it should be labelled with `xml",any"`
type unmatchedTagsSlice struct {
	Tags []UnmatchedTag
}

func (u *unmatchedTagsSlice) UnmarshalXML(d *xml.Decoder, start xml.StartElement) error {
	var e UnmatchedTag
	err := d.DecodeElement(&e, &start)
	if err != nil {
		return err
	}

	u.Tags = append(u.Tags, e)
	return nil
}

// Retrieve slice of tags with given name
func (u *unmatchedTagsSlice) GetContentSliceByName(name string) []string {
	content := make([]string, 0, 1)
	for _, t := range u.Tags {
		if t.XMLName.Local != name {
			continue
		}
		content = append(content, t.Content)
	}
	return content
}

// Retrieve a tag with given name, fail if not present or present more than once
func (u *unmatchedTagsSlice) GetContentByName(name string) (string, error) {
	var content string
	match := false
	for _, t := range u.Tags {
		if t.XMLName.Local != name {
			continue
		}
		if match == true {
			return "", fmt.Errorf("GetContentByName: multiple entries with the name %s", name)
		}
		content = t.Content
		match = true
	}
	if match == false {
		return "", fmt.Errorf("GetContentByName: tag %s not found", name)
	}
	return content, nil
}
