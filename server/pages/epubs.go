package pages

import (
	"archive/zip"
	"bytes"
	"encoding/xml"
	"fmt"
	"io"
	"math/rand"
	"net/http"
	"nyaccabulary/server/logic"
	"strings"
	"time"
)

func escapeHTML(s string) string {
	var b bytes.Buffer
	xml.Escape(&b, []byte(s))
	return b.String()
}

func zipWrite(zw *zip.Writer, name, data string) error {
	f, err := zw.Create(name)
	if err != nil {
		return err
	}

	_, err = f.Write([]byte(data))
	return err
}

func generateWordXHTML(w logic.Word) string {
    var kanjis strings.Builder

	for _, kanji := range w.Kanjis {
		on := "-"
		if len(kanji.On) > 0 {
			on = strings.Join(kanji.On, ", ")
		}

		kun := "-"
		if len(kanji.Kun) > 0 {
			kun = strings.Join(kanji.Kun, ", ")
		}

		meaning := "-"
		if len(kanji.Meaning) > 0 {
			meaning = strings.Join(kanji.Meaning, ", ")
		}

		jlpt := ""

		if kanji.DictForm.Misc.JLPT != nil {
			jlpt = fmt.Sprintf(`N%d`, *kanji.DictForm.Misc.JLPT)
		}

		kanjis.WriteString(fmt.Sprintf(`
<div>
    ---<br/>
    <strong>%s</strong> %s<br/>
    <strong>On:</strong> %s<br/>
    <strong>Kun:</strong> %s<br/>
    %s
</div>`,
			escapeHTML(kanji.Kanji),
			jlpt,
			escapeHTML(on),
			escapeHTML(kun),
			escapeHTML(meaning),
		))
	}

    var status = "-"
    if logic.MASTERY.MASTERED == w.Status {
        status = "o"
    } else if logic.MASTERY.LEARNING == w.Status {
        status = "+"
    }


	return fmt.Sprintf(`<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
<title>%s</title>
</head>
<body>

<div>
    === %s<br/>
    <strong>%s</strong><br/>
    %s<br/>
    %s<br/>
    %s
</div>

</body>
</html>`,
		escapeHTML(w.Kanji),
		escapeHTML(status),
		escapeHTML(w.Kanji),
		escapeHTML(w.Kana),
		escapeHTML(w.Meaning),
        kanjis.String(),
	)
}

func generateOPF(manifest, spine string) string {
	return fmt.Sprintf(`<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf"
version="3.0"
unique-identifier="book-id">

<metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
<dc:identifier id="book-id">japanese-words</dc:identifier>
<dc:title>Japanese Words</dc:title>
<dc:language>ja</dc:language>
<meta property="dcterms:modified">%s</meta>
<meta property="rendition:layout">pre-paginated</meta>
<meta property="rendition:orientation">portrait</meta>
<meta property="rendition:spread">none</meta>
</metadata>

<manifest>
%s
</manifest>

<spine page-progression-direction="ltr">
%s
</spine>

</package>`,
		time.Now().UTC().Format("2006-01-02T15:04:05Z"),
		manifest,
		spine,
	)
}

func containerXML() string {
	return `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0"
xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
<rootfiles>
<rootfile full-path="OEBPS/content.opf"
media-type="application/oebps-package+xml"/>
</rootfiles>
</container>`
}

func WordsPdfCards(w http.ResponseWriter, r *http.Request) {
	session := GetCurrentSession(w, r)

	if session.Auth.Username == "" {
		AccessViolation(w, r)
		return
	}

	words := pdfWordCollector(session, r.PathValue("filter"))

	rand.Shuffle(len(words), func(i, j int) {
		words[i], words[j] = words[j], words[i]
	})

	var buf bytes.Buffer
	zw := zip.NewWriter(&buf)

	f, err := zw.CreateHeader(&zip.FileHeader{
		Name:   "mimetype",
		Method: zip.Store,
	})
	if err != nil {
		return
	}

	if _, err = f.Write([]byte("application/epub+zip")); err != nil {
		return
	}

	if err = zipWrite(
		zw,
		"META-INF/container.xml",
		containerXML(),
	); err != nil {
		return
	}

	var manifest, spine, nav strings.Builder

	nav.WriteString(`<ol>`)

	for i, word := range words {
		n := i + 1
		id := fmt.Sprintf("word-%d", n)
		filename := fmt.Sprintf("pages/%s.xhtml", id)

		if err = zipWrite(
			zw,
			"OEBPS/"+filename,
			generateWordXHTML(word),
		); err != nil {
			return
		}

		manifest.WriteString(fmt.Sprintf(
			`<item id="%s" href="%s" media-type="application/xhtml+xml"/>`,
			id,
			filename,
		))

		spine.WriteString(fmt.Sprintf(
			`<itemref idref="%s"/>`,
			id,
		))

		nav.WriteString(fmt.Sprintf(
			`<li><a href="%s">%s</a></li>`,
			filename,
			escapeHTML(word.Kanji),
		))
	}

	nav.WriteString(`</ol>`)

	navXHTML := fmt.Sprintf(`<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml"
xmlns:epub="http://www.idpf.org/2007/ops">
<head>
<title>Japanese Words</title>
</head>
<body>
<nav epub:type="toc">
<h1>Words</h1>
%s
</nav>
</body>
</html>`,
		nav.String(),
	)

	if err = zipWrite(zw, "OEBPS/nav.xhtml", navXHTML); err != nil {
		return
	}

	manifest.WriteString(
		`<item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>`,
	)

	if err = zipWrite(
		zw,
		"OEBPS/content.opf",
		generateOPF(manifest.String(), spine.String()),
	); err != nil {
		return
	}

	if err = zw.Close(); err != nil {
		return
	}

	w.Header().Set("Content-Type", "application/epub+zip")
	w.Header().Set(
		"Content-Disposition",
		`inline; filename="words.epub"`,
	)

	_, _ = io.Copy(w, &buf)
}
