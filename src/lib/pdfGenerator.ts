import { logError } from './utils/debug';
import { formatEbookForExport } from './openRouter';
import { EbookChapter } from './contexts/WorkflowContext';
import { marked } from 'marked';

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
    template?: 'modern' | 'classic' | 'minimal' | 'academic';
    author?: string;
  } = {}
): Promise<Blob> {
  try {
    // Add validation for empty/invalid inputs
    if (!title || typeof title !== 'string') {
      console.error('PDF generation failed: Invalid or missing title', { title });
      throw new Error('PDF generation requires a valid title');
    }
    
    if (!chapters || !Array.isArray(chapters) || chapters.length === 0) {
      console.error('PDF generation failed: No chapters provided', { chaptersLength: chapters?.length || 0 });
      throw new Error('No ebook data available');
    }
    
    // Check if any chapters have content
    const chaptersWithContent = chapters.filter(ch => ch.content && ch.content.trim().length > 0);
    if (chaptersWithContent.length === 0) {
      console.error('PDF generation failed: All chapters are empty', { chapters: chapters.map(ch => ({ id: ch.id, title: ch.title, contentLength: ch.content?.length || 0 })) });
      throw new Error('No ebook content available');
    }
    
    // Log debug information
    console.log('Generating PDF with:', {
      title,
      description: description?.substring(0, 50) + (description?.length > 50 ? '...' : ''),
      chaptersCount: chapters.length,
      chaptersWithContentCount: chaptersWithContent.length,
      options
    });

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
    
    // Use the shared formatter from openRouter.ts
    // Pass only the necessary fields, assuming formatEbookForExport handles sorting etc.
    const markdownContent = formatEbookForExport(title, description, chapters);
    
    // Verify we have content to convert
    if (!markdownContent || markdownContent.trim().length < 50) {
      console.error('PDF generation failed: Insufficient content generated', {
        contentLength: markdownContent?.length || 0,
        firstChars: markdownContent?.substring(0, 50)
      });
      throw new Error('Failed to generate PDF content');
    }
    
    // Log markdown content size for debugging
    console.log(`PDF markdown content generated: ${markdownContent.length} characters`);
    
    // Convert markdown to HTML using marked
    const mainHtmlContent = marked.parse(markdownContent);
    
    // Prepare filename - use the provided filename or format the title
    const safeFilename = options.filename || 
      `${title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
    
    // Configure pdf options with enhanced settings
    const paperSize = options.paperSize || 'a4';
    const pdfOptions = {
      margin: [20, 20, 25, 20], // [top, right, bottom, left] in mm
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
      },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
    };
    
    // Create a container element for the HTML content
    const element = document.createElement('div');
    element.className = 'pdf-container';
    
    // Build the complete HTML content with cover and TOC
    let finalHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>${title}</title>
        <style>
          /* Base styles and template styles will be injected here */
        </style>
      </head>
      <body>
        ${options.withCover !== false ? generateCoverPage(title, options.author || 'Created with AutoPen', description) : ''}
        <div class="main-content">
          ${mainHtmlContent}
        </div>
      </body>
      </html>
    `;
    
    element.innerHTML = finalHtml;
    document.body.appendChild(element);
    
    // Add styling to ensure content is visible in the PDF with enhanced typography
    const style = document.createElement('style');
    
    // Base styles for all templates
    const baseStyles = `
      .pdf-container {
        font-family: 'Merriweather', Georgia, serif;
        line-height: 1.8;
        color: #282828;
        margin: 0;
        padding: 20px;
        font-size: 11pt;
        width: 100%;
        max-width: 210mm;
        background-color: white;
      }
      .pdf-container h1 {
        font-family: 'Montserrat', 'Arial', sans-serif;
        font-size: 24pt;
        margin-top: 40px;
        margin-bottom: 20px;
        font-weight: bold;
        text-align: center;
        page-break-before: always;
        color: #222222;
      }
      .pdf-container h1:first-of-type {
        page-break-before: avoid;
      }
      .pdf-container h2 {
        font-family: 'Montserrat', 'Arial', sans-serif;
        font-size: 18pt;
        margin-top: 30px;
        margin-bottom: 15px;
        font-weight: bold;
        color: #222222;
      }
      .pdf-container h3 {
        font-family: 'Montserrat', 'Arial', sans-serif;
        font-size: 14pt;
        margin-top: 25px;
        margin-bottom: 12px;
        font-weight: bold;
        color: #222222;
      }
      .pdf-container p {
        margin-bottom: 15px;
        text-align: justify;
        line-height: 1.8;
        color: #282828;
      }
      .pdf-container ul, .pdf-container ol {
        margin-bottom: 15px;
        padding-left: 20px;
      }
      .pdf-container li {
        margin-bottom: 8px;
        line-height: 1.6;
        color: #282828;
      }
      .pdf-container blockquote {
        margin: 20px 0;
        padding: 10px 20px;
        border-left: 4px solid #888;
        background-color: #f9f9f9;
        font-style: italic;
        color: #383838;
      }
      .pdf-container code {
        font-family: 'Courier New', monospace;
        background-color: #f5f5f5;
        padding: 2px 4px;
        border-radius: 3px;
        font-size: 0.9em;
        color: #282828;
      }
      .pdf-container pre {
        background-color: #f5f5f5;
        padding: 15px;
        border-radius: 5px;
        overflow-x: auto;
        margin-bottom: 20px;
      }
      
      /* Text formatting styles */
      .bold-text {
        font-weight: bold;
        color: #222222;
      }
      .italic-text {
        font-style: italic;
        color: #282828;
      }
      .inline-code {
        font-family: 'Courier New', monospace;
        background-color: #f5f5f5;
        padding: 2px 4px;
        border-radius: 3px;
        font-size: 0.9em;
        color: #282828;
      }
      .text-link {
        color: #0066cc;
        text-decoration: underline;
      }
      .strikethrough {
        text-decoration: line-through;
        color: #666666;
      }
      .highlight {
        background-color: #ffffcc;
        padding: 2px 0;
        color: #282828;
      }
      
      .cover-page {
        height: 100vh;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        text-align: center;
        page-break-after: always;
      }
      .book-title {
        font-family: 'Montserrat', 'Arial', sans-serif;
        font-size: 32pt;
        font-weight: bold;
        margin-bottom: 30px;
        color: #111;
      }
      .author {
        font-family: 'Merriweather', Georgia, serif;
        font-size: 16pt;
        margin-bottom: 50px;
        color: #333;
      }
      .book-description {
        font-family: 'Merriweather', Georgia, serif;
        font-size: 12pt;
        max-width: 80%;
        line-height: 1.6;
        color: #444;
        margin-top: 40px;
        font-style: italic;
      }
      .chapter-number {
        font-family: 'Montserrat', 'Arial', sans-serif;
        font-size: 14pt;
        color: #444;
        margin-bottom: 10px;
        display: block;
      }
      .page-number {
        position: absolute;
        bottom: 10mm;
        right: 10mm;
        font-size: 9pt;
        color: #555;
      }
      
      /* Table of Contents Styles */
      .table-of-contents {
        page-break-after: always;
        padding: 40px 20px;
      }
      .toc-title {
        font-family: 'Montserrat', 'Arial', sans-serif;
        font-size: 24pt;
        text-align: center;
        margin-bottom: 40px;
        page-break-before: avoid;
        color: #222222;
      }
      .toc-entries {
        margin-top: 20px;
      }
      .toc-entry {
        display: flex;
        align-items: center;
        margin-bottom: 15px;
        font-family: 'Merriweather', Georgia, serif;
        font-size: 11pt;
        color: #282828;
      }
      .toc-chapter {
        min-width: 30px;
        margin-right: 10px;
        font-weight: bold;
        color: #282828;
      }
      .toc-chapter-title {
        flex-grow: 1;
        color: #282828;
      }
      .toc-dots {
        flex-grow: 1;
        margin: 0 5px;
        border-bottom: 1px dotted #888;
        height: 1px;
        margin-top: 7px;
      }
      .toc-page {
        margin-left: 10px;
        font-variant-numeric: tabular-nums;
        color: #282828;
      }
    `;
    
    // Template-specific styles
    const templateStyles = {
      modern: `
        .pdf-container h1 {
          font-family: 'Montserrat', 'Arial', sans-serif;
          color: #1E293B;
          border-bottom: 1px solid #E2E8F0;
          padding-bottom: 10px;
        }
        .pdf-container h2 {
          color: #334155;
        }
        .pdf-container h3 {
          color: #334155;
        }
        .pdf-container p, .pdf-container li {
          color: #1E293B;
        }
        .pdf-container blockquote {
          border-left: 4px solid #3B82F6;
          background-color: #EBF8FF;
          color: #1E293B;
        }
        .cover-page {
          background: linear-gradient(to bottom right, #EBF8FF, #ffffff);
        }
        .book-title {
          color: #1E4A8A;
        }
        .author {
          color: #334155;
        }
        .book-description {
          color: #334155;
        }
        .chapter-number {
          color: #3B82F6;
        }
        .toc-title {
          color: #1E293B;
          border-bottom: 1px solid #E2E8F0;
          padding-bottom: 10px;
        }
        .toc-chapter {
          color: #3B82F6;
        }
        .toc-chapter-title, .toc-page {
          color: #1E293B;
        }
      `,
      classic: `
        .pdf-container {
          font-family: 'Baskerville', 'Libre Baskerville', Georgia, serif;
        }
        .pdf-container h1, .pdf-container h2, .pdf-container h3 {
          font-family: 'Baskerville', 'Libre Baskerville', Georgia, serif;
        }
        .pdf-container h1 {
          color: #3D3D3D;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .pdf-container h2 {
          color: #3D3D3D;
        }
        .pdf-container p {
          text-align: justify;
          text-indent: 25px;
        }
        .pdf-container p:first-of-type {
          text-indent: 0;
        }
        .pdf-container blockquote {
          border-left: 1px solid #3D3D3D;
          font-style: italic;
          background-color: #f8f8f8;
        }
        .cover-page {
          background-color: #F5F5F5;
        }
        .book-title {
          text-transform: uppercase;
          letter-spacing: 2px;
        }
        .toc-title {
          font-family: 'Baskerville', 'Libre Baskerville', Georgia, serif;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .toc-entry {
          font-family: 'Baskerville', 'Libre Baskerville', Georgia, serif;
        }
        .toc-dots {
          border-bottom: 1px dotted #777;
        }
      `,
      minimal: `
        .pdf-container {
          font-family: 'Inter', 'Helvetica', 'Arial', sans-serif;
          line-height: 1.7;
        }
        .pdf-container h1, .pdf-container h2, .pdf-container h3 {
          font-family: 'Inter', 'Helvetica', 'Arial', sans-serif;
          font-weight: 600;
        }
        .pdf-container h1 {
          font-size: 26pt;
          color: #000;
          text-align: left;
          border-bottom: 3px solid #000;
          padding-bottom: 8px;
        }
        .pdf-container h2 {
          color: #000;
          font-size: 16pt;
        }
        .pdf-container p, .pdf-container li {
          font-size: 11pt;
        }
        .pdf-container blockquote {
          border-left: 3px solid #000;
          background-color: transparent;
          padding-left: 15px;
        }
        .cover-page {
          text-align: left;
          padding: 15% 10%;
          align-items: flex-start;
        }
        .book-title {
          font-size: 36pt;
          margin-bottom: 50px;
          text-align: left;
        }
        .author {
          text-align: left;
          margin-bottom: 100px;
        }
        .book-description {
          text-align: left;
          font-style: normal;
          max-width: 100%;
        }
        .toc-title {
          font-family: 'Inter', 'Helvetica', 'Arial', sans-serif;
          font-size: 26pt;
          text-align: left;
          border-bottom: 3px solid #000;
          padding-bottom: 8px;
        }
        .toc-entry {
          font-family: 'Inter', 'Helvetica', 'Arial', sans-serif;
        }
        .toc-dots {
          display: none;
        }
        .toc-page {
          font-weight: bold;
        }
      `,
      academic: `
        .pdf-container {
          font-family: 'Times New Roman', Times, serif;
          line-height: 1.5;
        }
        .pdf-container h1 {
          font-family: 'Times New Roman', Times, serif;
          text-align: center;
          font-size: 18pt;
          font-weight: bold;
        }
        .pdf-container h2 {
          font-size: 14pt;
          font-weight: bold;
        }
        .pdf-container h3 {
          font-size: 12pt;
          font-weight: bold;
          font-style: italic;
        }
        .pdf-container p {
          text-align: justify;
          line-height: 1.6;
          font-size: 12pt;
        }
        .pdf-container .footnote {
          font-size: 10pt;
          margin-top: 30px;
          padding-top: 10px;
          border-top: 1px solid #000;
        }
        .cover-page {
          text-align: center;
        }
        .book-title {
          font-family: 'Times New Roman', Times, serif;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .toc-title {
          font-family: 'Times New Roman', Times, serif;
        }
        .toc-entry {
          font-family: 'Times New Roman', Times, serif;
          line-height: 1.8;
        }
      `
    };
    
    // Apply the selected template, defaulting to 'modern'
    const template = options.template || 'modern';
    style.textContent = baseStyles + (templateStyles[template] || templateStyles.modern);
    
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
 * Generate a cover page for the PDF
 */
function generateCoverPage(title: string, author: string, description: string): string {
  return `
    <div class="cover-page">
      <h1 class="book-title">${title}</h1>
      <div class="author">${author}</div>
      <div class="book-description">${description}</div>
    </div>
  `;
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
      const htmlContent = marked.parse(chapter.content);
      
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
  // Use the shared formatter directly here as well (was already doing this via alias)
  const markdownContent = formatEbookForExport(title, description, chapters);
  return new Blob([markdownContent], { type: 'text/markdown' });
}