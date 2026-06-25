import type { DailyReport } from '../types';

export const exportToPDF = (reports: DailyReport[], title: string = 'Tadbeer Daily Work Reports') => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to export PDFs.');
    return;
  }

  // Calculate aggregates
  const totalHours = reports.reduce((acc, r) => acc + r.hours_worked, 0);
  const completed = reports.filter(r => r.status === 'completed').length;
  const blocked = reports.filter(r => r.status === 'blocked').length;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title}</title>
      <meta charset="utf-8" />
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,400&family=Inter:wght@400;500;600;700&display=swap');
        
        body {
          font-family: 'Inter', sans-serif;
          color: #1a2e33;
          background-color: #faf8f5;
          margin: 0;
          padding: 40px;
          line-height: 1.5;
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 2px solid #c5a85c;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }

        .logo-title {
          font-family: 'Playfair Display', serif;
          font-size: 28px;
          font-weight: bold;
          color: #0d4855;
          letter-spacing: 2px;
          margin: 0;
        }

        .logo-sub {
          font-size: 10px;
          color: #c5a85c;
          letter-spacing: 3px;
          text-transform: uppercase;
          font-weight: 600;
          margin: 3px 0 0 0;
        }

        .doc-title {
          text-align: right;
          font-size: 12px;
          text-transform: uppercase;
          color: #c5a85c;
          letter-spacing: 2px;
          font-weight: 600;
        }

        .meta-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 15px;
          margin-bottom: 30px;
        }

        .meta-card {
          background-color: #ffffff;
          border: 1px solid #e2eef0;
          border-radius: 10px;
          padding: 15px;
          text-align: center;
        }

        .meta-val {
          font-size: 20px;
          font-weight: bold;
          color: #0d4855;
          margin-bottom: 5px;
        }

        .meta-lbl {
          font-size: 10px;
          color: #8a9c9f;
          text-transform: uppercase;
          letter-spacing: 1px;
          font-weight: 600;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 40px;
          background-color: #ffffff;
          border-radius: 10px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0,0,0,0.02);
        }

        th {
          background-color: #0d4855;
          color: #ffffff;
          text-align: left;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1px;
          padding: 12px 15px;
        }

        td {
          padding: 12px 15px;
          font-size: 12px;
          border-bottom: 1px solid #e2eef0;
        }

        .badge {
          display: inline-block;
          padding: 3px 8px;
          border-radius: 20px;
          font-size: 10px;
          font-weight: bold;
          text-transform: uppercase;
        }

        .badge-completed {
          background-color: #e8f5e9;
          color: #2e7d32;
        }

        .badge-in_progress {
          background-color: #fffde7;
          color: #f57f17;
        }

        .badge-blocked {
          background-color: #ffebee;
          color: #c62828;
        }

        .page-break {
          page-break-before: always;
        }

        .report-section {
          background: #ffffff;
          border: 1px solid #e2eef0;
          border-radius: 12px;
          padding: 25px;
          margin-bottom: 25px;
          page-break-inside: avoid;
        }

        .report-header {
          display: flex;
          justify-content: space-between;
          border-bottom: 1px solid #e2eef0;
          padding-bottom: 12px;
          margin-bottom: 15px;
        }

        .report-intern {
          font-family: 'Playfair Display', serif;
          font-size: 18px;
          color: #0d4855;
          margin: 0;
        }

        .report-date {
          font-size: 12px;
          color: #c5a85c;
          font-weight: 600;
        }

        .report-grid {
          display: grid;
          grid-template-columns: 120px 1fr;
          gap: 10px 15px;
          font-size: 12px;
          margin-bottom: 15px;
        }

        .field-lbl {
          font-weight: 600;
          color: #0d4855;
          text-transform: uppercase;
          font-size: 10px;
          letter-spacing: 0.5px;
        }

        .field-val {
          color: #334d52;
          white-space: pre-line;
        }

        .report-comments {
          background-color: #f4f8f9;
          border-left: 3px solid #c5a85c;
          padding: 10px 15px;
          border-radius: 0 8px 8px 0;
          font-size: 11px;
          margin-top: 15px;
        }

        .comment-header {
          font-weight: 600;
          color: #0d4855;
          margin-bottom: 4px;
        }

        @media print {
          body {
            background-color: #ffffff;
            padding: 0;
          }
          .meta-card {
            border: 1px solid #e2eef0 !important;
          }
          .report-section {
            border: 1px solid #e2eef0 !important;
          }
        }
      </style>
    </head>
    <body>
      <!-- Cover/Header -->
      <div class="header">
        <div>
          <h1 class="logo-title">TADBEER</h1>
          <p class="logo-sub">Transformation Trading</p>
        </div>
        <div class="doc-title">
          DAILY WORK TRACKER<br/>
          <span style="font-size: 10px; color: #8a9c9f;">Generated on ${new Date().toLocaleDateString()}</span>
        </div>
      </div>

      <!-- Overview Cards -->
      <div class="meta-grid">
        <div class="meta-card">
          <div class="meta-val">${reports.length}</div>
          <div class="meta-lbl">Total Reports</div>
        </div>
        <div class="meta-card">
          <div class="meta-val">${totalHours.toFixed(1)}</div>
          <div class="meta-lbl">Hours Logged</div>
        </div>
        <div class="meta-card">
          <div class="meta-val">${completed}</div>
          <div class="meta-lbl">Completed Days</div>
        </div>
        <div class="meta-card">
          <div class="meta-val">${blocked}</div>
          <div class="meta-lbl">Blocked Days</div>
        </div>
      </div>

      <!-- Overview Table -->
      <h2 style="font-family: 'Playfair Display', serif; font-size: 18px; color: #0d4855; margin-bottom: 15px;">Reports Index</h2>
      <table>
        <thead>
          <tr>
            <th>Intern Name</th>
            <th>Date</th>
            <th>Timeslot</th>
            <th>Hours</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${reports.map(r => `
            <tr>
              <td style="font-weight: 600;">${r.intern_name || 'N/A'}</td>
              <td>${r.date}</td>
              <td>${r.start_time} - ${r.end_time}</td>
              <td>${r.hours_worked} hrs</td>
              <td>
                <span class="badge badge-${r.status}">
                  ${r.status === 'completed' ? '🟢 Completed' : r.status === 'in_progress' ? '🟡 In Progress' : '🔴 Blocked'}
                </span>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <!-- Detailed Journal Sections -->
      <div class="page-break"></div>
      <h2 style="font-family: 'Playfair Display', serif; font-size: 22px; color: #0d4855; margin-bottom: 25px; border-bottom: 1px solid #c5a85c; padding-bottom: 8px;">Detailed Journals</h2>
      
      ${reports.map(r => `
        <div class="report-section">
          <div class="report-header">
            <div>
              <h3 class="report-intern">${r.intern_name || 'N/A'}</h3>
              <span class="badge badge-${r.status}" style="margin-top: 6px;">
                ${r.status.toUpperCase()}
              </span>
            </div>
            <div style="text-align: right;">
              <span class="report-date">${r.date}</span>
              <div style="font-size: 11px; color: #8a9c9f; margin-top: 4px;">Logged: ${r.start_time} - ${r.end_time} (${r.hours_worked} hrs)</div>
            </div>
          </div>

          <div class="report-grid">
            <div class="field-lbl">Today's Objectives:</div>
            <div class="field-val">${r.objectives}</div>

            <div class="field-lbl">Work Completed:</div>
            <div class="field-val">${r.work_completed}</div>

            ${r.challenges ? `
              <div class="field-lbl">Challenges / Blockers:</div>
              <div class="field-val" style="color: #c62828; font-weight: 500;">${r.challenges}</div>
            ` : ''}

            ${r.suggestions ? `
              <div class="field-lbl">Suggestions / Ideas:</div>
              <div class="field-val">${r.suggestions}</div>
            ` : ''}

            ${r.waiting_for ? `
              <div class="field-lbl">Waiting For:</div>
              <div class="field-val" style="color: #f57f17; font-weight: 500;">${r.waiting_for}</div>
            ` : ''}

            <div class="field-lbl">Tomorrow's Plan:</div>
            <div class="field-val">${r.tomorrow_plan}</div>
          </div>

          ${r.comments && r.comments.length > 0 ? `
            <div class="report-comments">
              ${r.comments.map(c => `
                <div style="margin-bottom: 8px; border-bottom: 1px solid #e2eef0; padding-bottom: 6px; last-child: {border:0; padding:0; margin:0;}">
                  <div class="comment-header">${c.author_name} (${c.author_role.toUpperCase()}) <span style="font-size: 9px; font-weight: normal; color:#8a9c9f; margin-left: 10px;">${new Date(c.created_at).toLocaleString()}</span></div>
                  <div style="color: #334d52;">${c.comment_text}</div>
                </div>
              `).join('')}
            </div>
          ` : ''}
        </div>
      `).join('')}

      <script>
        window.onload = function() {
          window.print();
          // Keep window open for save file select, but let them close it
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
};
