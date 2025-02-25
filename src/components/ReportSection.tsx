import { FC, useState } from 'react';
import { generateReport } from '../lib/api';
import { jsPDF } from 'jspdf';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { saveAs } from 'file-saver';

interface ReportSectionProps {
  selectedSources: string[];
  searchQuery: string;
}

const ReportSection: FC<ReportSectionProps> = ({ selectedSources, searchQuery }) => {
  const [promptTemplate, setPromptTemplate] = useState(
    'Generate a comprehensive report based on the following sources. Include key findings, analysis, and recommendations.'
  );
  const [report, setReport] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [exportFormat, setExportFormat] = useState('PDF');
  const [isExporting, setIsExporting] = useState(false);

  const handleGenerateReport = async () => {
    if (selectedSources.length === 0) {
      alert('Please select at least one source');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await generateReport(searchQuery, selectedSources, promptTemplate);
      setReport(response.report);
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Failed to generate report. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      switch (exportFormat.toLowerCase()) {
        case 'pdf':
          const doc = new jsPDF();
          
          // Set font
          doc.setFont("helvetica");
          
          // Add title
          doc.setFontSize(18);
          doc.text(`Research Report`, 105, 20, { align: 'center' });
          
          doc.setFontSize(14);
          doc.text(`Topic: ${searchQuery}`, 105, 30, { align: 'center' });
          
          // Add date
          doc.setFontSize(12);
          doc.text(`Generated: ${new Date().toLocaleDateString()}`, 105, 40, { align: 'center' });
          
          // Add content with proper formatting
          doc.setFontSize(12);
          const pageWidth = doc.internal.pageSize.width;
          const margin = 20;
          const maxWidth = pageWidth - (margin * 2);
          
          // Split content into paragraphs
          const paragraphs = report.split('\n\n');
          let yPosition = 60;
          
          paragraphs.forEach((paragraph) => {
            if (yPosition > 270) { // Check if near page bottom
              doc.addPage();
              yPosition = 20;
            }
            
            const lines = doc.splitTextToSize(paragraph, maxWidth);
            doc.text(lines, margin, yPosition);
            yPosition += (lines.length * 7) + 5; // Add spacing between paragraphs
          });
          
          // Add sources on new page
          doc.addPage();
          doc.setFontSize(14);
          doc.text('Sources:', margin, 20);
          
          let sourceY = 30;
          selectedSources.forEach((source, index) => {
            const sourceText = `${index + 1}. ${source}`;
            const sourceLines = doc.splitTextToSize(sourceText, maxWidth);
            doc.setFontSize(10);
            doc.text(sourceLines, margin, sourceY);
            sourceY += (sourceLines.length * 5) + 5;
          });
          
          doc.save('research_report.pdf');
          break;

        case 'docx':
          // Create DOCX document
          const doc2 = new Document({
            sections: [{
              properties: {},
              children: [
                // Title
                new Paragraph({
                  text: "Research Report",
                  heading: "Heading1",
                  spacing: { after: 200 }
                }),
                
                // Topic
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `Topic: ${searchQuery}`,
                      bold: true,
                      size: 28
                    })
                  ],
                  spacing: { after: 200 }
                }),
                
                // Date
                new Paragraph({
                  text: `Generated: ${new Date().toLocaleDateString()}`,
                  spacing: { after: 400 }
                }),
                
                // Content
                ...report.split('\n\n').map(para => 
                  new Paragraph({
                    text: para,
                    spacing: { after: 200 }
                  })
                ),
                
                // Sources
                new Paragraph({
                  text: "Sources:",
                  heading: "Heading2",
                  spacing: { before: 400, after: 200 }
                }),
                
                ...selectedSources.map((source, index) => 
                  new Paragraph({
                    text: `${index + 1}. ${source}`,
                    spacing: { after: 100 }
                  })
                )
              ]
            }]
          });
          
          // Generate and save DOCX
          const buffer = await Packer.toBlob(doc2);
          saveAs(buffer, 'research_report.docx');
          break;

        case 'txt':
          // Format text file
          const textContent = [
            'Research Report',
            `Topic: ${searchQuery}`,
            `Generated: ${new Date().toLocaleDateString()}`,
            '',
            report,
            '',
            'Sources:',
            ...selectedSources.map((source, index) => `${index + 1}. ${source}`)
          ].join('\n\n');
          
          const textBlob = new Blob([textContent], { type: 'text/plain' });
          saveAs(textBlob, 'research_report.txt');
          break;
      }
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export report');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Report Generation</h2>
      
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Custom Prompt Template
        </label>
        <textarea
          value={promptTemplate}
          onChange={(e) => setPromptTemplate(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={4}
        />
      </div>

      <button
        onClick={handleGenerateReport}
        disabled={isGenerating || selectedSources.length === 0}
        className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
      >
        {isGenerating ? 'Generating Report...' : 'Generate Report'}
      </button>

      {report && (
        <div className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-800">Generated Report</h3>
            <div className="flex gap-2">
              <select
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option>PDF</option>
                <option>DOCX</option>
                <option>TXT</option>
              </select>
              <button
                onClick={handleExport}
                disabled={isExporting}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {isExporting ? 'Exporting...' : 'Export'}
              </button>
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4 prose max-w-none">
            {report}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportSection; 