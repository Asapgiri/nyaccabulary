package config

import (
	"bytes"
	"encoding/json"
	"encoding/xml"
	"os"
	"path/filepath"
	"regexp"

	"github.com/asapgiri/golib/logger"
	"github.com/asapgiri/golib/session"
)

var log = logger.Logger {
    Color: logger.Colors.Yellow,
    Pretext: "config",
}

type HttpConfig struct {
    Url     string
    Port    string
    Cert    string
    Key     string
}

type DbConfig struct {
    Url     string
    Name    string
}

type UserConfig struct {
    MinUsernameLen      int
    MinPasswordLen      int
    NameCantContain     []string
}

type EmailConfig struct {
    Smtp        string
    Port        int
    Sender      string
    Email       string
    Password    string
}

type ConfigT struct {
    Http        HttpConfig
    Dbase       DbConfig
    User        UserConfig
    Site        session.Config
    Email       EmailConfig
    JMdict      JMdict          `json:"-"`
    KanjiDict   Kanjidic2       `json:"-"`
}

var Config = ConfigT{
    Http: HttpConfig{
        Url:    "",
        Port:   "3000",
        Cert:   "",
        Key:    "",
    },
    Dbase: DbConfig{
        Url:    "mongodb://localhost:27017",
        Name:   "nyaccabulary",
    },
    User: UserConfig{
        MinUsernameLen: 3,
        MinPasswordLen: 5,
        NameCantContain: []string{},
    },
    Site: session.Config{
        Title: "Nyaccabulary",
        SiteTitle: "Nyaccabulary",
        TitleSeparator: " - ",
        MaxImgUploadMB: 10,
    },
    Email: EmailConfig{
        Smtp: "smtp.example.com",
        Port: 465,
        Sender: "[organization/sender name]",
        Email: "ex@ample.com",
        Password: "[password]",
    },
    JMdict: JMdict{},
}

var entityRE = regexp.MustCompile(`<!ENTITY\s+([^\s]+)\s+"([^"]*)">`)

func ParseEntities(dtd string) map[string]string {
    entities := make(map[string]string)

    matches := entityRE.FindAllStringSubmatch(dtd, -1)
    for _, m := range matches {
        entities[m[1]] = m[2]
    }

    return entities
}

func InitConfig() {
    ex, err := os.Executable()
    if nil != err {
        panic(err)
    }
    expath := filepath.Dir(ex)
    configfile := expath + "/.config.json"
    dictfile := expath + "/dict/JMdict"
    kanjidictfile := expath + "/dict/kanjidic2.xml"

    log.Printf("Loading config.. ")
    dat, err := os.ReadFile(configfile)
    if nil != err {
        log.Println(err.Error())
        log.Printf("\nGenerating new config.. ")
        configdat, _ := json.MarshalIndent(Config, "", "  ")
        os.WriteFile(configfile, configdat, 0644)
    } else {
        err = json.Unmarshal(dat, &Config)
        if nil != err {
            log.Println(err.Error())
            log.Println("Check your `.config.json` format!")
            panic(err)
        }
    }
    log.Println("SUCCESSFUL")

    // Read dict file if no error...
    log.Printf("Loading dict.. ")
    dat, err = os.ReadFile(dictfile)
    if nil != err {
        log.Println("try: mkdir -p dict && wget -O - ftp://ftp.edrdg.org/pub/Nihongo//JMdict_e.gz | gunzip > dict/JMdict")
        panic("Dictionary file not found! ... '" + dictfile + "'")
    }
    decoder := xml.NewDecoder(bytes.NewReader(dat))
    decoder.Entity = ParseEntities(string(dat))

    err = decoder.Decode(&Config.JMdict)
    if nil != err {
        log.Println("Failed to read dictionary file!")
        panic(err)
    }
    log.Println("SUCCESSFUL")

    // Read dict file if no error...
    log.Printf("Loading kanji dict.. ")
    dat, err = os.ReadFile(kanjidictfile)
    if nil != err {
        log.Println("try: mkdir -p dict && wget -O - http://www.edrdg.org/kanjidic/kanjidic2.xml.gz | gunzip > dict/kanjidic2.xml")
        panic("Dictionary file not found! ... '" + kanjidictfile + "'")
    }
    decoder = xml.NewDecoder(bytes.NewReader(dat))
    decoder.Entity = ParseEntities(string(dat))

    err = decoder.Decode(&Config.KanjiDict)
    if nil != err {
        log.Println("Failed to read dictionary file!")
        panic(err)
    }
    log.Println("SUCCESSFUL")
}
