package config

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
