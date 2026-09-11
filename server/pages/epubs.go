package pages

import (
	"archive/zip"
	"bytes"
	"encoding/xml"
	"fmt"
	"image"
	"image/color"
	"image/png"
	"io"
	"math/rand"
	"net/http"
	"nyaccabulary/server/logic"
	"os"
	"strings"
	"time"

	"golang.org/x/image/font"
	"golang.org/x/image/font/opentype"
	"golang.org/x/image/math/fixed"
)

const (
	pageWidth  = 528
	pageHeight = 792

	fontSize  = 86
	cellSize  = 94
	margin    = 20

	japaneseFontPath = "fonts/UDDigiKyokashoNK-R-03.ttf"
)

func renderJapaneseImage(text string) ([]byte, error) {
	fontData, err := os.ReadFile(japaneseFontPath)
	if err != nil {
		return nil, err
	}

	ttf, err := opentype.Parse(fontData)
	if err != nil {
		return nil, err
	}

	face, err := opentype.NewFace(ttf, &opentype.FaceOptions{
		Size:    fontSize,
		DPI:     72,
		Hinting: font.HintingFull,
	})
	if err != nil {
		return nil, err
	}
	defer face.Close()

	runes := []rune(text)

	// How many characters fit in one vertical column.
	maxChars := (pageHeight - margin*2) / cellSize

	if maxChars <= 0 {
		return nil, fmt.Errorf("invalid page dimensions")
	}

	// Split text into vertical columns.
	var columns [][]rune

	for len(runes) > 0 {
		n := maxChars
		if len(runes) < n {
			n = len(runes)
		}

		columns = append(columns, runes[:n])
		runes = runes[n:]
	}

	// Calculate dimensions of the text block.
	totalWidth := len(columns) * cellSize

	maxHeight := 0
	for _, column := range columns {
		height := len(column) * cellSize
		if height > maxHeight {
			maxHeight = height
		}
	}

	// Center the entire block.
	startX := (pageWidth - totalWidth) / 2
	startY := (pageHeight - maxHeight) / 2

	// Create white background.
	img := image.NewRGBA(
		image.Rect(0, 0, pageWidth, pageHeight),
	)

	// for y := 0; y < pageHeight; y++ {
	// 	for x := 0; x < pageWidth; x++ {
	// 		img.Set(x, y, color.White)
	// 	}
	// }

	d := &font.Drawer{
		Dst:  img,
		Src:  image.NewUniform(color.Black),
		Face: face,
	}

	// Draw columns from RIGHT to LEFT.
	for columnIndex, column := range columns {

		x := startX + totalWidth -
			(columnIndex+1)*cellSize

		for charIndex, r := range column {

			y := startY + charIndex*cellSize

			// Get glyph dimensions.
			bounds, _ := font.BoundString(face, string(r))

			glyphWidth := (bounds.Max.X - bounds.Min.X).Ceil()
			glyphHeight := (bounds.Max.Y - bounds.Min.Y).Ceil()

			// Center glyph horizontally in its cell.
			glyphX := x + (cellSize-glyphWidth)/2

			// font.Drawer uses the baseline as Y.
			glyphY := y + (cellSize+glyphHeight)/2

			d.Dot = fixed.P(glyphX, glyphY)
			d.DrawString(string(r))
		}
	}

	// Encode PNG.
	var buf bytes.Buffer

	if err := png.Encode(&buf, img); err != nil {
		return nil, err
	}

	return buf.Bytes(), nil
}

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

func generateWordXHTML(w logic.Word, imagePath string) string {
    var kanjis strings.Builder

	for _, kanji := range w.Kanjis {
		on := ""
		if len(kanji.On) > 0 {
			on = "・" + strings.Join(kanji.On, ", ")
		}

		kun := ""
		if len(kanji.Kun) > 0 {
			kun = "・" + strings.Join(kanji.Kun, ", ")
		}

		meaning := ""
		if len(kanji.Meaning) > 0 {
			meaning = strings.Join(kanji.Meaning, ", ")
		}

		jlpt := ""

		if kanji.DictForm.Misc.JLPT != nil {
			jlpt = "・" + fmt.Sprintf(`N%d`, *kanji.DictForm.Misc.JLPT)
		}

		kanjis.WriteString(fmt.Sprintf(`
<div>
    ---<br/>
    <strong>%s</strong> %s %s %s<br/>
    %s
</div>`,
			escapeHTML(kanji.Kanji),
			jlpt,
			escapeHTML(kun),
			escapeHTML(on),
			escapeHTML(meaning),
		))
	}

	return fmt.Sprintf(`<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
<title>%s</title>
<style>
.page {
	width: 100%%;
	height: 100%%;
	display: block;
}
</style>
</head>
<body>

<img class="page" src="../%s" alt="%s"/>

<div>
    %s<br/>
    <strong>%s</strong><br/>
    %s<br/>
    %s<br/>
</div>

%s

</body>
</html>`,
		escapeHTML(w.Kanji),
		escapeHTML(imagePath),
		escapeHTML(w.Kanji),
		escapeHTML(w.Status),
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

    start := time.Now()

	for i, word := range words {
		n := i + 1
		id := fmt.Sprintf("word-%d", n)
		filename := fmt.Sprintf("pages/%s.xhtml", id)
        imageFilename := fmt.Sprintf("images/%s.png", id)

        imageData, err := renderJapaneseImage(word.Kanji)
        if nil != err {
            return
        }

        imageFile, err := zw.Create("OEBPS/" + imageFilename)
        if err != nil {
            return
        }

        if _, err := imageFile.Write(imageData); err != nil {
            return
        }

		if err = zipWrite(
			zw,
			"OEBPS/"+filename,
			generateWordXHTML(word, imageFilename),
		); err != nil {
			return
		}

		manifest.WriteString(fmt.Sprintf(
			`<item id="%s-img" href="%s" media-type="image/png"/>`,
			id,
			imageFilename,
		))

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

    fmt.Printf("Generate epub time: %v\n", time.Since(start))


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
