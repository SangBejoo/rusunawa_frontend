// Use UMD require style for maximum compatibility with jsPDF and autotable in React/Webpack
const jsPDF = require('jspdf').jsPDF;
require('jspdf-autotable');

// Helper function to format date
const formatDate = () => {
  return new Date().toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Helper function to get scale label
const getScaleLabel = (value, labels = ['Sangat Buruk', 'Buruk', 'Cukup', 'Baik', 'Sangat Baik']) => {
  if (!value) return 'Tidak dijawab';
  return `${value} - ${labels[value - 1] || 'Unknown'}`;
};

// Helper function to get choice label
const getChoiceLabel = (value, options) => {
  if (!value) return 'Tidak dijawab';
  const option = options.find(opt => opt.value === value);
  return option ? option.label : value;
};

// Helper function to format checkbox values
const formatCheckboxValues = (values, options) => {
  if (!values || values.length === 0) return 'Tidak ada yang dipilih';
  return values.map(value => {
    const option = options.find(opt => opt.value === value);
    return option ? option.label : value;
  }).join(', ');
};

export const exportToPDF = async (formData, sections) => {
  try {
    // Create new PDF document
    const doc = new jsPDF();
    let yPosition = 20;
    const pageWidth = doc.internal.pageSize.width;
    const margin = 20;

    // Set font
    doc.setFont('helvetica');

    // Title
    doc.setFontSize(18);
    doc.setTextColor(0, 128, 230); // Brand color
    doc.text('HASIL USER ACCEPTANCE TESTING (UAT)', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 10;

    doc.setFontSize(14);
    doc.text('Sistem Manajemen Rusunawa - Admin/User POV', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 15;

    // Date and time
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Tanggal Export: ${formatDate()}`, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 20;

    // Helper function to check if we need a new page
    const checkNewPage = (requiredSpace = 30) => {
      const pageHeight = doc.internal.pageSize.height;
      if (yPosition + requiredSpace > pageHeight - 20) {
        doc.addPage();
        yPosition = 20;
        return true;
      }
      return false;
    };

    // Process each section
    sections.forEach((section, sectionIndex) => {
      const sectionData = formData[section.id] || {};

      // Check if we need a new page for section header
      checkNewPage(40);

      // Section header
      doc.setFontSize(14);
      doc.setTextColor(0, 128, 230);
      doc.text(`${sectionIndex + 1}. ${section.title}`, margin, yPosition);
      yPosition += 15;

      // Section content based on section type
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);

      switch (section.id) {
        case 'responden':
          checkNewPage(50);
          const respondenData = [
            ['Nama Lengkap', sectionData.nama_lengkap || 'Tidak diisi'],
            ['Role/Posisi', sectionData.role || 'Tidak diisi'],
            ['Email', sectionData.email || 'Tidak diisi'],
            ['Pengalaman', sectionData.pengalaman || 'Tidak diisi']
          ];
          
          doc.autoTable({
            startY: yPosition,
            head: [['Field', 'Value']],
            body: respondenData,
            margin: { left: margin, right: margin },
            styles: { fontSize: 9 },
            headStyles: { fillColor: [0, 128, 230] }
          });
          yPosition = doc.lastAutoTable.finalY + 15;
          break;

        case 'authentication':
          checkNewPage(80);
          const authData = [
            ['Login Ease', getScaleLabel(sectionData.login_ease, ['Sangat Sulit', 'Sulit', 'Cukup', 'Mudah', 'Sangat Mudah'])],
            ['Login Confirmation', getChoiceLabel(sectionData.login_confirmation, [
              { value: 'email', label: 'Ya, meminta konfirmasi email' },
              { value: 'sms', label: 'Ya, meminta konfirmasi SMS' },
              { value: 'none', label: 'Tidak ada konfirmasi' },
              { value: 'unknown', label: 'Tidak tahu/tidak mencoba' }
            ])],
            ['Auto Logout', getChoiceLabel(sectionData.auto_logout, [
              { value: '<30', label: 'Ya, < 30 menit' },
              { value: '30-60', label: 'Ya, 30-60 menit' },
              { value: '>60', label: 'Ya, > 1 jam' },
              { value: 'none', label: 'Tidak ada auto logout' },
              { value: 'unknown', label: 'Tidak tahu' }
            ])],
            ['Accessible Features', formatCheckboxValues(sectionData.accessible_features, [
              { value: 'dashboard', label: 'Dashboard' },
              { value: 'user_management', label: 'User Management' },
              { value: 'room_management', label: 'Room Management' },
              { value: 'booking_approval', label: 'Booking Approval' },
              { value: 'document_review', label: 'Document Review' },
              { value: 'payment_verification', label: 'Payment Verification' },
              { value: 'issue_management', label: 'Issue Management' },
              { value: 'notification_management', label: 'Notification Management' }
            ])],
            ['Auth Issues', sectionData.auth_issues || 'Tidak ada masalah']
          ];
          
          doc.autoTable({
            startY: yPosition,
            head: [['Pertanyaan', 'Jawaban']],
            body: authData,
            margin: { left: margin, right: margin },
            styles: { fontSize: 9 },
            headStyles: { fillColor: [0, 128, 230] },
            columnStyles: {
              0: { cellWidth: 60 },
              1: { cellWidth: 'auto' }
            }
          });
          yPosition = doc.lastAutoTable.finalY + 15;
          break;

        case 'dashboard':
          checkNewPage(70);
          const dashboardData = [
            ['Dashboard Informativeness', getScaleLabel(sectionData.dashboard_informativeness, ['Tidak Informatif', 'Kurang Informatif', 'Cukup Informatif', 'Informatif', 'Sangat Informatif'])],
            ['Navigation Ease', getScaleLabel(sectionData.navigation_ease, ['Sangat Sulit', 'Sulit', 'Cukup', 'Mudah', 'Sangat Mudah'])],
            ['Menu Structure', getChoiceLabel(sectionData.menu_structure, [
              { value: 'very_easy', label: 'Sangat mudah dipahami' },
              { value: 'easy', label: 'Mudah dipahami' },
              { value: 'moderate', label: 'Cukup mudah dipahami' },
              { value: 'difficult', label: 'Sulit dipahami' },
              { value: 'very_difficult', label: 'Sangat sulit dipahami' }
            ])],
            ['Response Time', getChoiceLabel(sectionData.response_time, [
              { value: 'very_fast', label: 'Sangat cepat (< 2 detik)' },
              { value: 'fast', label: 'Cepat (2-5 detik)' },
              { value: 'normal', label: 'Normal (5-10 detik)' },
              { value: 'slow', label: 'Lambat (10-20 detik)' },
              { value: 'very_slow', label: 'Sangat lambat (> 20 detik)' }
            ])],
            ['Dashboard Suggestions', sectionData.dashboard_suggestions || 'Tidak ada saran']
          ];
          
          doc.autoTable({
            startY: yPosition,
            head: [['Pertanyaan', 'Jawaban']],
            body: dashboardData,
            margin: { left: margin, right: margin },
            styles: { fontSize: 9 },
            headStyles: { fillColor: [0, 128, 230] },
            columnStyles: {
              0: { cellWidth: 60 },
              1: { cellWidth: 'auto' }
            }
          });
          yPosition = doc.lastAutoTable.finalY + 15;
          break;

        case 'user_management':
          checkNewPage(80);
          const userMgmtData = [
            ['Create User Ease', getScaleLabel(sectionData.create_user_ease)],
            ['User Validation', getChoiceLabel(sectionData.user_validation, [
              { value: 'very_clear', label: 'Ya, error message sangat jelas' },
              { value: 'clear', label: 'Ya, error message cukup jelas' },
              { value: 'unclear', label: 'Error message tidak jelas' },
              { value: 'none', label: 'Tidak ada error message' },
              { value: 'not_tried', label: 'Tidak mencoba' }
            ])],
            ['Edit User Ease', getScaleLabel(sectionData.edit_user_ease)],
            ['Delete Confirmation', getChoiceLabel(sectionData.delete_confirmation, [
              { value: 'clear_confirmation', label: 'Ya, ada konfirmasi yang jelas' },
              { value: 'unclear_confirmation', label: 'Ya, ada konfirmasi tapi tidak jelas' },
              { value: 'no_confirmation', label: 'Tidak ada konfirmasi' },
              { value: 'not_tried', label: 'Tidak mencoba' }
            ])],
            ['User List Display', getScaleLabel(sectionData.user_list_display)],
            ['User Management Issues', sectionData.user_management_issues || 'Tidak ada masalah']
          ];
          
          doc.autoTable({
            startY: yPosition,
            head: [['Pertanyaan', 'Jawaban']],
            body: userMgmtData,
            margin: { left: margin, right: margin },
            styles: { fontSize: 9 },
            headStyles: { fillColor: [0, 128, 230] },
            columnStyles: {
              0: { cellWidth: 60 },
              1: { cellWidth: 'auto' }
            }
          });
          yPosition = doc.lastAutoTable.finalY + 15;
          break;

        case 'room_management':
          checkNewPage(80);
          const roomMgmtData = [
            ['Room Creation Ease', getScaleLabel(sectionData.room_creation_ease)],
            ['Room Classification', getChoiceLabel(sectionData.room_classification, [
              { value: 'very_easy', label: 'Sangat mudah dipahami' },
              { value: 'easy', label: 'Mudah dipahami' },
              { value: 'moderate', label: 'Cukup mudah dipahami' },
              { value: 'difficult', label: 'Sulit dipahami' },
              { value: 'very_difficult', label: 'Sangat sulit dipahami' }
            ])],
            ['Amenities Management', getScaleLabel(sectionData.amenities_management)],
            ['Image Upload', getChoiceLabel(sectionData.image_upload, [
              { value: 'success_good', label: 'Berhasil, gambar tampil dengan baik' },
              { value: 'success_poor', label: 'Berhasil, tapi gambar tidak optimal' },
              { value: 'failed', label: 'Gagal upload' },
              { value: 'not_tried', label: 'Tidak mencoba' }
            ])],
            ['Room Search Filter', getScaleLabel(sectionData.room_search_filter)],
            ['Room Management Issues', sectionData.room_management_issues || 'Tidak ada masalah']
          ];
          
          doc.autoTable({
            startY: yPosition,
            head: [['Pertanyaan', 'Jawaban']],
            body: roomMgmtData,
            margin: { left: margin, right: margin },
            styles: { fontSize: 9 },
            headStyles: { fillColor: [0, 128, 230] },
            columnStyles: {
              0: { cellWidth: 60 },
              1: { cellWidth: 'auto' }
            }
          });
          yPosition = doc.lastAutoTable.finalY + 15;
          break;

        case 'booking_management':
          checkNewPage(80);
          const bookingMgmtData = [
            ['Booking List View', getScaleLabel(sectionData.booking_list_view)],
            ['Booking Details', getChoiceLabel(sectionData.booking_details, [
              { value: 'very_complete', label: 'Sangat lengkap dan jelas' },
              { value: 'complete', label: 'Lengkap dan jelas' },
              { value: 'adequate', label: 'Cukup lengkap' },
              { value: 'incomplete', label: 'Kurang lengkap' },
              { value: 'very_incomplete', label: 'Tidak lengkap sama sekali' }
            ])],
            ['Approval Process', getScaleLabel(sectionData.approval_process)],
            ['Status Updates', getChoiceLabel(sectionData.status_updates, [
              { value: 'immediate', label: 'Ya, langsung terupdate' },
              { value: '1-2min', label: 'Ya, terupdate dalam 1-2 menit' },
              { value: '5-10min', label: 'Ya, terupdate dalam 5-10 menit' },
              { value: 'not_realtime', label: 'Tidak real-time' },
              { value: 'unknown', label: 'Tidak tahu' }
            ])],
            ['Filter Search', getScaleLabel(sectionData.filter_search)],
            ['Booking Management Feedback', sectionData.booking_management_feedback || 'Tidak ada feedback']
          ];
          
          doc.autoTable({
            startY: yPosition,
            head: [['Pertanyaan', 'Jawaban']],
            body: bookingMgmtData,
            margin: { left: margin, right: margin },
            styles: { fontSize: 9 },
            headStyles: { fillColor: [0, 128, 230] },
            columnStyles: {
              0: { cellWidth: 60 },
              1: { cellWidth: 'auto' }
            }
          });
          yPosition = doc.lastAutoTable.finalY + 15;
          break;

        case 'document_management':
          checkNewPage(80);
          const docMgmtData = [
            ['Document Review Interface', getScaleLabel(sectionData.document_review_interface)],
            ['Image Quality', getChoiceLabel(sectionData.image_quality, [
              { value: 'very_clear', label: 'Sangat jelas dan mudah dibaca' },
              { value: 'clear', label: 'Jelas dan mudah dibaca' },
              { value: 'adequate', label: 'Cukup jelas' },
              { value: 'unclear', label: 'Kurang jelas' },
              { value: 'very_unclear', label: 'Tidak jelas sama sekali' }
            ])],
            ['Approval Process', getScaleLabel(sectionData.approval_process)],
            ['Batch Operations', getChoiceLabel(sectionData.batch_operations, [
              { value: 'very_good', label: 'Ya, sangat baik' },
              { value: 'good', label: 'Ya, cukup baik' },
              { value: 'minor_bugs', label: 'Ya, tapi ada bug kecil' },
              { value: 'not_working', label: 'Tidak berfungsi' },
              { value: 'not_tried', label: 'Tidak mencoba' }
            ])],
            ['Document Filters', getScaleLabel(sectionData.document_filters)],
            ['Document Management Issues', sectionData.document_management_issues || 'Tidak ada masalah']
          ];
          
          doc.autoTable({
            startY: yPosition,
            head: [['Pertanyaan', 'Jawaban']],
            body: docMgmtData,
            margin: { left: margin, right: margin },
            styles: { fontSize: 9 },
            headStyles: { fillColor: [0, 128, 230] },
            columnStyles: {
              0: { cellWidth: 60 },
              1: { cellWidth: 'auto' }
            }
          });
          yPosition = doc.lastAutoTable.finalY + 15;
          break;

        case 'payment_management':
          checkNewPage(70);
          const paymentMgmtData = [
            ['Payment Proof Display', getScaleLabel(sectionData.payment_proof_display)],
            ['Verification Process', getScaleLabel(sectionData.verification_process)],
            ['Payment Status Sync', getChoiceLabel(sectionData.payment_status_sync, [
              { value: 'always_sync', label: 'Ya, selalu sinkron' },
              { value: 'sometimes_sync', label: 'Ya, kadang-kadang sinkron' },
              { value: 'not_sync', label: 'Tidak sinkron' },
              { value: 'unknown', label: 'Tidak tahu' }
            ])],
            ['Payment History', getScaleLabel(sectionData.payment_history)],
            ['Payment Management Feedback', sectionData.payment_management_feedback || 'Tidak ada feedback']
          ];
          
          doc.autoTable({
            startY: yPosition,
            head: [['Pertanyaan', 'Jawaban']],
            body: paymentMgmtData,
            margin: { left: margin, right: margin },
            styles: { fontSize: 9 },
            headStyles: { fillColor: [0, 128, 230] },
            columnStyles: {
              0: { cellWidth: 60 },
              1: { cellWidth: 'auto' }
            }
          });
          yPosition = doc.lastAutoTable.finalY + 15;
          break;

        case 'issue_management':
          checkNewPage(70);
          const issueMgmtData = [
            ['Issue List Display', getScaleLabel(sectionData.issue_list_display)],
            ['Issue Details', getChoiceLabel(sectionData.issue_details, [
              { value: 'very_complete', label: 'Sangat lengkap dan informatif' },
              { value: 'complete', label: 'Lengkap dan informatif' },
              { value: 'adequate', label: 'Cukup lengkap' },
              { value: 'incomplete', label: 'Kurang lengkap' },
              { value: 'very_incomplete', label: 'Tidak lengkap' }
            ])],
            ['Status Management', getScaleLabel(sectionData.status_management)],
            ['Attachment Viewing', getChoiceLabel(sectionData.attachment_viewing, [
              { value: 'very_good', label: 'Sangat baik, gambar jelas' },
              { value: 'good', label: 'Baik, gambar cukup jelas' },
              { value: 'adequate', label: 'Cukup baik' },
              { value: 'poor', label: 'Kurang baik' },
              { value: 'not_working', label: 'Tidak berfungsi' }
            ])],
            ['Issue Management Feedback', sectionData.issue_management_feedback || 'Tidak ada feedback']
          ];
          
          doc.autoTable({
            startY: yPosition,
            head: [['Pertanyaan', 'Jawaban']],
            body: issueMgmtData,
            margin: { left: margin, right: margin },
            styles: { fontSize: 9 },
            headStyles: { fillColor: [0, 128, 230] },
            columnStyles: {
              0: { cellWidth: 60 },
              1: { cellWidth: 'auto' }
            }
          });
          yPosition = doc.lastAutoTable.finalY + 15;
          break;

        case 'notification':
          checkNewPage(70);
          const notificationData = [
            ['Notification Display', getScaleLabel(sectionData.notification_display)],
            ['Realtime Updates', getChoiceLabel(sectionData.realtime_updates, [
              { value: 'very_realtime', label: 'Ya, sangat real-time' },
              { value: 'realtime', label: 'Ya, cukup real-time' },
              { value: 'delayed', label: 'Kadang-kadang delay' },
              { value: 'not_realtime', label: 'Tidak real-time' },
              { value: 'unknown', label: 'Tidak tahu' }
            ])],
            ['Mark as Read', getScaleLabel(sectionData.mark_as_read)],
            ['Notification Relevance', getChoiceLabel(sectionData.notification_relevance, [
              { value: 'very_relevant', label: 'Sangat relevan' },
              { value: 'relevant', label: 'Relevan' },
              { value: 'adequate', label: 'Cukup relevan' },
              { value: 'less_relevant', label: 'Kurang relevan' },
              { value: 'not_relevant', label: 'Tidak relevan' }
            ])],
            ['Notification System Feedback', sectionData.notification_system_feedback || 'Tidak ada feedback']
          ];
          
          doc.autoTable({
            startY: yPosition,
            head: [['Pertanyaan', 'Jawaban']],
            body: notificationData,
            margin: { left: margin, right: margin },
            styles: { fontSize: 9 },
            headStyles: { fillColor: [0, 128, 230] },
            columnStyles: {
              0: { cellWidth: 60 },
              1: { cellWidth: 'auto' }
            }
          });
          yPosition = doc.lastAutoTable.finalY + 15;
          break;

        case 'overall_evaluation':
          checkNewPage(120);
          const overallData = [
            ['Overall Usability', getScaleLabel(sectionData.overall_usability)],
            ['System Stability', getChoiceLabel(sectionData.system_stability, [
              { value: 'very_stable', label: 'Sangat stabil, tidak ada error' },
              { value: 'stable', label: 'Stabil, error minimal' },
              { value: 'adequate', label: 'Cukup stabil' },
              { value: 'unstable', label: 'Kurang stabil, sering error' },
              { value: 'very_unstable', label: 'Tidak stabil' }
            ])],
            ['Performance', getScaleLabel(sectionData.performance, ['Sangat Lambat', 'Lambat', 'Cukup', 'Cepat', 'Sangat Cepat'])],
            ['User Experience', getScaleLabel(sectionData.user_experience)],
            ['Feature Completeness', getChoiceLabel(sectionData.feature_completeness, [
              { value: 'very_complete', label: 'Sangat lengkap' },
              { value: 'complete', label: 'Lengkap' },
              { value: 'adequate', label: 'Cukup lengkap' },
              { value: 'incomplete', label: 'Kurang lengkap' },
              { value: 'very_incomplete', label: 'Tidak lengkap' }
            ])],
            ['Recommendation Score', getScaleLabel(sectionData.recommendation_score, ['Definitely No', 'Probably No', 'Maybe', 'Probably Yes', 'Definitely Yes'])],
            ['Most Liked Features', sectionData.most_liked_features || 'Tidak ada input'],
            ['Most Disliked Features', sectionData.most_disliked_features || 'Tidak ada input'],
            ['Missing Features', sectionData.missing_features || 'Tidak ada input'],
            ['Overall Suggestions', sectionData.overall_suggestions || 'Tidak ada input'],
            ['Bug Reports', sectionData.bug_reports || 'Tidak ada bug yang dilaporkan']
          ];
          
          doc.autoTable({
            startY: yPosition,
            head: [['Pertanyaan', 'Jawaban']],
            body: overallData,
            margin: { left: margin, right: margin },
            styles: { fontSize: 9 },
            headStyles: { fillColor: [0, 128, 230] },
            columnStyles: {
              0: { cellWidth: 60 },
              1: { cellWidth: 'auto' }
            }
          });
          yPosition = doc.lastAutoTable.finalY + 15;
          break;

        case 'technical_issues':
          checkNewPage(70);
          const technicalData = [
            ['Browser Used', getChoiceLabel(sectionData.browser_used, [
              { value: 'chrome', label: 'Chrome' },
              { value: 'firefox', label: 'Firefox' },
              { value: 'safari', label: 'Safari' },
              { value: 'edge', label: 'Edge' },
              { value: 'other', label: 'Lainnya' }
            ])],
            ['Device Used', getChoiceLabel(sectionData.device_used, [
              { value: 'desktop', label: 'Desktop/Laptop' },
              { value: 'tablet', label: 'Tablet' },
              { value: 'mobile', label: 'Mobile Phone' }
            ])],
            ['Screen Resolution', getChoiceLabel(sectionData.screen_resolution, [
              { value: 'high', label: '1920x1080 atau lebih tinggi' },
              { value: 'medium', label: '1366x768' },
              { value: 'low', label: '1280x720' },
              { value: 'mobile', label: 'Mobile resolution' },
              { value: 'other', label: 'Lainnya' }
            ])],
            ['Internet Connection', getChoiceLabel(sectionData.internet_connection, [
              { value: 'very_fast', label: 'Sangat cepat (>50 Mbps)' },
              { value: 'fast', label: 'Cepat (10-50 Mbps)' },
              { value: 'medium', label: 'Sedang (1-10 Mbps)' },
              { value: 'slow', label: 'Lambat (<1 Mbps)' }
            ])],
            ['Technical Issues', sectionData.technical_issues || 'Tidak ada masalah teknis']
          ];
          
          doc.autoTable({
            startY: yPosition,
            head: [['Pertanyaan', 'Jawaban']],
            body: technicalData,
            margin: { left: margin, right: margin },
            styles: { fontSize: 9 },
            headStyles: { fillColor: [0, 128, 230] },
            columnStyles: {
              0: { cellWidth: 60 },
              1: { cellWidth: 'auto' }
            }
          });
          yPosition = doc.lastAutoTable.finalY + 15;
          break;

        default:
          // Handle any missing sections
          checkNewPage(30);
          doc.text('Data section ini tidak tersedia atau belum diimplementasi.', margin, yPosition);
          yPosition += 20;
          break;
      }
    });

    // Add summary page
    doc.addPage();
    yPosition = 20;

    // Summary title
    doc.setFontSize(16);
    doc.setTextColor(0, 128, 230);
    doc.text('RINGKASAN HASIL UAT', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 20;

    // Calculate summary statistics
    const responden = formData.responden || {};
    const overall = formData.overall_evaluation || {};

    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);

    const summaryData = [
      ['Responden', responden.nama_lengkap || 'N/A'],
      ['Role', responden.role || 'N/A'],
      ['Email', responden.email || 'N/A'],
      ['Pengalaman', responden.pengalaman || 'N/A'],
      ['Overall Usability Score', getScaleLabel(overall.overall_usability)],
      ['System Stability', getChoiceLabel(overall.system_stability, [
        { value: 'very_stable', label: 'Sangat stabil' },
        { value: 'stable', label: 'Stabil' },
        { value: 'adequate', label: 'Cukup stabil' },
        { value: 'unstable', label: 'Kurang stabil' },
        { value: 'very_unstable', label: 'Tidak stabil' }
      ])],
      ['Performance Rating', getScaleLabel(overall.performance, ['Sangat Lambat', 'Lambat', 'Cukup', 'Cepat', 'Sangat Cepat'])],
      ['Recommendation Score', getScaleLabel(overall.recommendation_score, ['Definitely No', 'Probably No', 'Maybe', 'Probably Yes', 'Definitely Yes'])]
    ];

    doc.autoTable({
      startY: yPosition,
      head: [['Aspek', 'Nilai']],
      body: summaryData,
      margin: { left: margin, right: margin },
      styles: { fontSize: 10 },
      headStyles: { fillColor: [0, 128, 230] },
      columnStyles: {
        0: { cellWidth: 80 },
        1: { cellWidth: 'auto' }
      }
    });

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text(
        `Halaman ${i} dari ${pageCount} - Hasil UAT Sistem Rusunawa`,
        pageWidth / 2,
        doc.internal.pageSize.height - 10,
        { align: 'center' }
      );
    }

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
    const filename = `UAT_Results_${responden.nama_lengkap || 'Unknown'}_${timestamp}.pdf`;

    // Save the PDF
    doc.save(filename);

    return { success: true, filename };

  } catch (error) {
    console.error('PDF Export Error:', error);
    throw new Error('Gagal mengekspor PDF: ' + error.message);
  }
};

// Export to HTML instead of PDF if PDF export fails, babe
export const exportToHTML = (formData, sections) => {
  try {
    let html = `<!DOCTYPE html><html lang="id"><head><meta charset="UTF-8"><title>Hasil Pengujian UAT - Sistem Rusunawa</title><style>
      body { font-family: Arial, sans-serif; margin: 32px; }
      h1, h2 { color: #0080e6; }
      table { border-collapse: collapse; width: 100%; margin-bottom: 24px; }
      th, td { border: 1px solid #ccc; padding: 8px; }
      th { background: #0080e6; color: #fff; }
      .section { margin-bottom: 32px; }
      .footer { color: #888; font-size: 12px; text-align: center; margin-top: 48px; }
    </style></head><body>`;
    html += `<h1>Hasil Pengujian UAT - Sistem Rusunawa</h1>`;
    html += `<div><strong>Tanggal Export:</strong> ${new Date().toLocaleString('id-ID')}</div>`;
    if (formData.responden) {
      html += `<div><strong>Nama:</strong> ${formData.responden.nama_lengkap || '-'}<br>`;
      html += `<strong>Role:</strong> ${formData.responden.role || '-'}<br>`;
      html += `<strong>Email:</strong> ${formData.responden.email || '-'}<br>`;
      html += `<strong>Pengalaman:</strong> ${formData.responden.pengalaman || '-'}</div>`;
    }
    sections.forEach((section, idx) => {
      const sectionData = formData[section.id] || {};
      html += `<div class="section"><h2>${idx + 1}. ${section.title}</h2><table><tbody>`;
      Object.entries(sectionData).forEach(([key, value]) => {
        html += `<tr><th>${key}</th><td>${Array.isArray(value) ? value.join(', ') : value || '-'}</td></tr>`;
      });
      html += `</tbody></table></div>`;
    });
    html += `<div class="footer">Exported at ${new Date().toLocaleString('id-ID')}</div>`;
    html += `</body></html>`;
    // Download as .html file
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `UAT_Test_Results_${new Date().toISOString().replace(/[:.]/g, '-')}.html`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
    return { success: true };
  } catch (error) {
    console.error('HTML Export Error:', error);
    throw new Error('Gagal mengekspor HTML: ' + error.message);
  }
};
