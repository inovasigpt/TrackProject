import { PROJECT_PHASES } from '../data/constants';
import { Project } from '../types';

/**
 * Export projects data to CSV format
 */
export const exportToCSV = (projects: Project[]) => {
  // Build CSV content
  const headers = ['Project Name', 'Code', 'Priority', 'Status', 'PICs', 'Phase', 'Start Date', 'End Date', 'Progress'];

  const rows: string[][] = [];

  projects.forEach(project => {
    const picsStr = project.pics
      ? project.pics.map(p => `${p.name} (${p.role})`).join('; ')
      : project.pic ? `${project.pic.name} (${project.pic.role})` : '';

    project.phases.forEach(phase => {
      const phaseInfo = PROJECT_PHASES.find(p => p.id === phase.id);
      rows.push([
        project.name,
        project.code,
        project.priority || 'Medium',
        project.status,
        picsStr,
        phaseInfo?.label || phase.id,
        phase.startDate,
        phase.endDate,
        `${phase.progress}%`
      ]);
    });
  });

  // Convert to CSV
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  // Download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `track_project_export_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Export projects data to PDF (opens print dialog)
 */
export const exportToPDF = (projects: Project[]) => {
  // Create a printable HTML content
  const printContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Track Project - Timeline Export</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: 'Segoe UI', Arial, sans-serif; 
          padding: 40px; 
          background: white;
          color: #1e293b;
        }
        .header { 
          text-align: center; 
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 2px solid #e2e8f0;
        }
        .header h1 { 
          font-size: 24px; 
          color: #0f172a;
          margin-bottom: 5px;
        }
        .header p { 
          color: #64748b; 
          font-size: 12px;
        }
        .project { 
          margin-bottom: 25px; 
          page-break-inside: avoid;
        }
        .project-header { 
          background: #f1f5f9; 
          padding: 12px 16px; 
          border-radius: 8px;
          margin-bottom: 10px;
        }
        .project-name { 
          font-size: 14px; 
          font-weight: bold;
          color: #0f172a;
        }
        .project-code { 
          font-size: 11px; 
          color: #26b9f7;
          font-family: monospace;
        }
        .project-meta {
          display: flex;
          gap: 15px;
          margin-top: 5px;
          font-size: 10px;
          color: #64748b;
        }
        .pics-list {
          font-size: 10px;
          color: #475569;
          margin-top: 5px;
        }
        table { 
          width: 100%; 
          border-collapse: collapse; 
          font-size: 11px;
        }
        th { 
          background: #e2e8f0; 
          padding: 8px 12px; 
          text-align: left;
          font-weight: 600;
          color: #475569;
          text-transform: uppercase;
          font-size: 9px;
          letter-spacing: 0.5px;
        }
        td { 
          padding: 8px 12px; 
          border-bottom: 1px solid #e2e8f0;
        }
        .phase-name { font-weight: 500; }
        .progress-bar {
          width: 60px;
          height: 6px;
          background: #e2e8f0;
          border-radius: 3px;
          overflow: hidden;
        }
        .progress-fill {
          height: 100%;
          background: #26b9f7;
        }
        .priority-high { color: #f59e0b; font-weight: bold; }
        .priority-medium { color: #3b82f6; }
        .priority-low { color: #10b981; }
        @media print {
          body { padding: 20px; }
          .project { page-break-inside: avoid; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Track Project - Timeline Report</h1>
        <p>Generated on ${new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>
      
      ${projects.map(project => {
    const picsHtml = project.pics
      ? project.pics.map(p => `${p.name} (${p.role})`).join(', ')
      : project.pic ? `${project.pic.name} (${project.pic.role})` : '-';

    return `
          <div class="project">
            <div class="project-header">
              <div class="project-name">${project.name}</div>
              <div class="project-code">${project.code}</div>
              <div class="project-meta">
                <span class="priority-${(project.priority || 'medium').toLowerCase()}">Priority: ${project.priority || 'Medium'}</span>
                <span>Status: ${project.status}</span>
              </div>
              <div class="pics-list"><strong>PIC:</strong> ${picsHtml}</div>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Phase</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Progress</th>
                </tr>
              </thead>
              <tbody>
                ${project.phases.map(phase => {
      const phaseInfo = PROJECT_PHASES.find(p => p.id === phase.id);
      return `
                    <tr>
                      <td class="phase-name">${phaseInfo?.label || phase.id}</td>
                      <td>${phase.startDate}</td>
                      <td>${phase.endDate}</td>
                      <td>
                        <div style="display: flex; align-items: center; gap: 8px;">
                          <div class="progress-bar">
                            <div class="progress-fill" style="width: ${phase.progress}%"></div>
                          </div>
                          <span>${phase.progress}%</span>
                        </div>
                      </td>
                    </tr>
                  `;
    }).join('')}
              </tbody>
            </table>
          </div>
        `;
  }).join('')}
    </body>
    </html>
  `;

  // Open print dialog
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();

    // Wait for content to load then print
    setTimeout(() => {
      printWindow.print();
    }, 250);
  }
};
