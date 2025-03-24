import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { EbookContent, EbookChapter } from '../types/ebook.types';

/**
 * Service for generating PDF files from eBook content
 */
export class PDFGeneratorService {
  // Default settings
  private static readonly DEFAULT_FONT = 'helvetica';
  private static readonly TITLE_FONT_SIZE = 28; // Increased for more prominence
  private static readonly HEADING_FONT_SIZE = 20; // Increased for better hierarchy
  private static readonly SUBHEADING_FONT_SIZE = 16; // Increased for better readability
  private static readonly BODY_FONT_SIZE = 12;
  private static readonly FOOTER_FONT_SIZE = 10;
  private static readonly MARGIN = 20;
  private static readonly HEADER_MARGIN = 12; // Top margin for headers
  private static readonly LINE_HEIGHT = 1.5;
  private static readonly PAGE_WIDTH = 210; // A4 width in mm
  private static readonly PAGE_HEIGHT = 297; // A4 height in mm
  private static readonly CONTENT_WIDTH = 210 - (2 * this.MARGIN); // Content width accounting for margins
  private static readonly TEXT_COLOR = [0, 0, 0]; // Black text
  private static readonly ACCENT_COLOR = [25, 108, 166]; // Blue accent for headings

  /**
   * Generate a PDF from eBook content
   * @param ebookContent The eBook content
   * @returns The generated PDF as a Blob
   */
  public static generateEbookPDF(ebookContent: EbookContent): Blob {
    // Initialize PDF document (A4 size)
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Set default font
    doc.setFont(this.DEFAULT_FONT);
    
    // Track current Y position
    let yPos = this.MARGIN;
    let pageNumber = 1;
    
    // Create pt to mm conversion helper
    const ptToMm = (pt: number) => pt * 0.352778;
    
    // Add header to each page
    const addHeader = (title: string) => {
      doc.setFontSize(this.FOOTER_FONT_SIZE);
      doc.setTextColor(100, 100, 100); // Lighter gray for header
      doc.text(title, this.MARGIN, 10);
    };
    
    // Add footer to each page
    const addFooter = () => {
      doc.setFontSize(this.FOOTER_FONT_SIZE);
      doc.setTextColor(100, 100, 100); // Lighter gray for footer
      doc.text(`Page ${pageNumber}`, this.PAGE_WIDTH / 2, 287, { align: 'center' });
      pageNumber++;
    };
    
    // Function to handle text wrapping and pagination with improved formatting
    const addTextWithWrap = (text: string, fontSize: number, options: {
      isBold?: boolean,
      isItalic?: boolean,
      accent?: boolean,
      indent?: number,
      spacing?: number,
      alignment?: 'left' | 'center' | 'right'
    } = {}) => {
      const {
        isBold = false,
        isItalic = false,
        accent = false,
        indent = 0,
        spacing = 0.5,
        alignment = 'left'
      } = options;
      
      // Calculate effective margin with indentation
      const effectiveMargin = this.MARGIN + indent;
      const effectiveWidth = this.CONTENT_WIDTH - indent;
      
      // Set font properties
      doc.setFontSize(fontSize);
      
      if (accent) {
        doc.setTextColor(this.ACCENT_COLOR[0], this.ACCENT_COLOR[1], this.ACCENT_COLOR[2]);
      } else {
        doc.setTextColor(this.TEXT_COLOR[0], this.TEXT_COLOR[1], this.TEXT_COLOR[2]);
      }
      
      let fontStyle = 'normal';
      if (isBold && isItalic) fontStyle = 'bolditalic';
      else if (isBold) fontStyle = 'bold';
      else if (isItalic) fontStyle = 'italic';
      
      doc.setFont(this.DEFAULT_FONT, fontStyle);
      
      // Split text into lines that fit within content width
      const textLines = doc.splitTextToSize(text, effectiveWidth);
      
      // Calculate height needed for this text block
      const textHeight = textLines.length * ptToMm(fontSize) * this.LINE_HEIGHT;
      
      // Check if we need a new page - leave more space at bottom for aesthetics
      if (yPos + textHeight > this.PAGE_HEIGHT - this.MARGIN * 1.5) {
        addFooter();
        doc.addPage();
        yPos = this.MARGIN;
        addHeader(ebookContent.title || 'eBook');
      }
      
      // Add text lines with proper alignment
      for (const line of textLines) {
        let xPos = effectiveMargin;
        
        if (alignment === 'center') {
          xPos = this.PAGE_WIDTH / 2;
        } else if (alignment === 'right') {
          xPos = this.PAGE_WIDTH - this.MARGIN;
        }
        
        doc.text(line, xPos, yPos, { 
          align: alignment
        });
        
        yPos += ptToMm(fontSize) * this.LINE_HEIGHT;
      }
      
      // Add spacing after the text block
      yPos += ptToMm(fontSize) * spacing;
    };
    
    // ------------------------
    // Cover Page
    // ------------------------
    doc.setFillColor(245, 245, 250); // Light gray background for cover
    doc.rect(0, 0, this.PAGE_WIDTH, this.PAGE_HEIGHT, 'F');
    
    // Add decorative band at top
    doc.setFillColor(this.ACCENT_COLOR[0], this.ACCENT_COLOR[1], this.ACCENT_COLOR[2]);
    doc.rect(0, 0, this.PAGE_WIDTH, 40, 'F');
    
    // Center the title
    doc.setFontSize(this.TITLE_FONT_SIZE);
    doc.setFont(this.DEFAULT_FONT, 'bold');
    doc.setTextColor(this.ACCENT_COLOR[0], this.ACCENT_COLOR[1], this.ACCENT_COLOR[2]);
    
    const titleLines = doc.splitTextToSize(ebookContent.title || 'eBook', this.CONTENT_WIDTH);
    const titleHeight = titleLines.length * ptToMm(this.TITLE_FONT_SIZE) * this.LINE_HEIGHT;
    
    // Position title in the middle of the page
    const titleY = this.PAGE_HEIGHT / 2.5;
    
    for (let i = 0; i < titleLines.length; i++) {
      doc.text(titleLines[i], this.PAGE_WIDTH / 2, titleY + (i * ptToMm(this.TITLE_FONT_SIZE) * this.LINE_HEIGHT), { 
        align: 'center' 
      });
    }
    
    // Add generation date at bottom
    const today = new Date();
    const dateStr = today.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    
    doc.setFontSize(this.SUBHEADING_FONT_SIZE);
    doc.setFont(this.DEFAULT_FONT, 'italic');
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated with Autopen`, this.PAGE_WIDTH / 2, this.PAGE_HEIGHT - this.MARGIN * 2, { 
      align: 'center' 
    });
    
    doc.setFontSize(this.FOOTER_FONT_SIZE);
    doc.text(dateStr, this.PAGE_WIDTH / 2, this.PAGE_HEIGHT - this.MARGIN * 1.5, { 
      align: 'center' 
    });
    
    // Add footer to cover page
    addFooter();
    
    // ------------------------
    // Table of Contents Page
    // ------------------------
    doc.addPage();
    yPos = this.MARGIN * 1.5;  // Start a bit lower for better aesthetics
    addHeader(ebookContent.title || 'eBook');
    
    // Add Table of Contents title
    addTextWithWrap('Table of Contents', this.HEADING_FONT_SIZE, { 
      isBold: true, 
      accent: true, 
      spacing: 1.5,
      alignment: 'center'
    });
    
    // Add TOC entries
    if (ebookContent.tableOfContents?.chapters) {
      // Add Introduction entry first
      addTextWithWrap('Introduction', this.BODY_FONT_SIZE, { 
        indent: 5, 
        spacing: 0.8
      });
      
      // Add chapter entries
      ebookContent.tableOfContents.chapters.forEach((chapter, index) => {
        const chapterNumber = index + 1;
        addTextWithWrap(`Chapter ${chapterNumber}: ${chapter.title}`, this.BODY_FONT_SIZE, { 
          indent: 5, 
          spacing: 0.8
        });
      });
      
      // Add Conclusion entry
      addTextWithWrap('Conclusion', this.BODY_FONT_SIZE, { 
        indent: 5, 
        spacing: 0.8
      });
    }
    
    addFooter();
    
    // ------------------------
    // Introduction Page
    // ------------------------
    doc.addPage();
    yPos = this.MARGIN * 2;  // Start a bit lower for headings
    addHeader(ebookContent.title || 'eBook');
    
    // Add Introduction
    if (ebookContent.introduction) {
      addTextWithWrap('Introduction', this.HEADING_FONT_SIZE, { 
        isBold: true, 
        accent: true, 
        spacing: 1.5, 
        alignment: 'center'
      });
      
      addTextWithWrap(ebookContent.introduction, this.BODY_FONT_SIZE, { 
        spacing: 1.2
      });
    }
    
    addFooter();
    
    // ------------------------
    // Chapter Pages
    // ------------------------
    if (ebookContent.chapters && ebookContent.chapters.length > 0) {
      ebookContent.chapters.forEach((chapter, index) => {
        // Start each chapter on a new page
        doc.addPage();
        yPos = this.MARGIN * 2;  // Start a bit lower for chapter headings
        addHeader(ebookContent.title || 'eBook');
        
        // Add chapter title
        const chapterNumber = index + 1;
        addTextWithWrap(`Chapter ${chapterNumber}`, this.SUBHEADING_FONT_SIZE, { 
          isBold: true, 
          accent: true, 
          spacing: 0.5, 
          alignment: 'center'
        });
        
        addTextWithWrap(chapter.title, this.HEADING_FONT_SIZE, { 
          isBold: true, 
          accent: true, 
          spacing: 1.5, 
          alignment: 'center'
        });
        
        // Process chapter content to identify and format paragraphs properly
        if (chapter.content) {
          // Split content into paragraphs for better formatting
          const paragraphs = chapter.content.split(/\n\n+/);
          
          paragraphs.forEach((paragraph, i) => {
            // Check if this looks like a subheading (short, ends with colon or question mark)
            const isSubheading = paragraph.length < 100 && /[:?]$/.test(paragraph);
            
            if (isSubheading) {
              addTextWithWrap(paragraph, this.SUBHEADING_FONT_SIZE, { 
                isBold: true, 
                spacing: 1.0
              });
            } else {
              addTextWithWrap(paragraph, this.BODY_FONT_SIZE, { 
                spacing: 1.2 
              });
            }
          });
        }
        
        addFooter();
      });
    }
    
    // ------------------------
    // Conclusion Page
    // ------------------------
    if (ebookContent.conclusion) {
      doc.addPage();
      yPos = this.MARGIN * 2;  // Start a bit lower for headings
      addHeader(ebookContent.title || 'eBook');
      
      addTextWithWrap('Conclusion', this.HEADING_FONT_SIZE, { 
        isBold: true, 
        accent: true, 
        spacing: 1.5, 
        alignment: 'center'
      });
      
      // Split conclusion into paragraphs
      const conclusionParagraphs = ebookContent.conclusion.split(/\n\n+/);
      conclusionParagraphs.forEach(paragraph => {
        addTextWithWrap(paragraph, this.BODY_FONT_SIZE, { 
          spacing: 1.2 
        });
      });
      
      addFooter();
    }
    
    // Generate PDF as blob
    return doc.output('blob');
  }

  /**
   * Generate a data URL for the PDF
   * @param ebookContent The eBook content
   * @returns Promise with the data URL
   */
  public static async generatePDFDataUrl(ebookContent: EbookContent): Promise<string> {
    const pdfBlob = this.generateEbookPDF(ebookContent);
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(pdfBlob);
    });
  }

  /**
   * Save the PDF to a file
   * @param ebookContent The eBook content
   * @param filename The name of the file to save
   */
  public static savePDF(ebookContent: EbookContent, filename: string = 'ebook.pdf'): void {
    const pdfBlob = this.generateEbookPDF(ebookContent);
    const url = URL.createObjectURL(pdfBlob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    
    // Clean up
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 100);
  }
} 