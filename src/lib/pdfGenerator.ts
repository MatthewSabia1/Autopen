import { logError } from './utils/debug';
import { formatEbookForExport } from './openRouter';
import { EbookChapter } from './contexts/WorkflowContext';

/**
 * Generate a PDF from markdown content
 * 
 * Uses html2pdf.js library for high-quality PDF generation
 */
export async function generatePdf(
  title: string,
  description: string,
  chapters: EbookChapter[],
  options: {
    paperSize?: 'a4' | 'letter';
    withCover?: boolean;
    includeTableOfContents?: boolean;
  } = {}
): Promise<Blob> {
  try {
    // Throw an error if html2pdf is not available - no fallbacks in production
    if (typeof window === 'undefined') {
      throw new Error('PDF generation is only available in browser environment');
    }
    
    // Import html2pdf dynamically
    const html2pdfModule = await import('html2pdf.js');
    const html2pdf = html2pdfModule.default;
    
    // Use OpenRouter formatting function to get markdown content
    const markdownContent = formatEbookForExport(title, description, chapters);
    
    // Convert markdown to HTML
    const htmlContent = convertMarkdownToHtml(markdownContent);
    
    // Configure pdf options
    const paperSize = options.paperSize || 'a4';
    const pdfOptions = {
      margin: [15, 15, 15, 15], // [top, right, bottom, left] in mm
      filename: `${title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { 
        unit: 'mm', 
        format: paperSize,
        orientation: 'portrait'
      }
    };
    
    // Create a container element for the HTML content
    const element = document.createElement('div');
    element.innerHTML = htmlContent;
    document.body.appendChild(element);
    
    // Generate PDF using html2pdf library
    const pdfBlob = await new Promise<Blob>((resolve, reject) => {
      html2pdf()
        .from(element)
        .set(pdfOptions)
        .outputPdf('blob')
        .then((blob: Blob) => {
          // Remove the element from the DOM after PDF creation
          document.body.removeChild(element);
          resolve(blob);
        })
        .catch((err: any) => {
          // Make sure to clean up the DOM in case of error
          document.body.removeChild(element);
          reject(err);
        });
    });
    
    return pdfBlob;
  } catch (error: any) {
    logError('generatePdf', error);
    throw new Error(`Failed to generate PDF: ${error.message}`);
  }
}

/**
 * Convert markdown to HTML
 * This is a simple implementation - for production use a proper markdown parser
 */
function convertMarkdownToHtml(markdown: string): string {
  let html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <style>
        body {
          font-family: 'Merriweather', Georgia, serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 20px;
          font-size: 11pt;
        }
        h1 {
          font-size: 24pt;
          margin-top: 40px;
          margin-bottom: 20px;
          page-break-before: always;
          font-weight: bold;
          text-align: center;
        }
        h1:first-of-type {
          page-break-before: avoid;
        }
        h2 {
          font-size: 18pt;
          margin-top: 30px;
          margin-bottom: 15px;
          font-weight: bold;
        }
        h3 {
          font-size: 14pt;
          margin-top: 25px;
          margin-bottom: 10px;
          font-weight: bold;
        }
        p {
          margin-bottom: 15px;
          text-align: justify;
        }
        ul, ol {
          margin-bottom: 15px;
          padding-left: 30px;
        }
        li {
          margin-bottom: 5px;
        }
        .cover {
          height: 100vh;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          text-align: center;
          page-break-after: always;
        }
        .cover h1 {
          font-size: 32pt;
          margin-bottom: 20px;
        }
        .cover p {
          font-size: 14pt;
          max-width: 80%;
          text-align: center;
        }
        .toc {
          margin-bottom: 40px;
          page-break-after: always;
        }
        .toc h2 {
          text-align: center;
        }
        .toc ul {
          list-style-type: none;
        }
        .toc li {
          margin-bottom: 8px;
        }
        .page-break {
          page-break-before: always;
        }
        .chapter {
          page-break-before: always;
        }
        .chapter:first-of-type {
          page-break-before: avoid;
        }
      </style>
    </head>
    <body>
  `;

  // Add cover page if requested
  html += `<div class="cover">
    <h1>${markdown.split('\n')[0].replace(/^# /, '')}</h1>
  </div>`;

  // Process markdown content
  let content = markdown
    // Headers
    .replace(/^# (.*$)/gm, '<h1>$1</h1>')
    .replace(/^## (.*$)/gm, '<h2>$1</h2>')
    .replace(/^### (.*$)/gm, '<h3>$1</h3>')
    
    // Bold and italic
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    
    // Lists
    .replace(/^\s*\n\* (.*)/gm, '<ul>\n<li>$1</li>')
    .replace(/^\* (.*)/gm, '<li>$1</li>')
    .replace(/^\s*\n(\d+\. .*)/gm, '<ol>\n<li>$1</li>')
    .replace(/^(\d+\. .*)/gm, '<li>$1</li>')
    .replace(/<\/ul>\s*\n<ul>/g, '')
    .replace(/<\/ol>\s*\n<ol>/g, '')
    
    // Paragraphs
    .replace(/^\s*\n(?!\<)/gm, '</p>\n<p>')
    
    // Fix beginning and ending paragraph tags
    .replace(/^<\/p>/g, '')
    .replace(/<p>$/g, '');

  // Wrap in paragraph tags if it doesn't start with a tag
  if (!content.startsWith('<')) {
    content = '<p>' + content;
  }
  // Add closing paragraph tag if needed
  if (!content.endsWith('>')) {
    content += '</p>';
  }

  // Close HTML
  html += content + '</body></html>';

  return html;
}

/**
 * Generate EPUB format
 * Uses JSZip for in-browser EPUB creation
 */
export async function generateEpub(
  title: string,
  description: string,
  chapters: EbookChapter[]
): Promise<Blob> {
  try {
    // Check for browser environment
    if (typeof window === 'undefined') {
      throw new Error('This EPUB generator is designed for browser environments');
    }
    
    // Dynamically import JSZip (should be added as a dependency)
    const JSZip = (await import('jszip')).default;
    
    // Create a new ZIP file (EPUB is a ZIP file with specific structure)
    const zip = new JSZip();
    
    // Add mimetype file (must be first and uncompressed)
    zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' });
    
    // Add META-INF/container.xml
    zip.folder('META-INF')?.file('container.xml', 
      '<?xml version="1.0" encoding="UTF-8"?>' +
      '<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">' +
      '<rootfiles>' +
      '<rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>' +
      '</rootfiles>' +
      '</container>'
    );
    
    // Create OEBPS folder for content
    const oebps = zip.folder('OEBPS');
    
    // Add CSS stylesheet
    oebps?.file('stylesheet.css', 
      'body { font-family: serif; margin: 5%; line-height: 1.6; }' +
      'h1 { text-align: center; margin: 1em 0; }' +
      'h2 { margin-top: 2em; }' +
      'p { margin: 1em 0; text-align: justify; }' +
      '.title { text-align: center; margin-top: 30%; }' +
      '.author { text-align: center; margin-top: 5em; }' +
      '.toc-header { margin-bottom: 2em; }' +
      '.chapter { page-break-before: always; }'
    );
    
    // Generate unique ID for the EPUB
    const uuid = 'urn:uuid:' + Date.now() + '-' + Math.random().toString(36).substring(2, 15);
    
    // Prepare TOC entries
    let tocEntries = '';
    let manifestItems = '';
    let spineItems = '';
    
    // Add cover page
    const coverHTML = 
      '<?xml version="1.0" encoding="UTF-8"?>' +
      '<!DOCTYPE html>' +
      '<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">' +
      '<head>' +
      '<meta charset="UTF-8"/>' +
      '<title>' + escapeXml(title) + '</title>' +
      '<link rel="stylesheet" type="text/css" href="stylesheet.css"/>' +
      '</head>' +
      '<body>' +
      '<h1 class="title">' + escapeXml(title) + '</h1>' +
      '<p class="author">Generated with AutoPen</p>' +
      '<p>' + escapeXml(description) + '</p>' +
      '</body>' +
      '</html>';
    
    oebps?.file('cover.xhtml', coverHTML);
    manifestItems += '<item id="cover" href="cover.xhtml" media-type="application/xhtml+xml"/>';
    spineItems += '<itemref idref="cover"/>';
    
    // Add TOC page
    let tocHTML = 
      '<?xml version="1.0" encoding="UTF-8"?>' +
      '<!DOCTYPE html>' +
      '<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">' +
      '<head>' +
      '<meta charset="UTF-8"/>' +
      '<title>Table of Contents</title>' +
      '<link rel="stylesheet" type="text/css" href="stylesheet.css"/>' +
      '</head>' +
      '<body>' +
      '<h1 class="toc-header">Table of Contents</h1>' +
      '<nav epub:type="toc" id="toc">' +
      '<ol>';
    
    // Sort chapters by order_index
    const sortedChapters = [...chapters].sort((a, b) => a.order_index - b.order_index);
    
    // Add each chapter
    sortedChapters.forEach((chapter, index) => {
      if (!chapter.content) return;
      
      const chapterFileName = `chapter-${index + 1}.xhtml`;
      const chapterId = `chapter-${index + 1}`;
      
      // Add to TOC entries
      tocEntries += 
        '<navPoint id="' + chapterId + '" playOrder="' + (index + 2) + '">' +
        '<navLabel><text>' + escapeXml(chapter.title) + '</text></navLabel>' +
        '<content src="' + chapterFileName + '"/>' +
        '</navPoint>';
      
      // Add to TOC HTML
      tocHTML += '<li><a href="' + chapterFileName + '">' + escapeXml(chapter.title) + '</a></li>';
      
      // Add to manifest and spine
      manifestItems += '<item id="' + chapterId + '" href="' + chapterFileName + '" media-type="application/xhtml+xml"/>';
      spineItems += '<itemref idref="' + chapterId + '"/>';
      
      // Generate chapter HTML content
      const htmlContent = convertMarkdownToHtml(chapter.content);
      
      // Create chapter file
      const chapterHTML = 
        '<?xml version="1.0" encoding="UTF-8"?>' +
        '<!DOCTYPE html>' +
        '<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">' +
        '<head>' +
        '<meta charset="UTF-8"/>' +
        '<title>' + escapeXml(chapter.title) + '</title>' +
        '<link rel="stylesheet" type="text/css" href="stylesheet.css"/>' +
        '</head>' +
        '<body class="chapter">' +
        '<h1>' + escapeXml(chapter.title) + '</h1>' +
        htmlContent +
        '</body>' +
        '</html>';
      
      oebps?.file(chapterFileName, chapterHTML);
    });
    
    // Complete TOC HTML
    tocHTML += '</ol></nav></body></html>';
    oebps?.file('toc.xhtml', tocHTML);
    
    // Add to manifest and spine
    manifestItems += '<item id="toc" href="toc.xhtml" media-type="application/xhtml+xml" properties="nav"/>';
    spineItems += '<itemref idref="toc"/>';
    
    // Add NCX file (legacy TOC for older readers)
    const ncxContent = 
      '<?xml version="1.0" encoding="UTF-8"?>' +
      '<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">' +
      '<head>' +
      '<meta name="dtb:uid" content="' + uuid + '"/>' +
      '</head>' +
      '<docTitle><text>' + escapeXml(title) + '</text></docTitle>' +
      '<navMap>' +
      '<navPoint id="cover" playOrder="1">' +
      '<navLabel><text>Cover</text></navLabel>' +
      '<content src="cover.xhtml"/>' +
      '</navPoint>' +
      tocEntries +
      '</navMap>' +
      '</ncx>';
    
    oebps?.file('toc.ncx', ncxContent);
    manifestItems += '<item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>';
    
    // Add content.opf (metadata and manifest)
    const opfContent = 
      '<?xml version="1.0" encoding="UTF-8"?>' +
      '<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="BookId">' +
      '<metadata xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:opf="http://www.idpf.org/2007/opf">' +
      '<dc:identifier id="BookId">' + uuid + '</dc:identifier>' +
      '<dc:title>' + escapeXml(title) + '</dc:title>' +
      '<dc:creator>AutoPen</dc:creator>' +
      '<dc:language>en</dc:language>' +
      '<dc:date>' + new Date().toISOString().split('T')[0] + '</dc:date>' +
      '<meta property="dcterms:modified">' + new Date().toISOString().replace(/\.\d+Z$/, 'Z') + '</meta>' +
      '</metadata>' +
      '<manifest>' +
      '<item id="stylesheet" href="stylesheet.css" media-type="text/css"/>' +
      manifestItems +
      '</manifest>' +
      '<spine toc="ncx">' +
      spineItems +
      '</spine>' +
      '</package>';
    
    oebps?.file('content.opf', opfContent);
    
    // Generate the EPUB file as a blob
    const epubBlob = await zip.generateAsync({ 
      type: 'blob',
      mimeType: 'application/epub+zip',
      compression: 'DEFLATE',
      compressionOptions: { level: 9 }
    });
    
    return epubBlob;
  } catch (error: any) {
    logError('generateEpub', error);
    throw new Error(`Failed to generate EPUB: ${error.message}`);
  }
}

// Helper function to escape XML special characters
function escapeXml(unsafe: string): string {
  return unsafe.replace(/[&<>"']/g, (m) => {
    switch (m) {
      case '&': return '&amp;';
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '"': return '&quot;';
      case "'": return '&apos;';
      default: return m;
    }
  });
}

/**
 * Generate markdown file for download
 */
export function generateMarkdown(
  title: string,
  description: string,
  chapters: EbookChapter[]
): Blob {
  const markdownContent = formatEbookForExport(title, description, chapters);
  return new Blob([markdownContent], { type: 'text/markdown' });
}