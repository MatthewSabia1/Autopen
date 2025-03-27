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
    filename?: string;
  } = {}
): Promise<Blob> {
  try {
    // Throw an error if html2pdf is not available - no fallbacks in production
    if (typeof window === 'undefined') {
      throw new Error('PDF generation is only available in browser environment');
    }
    
    // Import html2pdf dynamically with better error handling
    const importHtml2pdf = async () => {
      try {
        const html2pdfModule = await import('html2pdf.js');
        return html2pdfModule.default;
      } catch (error) {
        console.error('Failed to load html2pdf.js library:', error);
        throw new Error(
          'The html2pdf.js library is not available. Please ensure it is installed by running: npm install --save html2pdf.js'
        );
      }
    };
    
    // Import html2pdf dynamically
    const html2pdf = await importHtml2pdf();
    
    // Use OpenRouter formatting function to get markdown content
    const markdownContent = formatEbookForExport(title, description, chapters);
    
    // Convert markdown to HTML
    const htmlContent = convertMarkdownToHtml(markdownContent);
    
    // Prepare filename - use the provided filename or format the title
    const safeFilename = options.filename || 
      `${title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
    
    // Configure pdf options
    const paperSize = options.paperSize || 'a4';
    const pdfOptions = {
      margin: [15, 15, 15, 15], // [top, right, bottom, left] in mm
      filename: safeFilename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2, 
        useCORS: true,
        logging: false,
        letterRendering: true
      },
      jsPDF: { 
        unit: 'mm', 
        format: paperSize,
        orientation: 'portrait'
      }
    };
    
    // Create a container element for the HTML content
    const element = document.createElement('div');
    element.className = 'pdf-container';
    element.innerHTML = htmlContent;
    document.body.appendChild(element);
    
    // Add styling to ensure content is visible in the PDF
    const style = document.createElement('style');
    style.textContent = `
      .pdf-container {
        font-family: 'Merriweather', Georgia, serif;
        line-height: 1.6;
        color: #333;
        margin: 0;
        padding: 20px;
        font-size: 11pt;
        width: 100%;
        max-width: 210mm;
        background-color: white;
      }
      .pdf-container h1 {
        page-break-before: always;
        font-size: 24pt;
        margin-top: 40px;
        margin-bottom: 20px;
        font-weight: bold;
        text-align: center;
      }
      .pdf-container h1:first-of-type {
        page-break-before: avoid;
      }
      .pdf-container h2 {
        font-size: 18pt;
        margin-top: 30px;
        margin-bottom: 15px;
        font-weight: bold;
      }
      .pdf-container p {
        margin-bottom: 15px;
        text-align: justify;
      }
    `;
    document.head.appendChild(style);
    
    // Generate PDF using html2pdf library
    const pdfBlob = await new Promise<Blob>((resolve, reject) => {
      html2pdf()
        .from(element)
        .set(pdfOptions)
        .outputPdf('blob')
        .then((blob: Blob) => {
          // Clean up by removing added elements
          document.body.removeChild(element);
          document.head.removeChild(style);
          resolve(blob);
        })
        .catch((err: any) => {
          // Make sure to clean up the DOM in case of error
          if (element.parentNode) document.body.removeChild(element);
          if (style.parentNode) document.head.removeChild(style);
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
      <title>eBook</title>
      <style>
        :root {
          --text-color: #333;
          --bg-color: #fff;
          --heading-color: #111;
          --link-color: #0066cc;
          --border-color: #ddd;
          --code-bg: #f5f5f5;
        }
        @media (prefers-color-scheme: dark) {
          :root {
            --text-color: #e0e0e0;
            --bg-color: #1a1a1a;
            --heading-color: #ffffff;
            --link-color: #3b82f6;
            --border-color: #444;
            --code-bg: #2a2a2a;
          }
        }
        body {
          font-family: 'Merriweather', Georgia, serif;
          line-height: 1.6;
          color: var(--text-color);
          background-color: var(--bg-color);
          margin: 0;
          padding: 20px;
        }
        h1, h2, h3 {
          color: var(--heading-color);
          font-weight: bold;
        }
        p {
          margin-bottom: 1em;
        }
        code {
          background-color: var(--code-bg);
          padding: 0.2em 0.4em;
          border-radius: 3px;
        }
        pre {
          background-color: var(--code-bg);
          padding: 1em;
          border-radius: 5px;
          overflow-x: auto;
        }
        blockquote {
          border-left: 3px solid var(--border-color);
          padding-left: 1em;
          font-style: italic;
        }
      </style>
    </head>
    <body>
  `;

  // Add cover page if the title is present
  if (markdown.split('\n')[0]) {
    const bookTitle = markdown.split('\n')[0].replace(/^# /, '').trim();
    html += `<div class="cover">
      <h1>${bookTitle}</h1>
    </div>`;
  }

  // Process markdown content section by section
  const sections = markdown.split('\n\n');
  
  for (const section of sections) {
    const trimmedSection = section.trim();
    if (!trimmedSection) continue;
    
    // Handle chapter headings
    if (trimmedSection.startsWith('# ')) {
      const chapterTitle = trimmedSection.replace(/^# /, '').trim();
      html += `<h1 class="chapter-title">${chapterTitle}</h1>`;
      continue;
    }
    
    // Handle headings
    if (trimmedSection.startsWith('## ')) {
      const headingText = trimmedSection.replace(/^## /, '').trim();
      html += `<h2>${headingText}</h2>`;
      continue;
    }
    
    if (trimmedSection.startsWith('### ')) {
      const headingText = trimmedSection.replace(/^### /, '').trim();
      html += `<h3>${headingText}</h3>`;
      continue;
    }
    
    // Handle bulleted lists
    if (trimmedSection.includes('\n* ')) {
      html += '<ul>';
      const listItems = trimmedSection.split('\n* ');
      
      for (let i = 0; i < listItems.length; i++) {
        // Skip empty first item before the first bullet
        if (i === 0 && !listItems[i].startsWith('* ')) {
          if (listItems[i].trim()) {
            html += `<p>${listItems[i].trim()}</p>`;
          }
          continue;
        }
        
        const item = i === 0 ? listItems[i].replace(/^\* /, '') : listItems[i];
        if (item.trim()) {
          html += `<li>${item.trim()}</li>`;
        }
      }
      
      html += '</ul>';
      continue;
    }
    
    // Handle numbered lists
    if (/\n\d+\.\s/.test(trimmedSection)) {
      html += '<ol>';
      const listItems = trimmedSection.split(/\n\d+\.\s/);
      
      for (let i = 0; i < listItems.length; i++) {
        // Skip empty first item before the first number
        if (i === 0 && !/^\d+\.\s/.test(listItems[i])) {
          if (listItems[i].trim()) {
            html += `<p>${listItems[i].trim()}</p>`;
          }
          continue;
        }
        
        const item = i === 0 ? listItems[i].replace(/^\d+\.\s/, '') : listItems[i];
        if (item.trim()) {
          html += `<li>${item.trim()}</li>`;
        }
      }
      
      html += '</ol>';
      continue;
    }
    
    // Handle regular paragraphs
    if (trimmedSection) {
      // Handle bold and italic text
      let paragraph = trimmedSection
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>');
      
      html += `<p>${paragraph}</p>`;
    }
  }

  // Close HTML
  html += '</body></html>';

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