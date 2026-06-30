package config

import "encoding/xml"

type JMdict struct {
    Entries []Entry `xml:"entry"`
}

type Entry struct {
    EntSeq string           `xml:"ent_seq"`
    KEle   []KanjiElement   `xml:"k_ele"`
    REle   []ReadingElement `xml:"r_ele"`
    Sense  []Sense          `xml:"sense"`
}

type KanjiElement struct {
    KEB   string   `xml:"keb"`
    KEInf []string `xml:"ke_inf"`
    KEPri []string `xml:"ke_pri"`
}

type ReadingElement struct {
    REB       string   `xml:"reb"`
    ReNoKanji string   `xml:"re_nokanji"`
    ReRestr   []string `xml:"re_restr"`
    ReInf     []string `xml:"re_inf"`
    RePri     []string `xml:"re_pri"`
}

type Sense struct {
    StagK   []string  `xml:"stagk"`
    StagR   []string  `xml:"stagr"`
    Pos     []string  `xml:"pos"`
    XRef    []string  `xml:"xref"`
    Ant     []string  `xml:"ant"`
    Field   []string  `xml:"field"`
    Misc    []string  `xml:"misc"`
    SInf    []string  `xml:"s_inf"`
    LSource []LSource `xml:"lsource"`
    Dial    []string  `xml:"dial"`
    Gloss   []Gloss   `xml:"gloss"`
    Example []Example `xml:"example"`
}

type LSource struct {
    Lang    string `xml:"lang,attr"`
    LSType  string `xml:"ls_type,attr"`
    LSWasei string `xml:"ls_wasei,attr"`

    Value string `xml:",chardata"`
}

type Gloss struct {
    Lang  string `xml:"lang,attr"`
    Gend  string `xml:"g_gend,attr"`
    Type  string `xml:"g_type,attr"`

    Value string `xml:",chardata"`
}

type Example struct {
    ExSrce string           `xml:"ex_srce"`
    ExText string           `xml:"ex_text"`
    ExSent []ExampleSentence `xml:"ex_sent"`
}

type ExampleSentence struct {
    Lang  string `xml:"lang,attr"`
    Value string `xml:",chardata"`
}

type Kanjidic2 struct {
	XMLName xml.Name   `xml:"kanjidic2"`
	Header  Header     `xml:"header"`
	Chars   []Character `xml:"character"`
}

type Header struct {
	FileVersion     string `xml:"file_version"`
	DatabaseVersion string `xml:"database_version"`
	DateCreated     string `xml:"date_of_creation"`
}

type Character struct {
	Literal   string    `xml:"literal"`

	Codepoint Codepoint `xml:"codepoint"`
	Radical   Radical   `xml:"radical"`
	Misc      Misc      `xml:"misc"`

	DicNumber *DicNumber      `xml:"dic_number,omitempty"`
	QueryCode *QueryCode      `xml:"query_code,omitempty"`
	ReadingMeaning *ReadingMeaning `xml:"reading_meaning,omitempty"`
}

type Codepoint struct {
	Values []CpValue `xml:"cp_value"`
}

type CpValue struct {
	Type  string `xml:"cp_type,attr"`
	Value string `xml:",chardata"`
}

type Radical struct {
	Values []RadValue `xml:"rad_value"`
}

type RadValue struct {
	Type  string `xml:"rad_type,attr"`
	Value string `xml:",chardata"`
}

type Misc struct {
	Grade       *string `xml:"grade"`
	StrokeCount []int   `xml:"stroke_count"`
	Variant     []Variant `xml:"variant,omitempty"`
	Freq        *int    `xml:"freq,omitempty"`
	RadName     []string `xml:"rad_name,omitempty"`
	JLPT        *int     `xml:"jlpt,omitempty"`
}

type Variant struct {
	Type  string `xml:"var_type,attr"`
	Value string `xml:",chardata"`
}

type DicNumber struct {
	Refs []DicRef `xml:"dic_ref"`
}

type DicRef struct {
	Type string `xml:"dr_type,attr"`
	Vol  string `xml:"m_vol,attr,omitempty"`
	Page string `xml:"m_page,attr,omitempty"`
	Value string `xml:",chardata"`
}

type QueryCode struct {
	Codes []QCode `xml:"q_code"`
}

type QCode struct {
	Type          string `xml:"qc_type,attr"`
	SkipMisclass  string `xml:"skip_misclass,attr,omitempty"`
	Value         string `xml:",chardata"`
}

type ReadingMeaning struct {
	RMGroups []RMGroup `xml:"rmgroup"`
	Nanori   []string  `xml:"nanori,omitempty"`
}

type RMGroup struct {
	Readings []Reading `xml:"reading"`
	Meanings []Meaning `xml:"meaning"`
}

type Reading struct {
	Type     string `xml:"r_type,attr"`
	OnType   string `xml:"on_type,attr,omitempty"`
	Status   string `xml:"r_status,attr,omitempty"`
	Value    string `xml:",chardata"`
}

type Meaning struct {
	Lang  string `xml:"m_lang,attr,omitempty"`
	Value string `xml:",chardata"`
}
