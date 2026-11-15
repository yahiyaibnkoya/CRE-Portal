'use client';

import React, { useState, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { dataService } from '@/lib/dataService';
import { formatCurrency } from '@/lib/constants';
import { copyToClipboard, getWhatsAppShareUrl, generatePdfReport } from '@/lib/reportUtils';
import {
  FileText,
  Copy,
  Share2,
  Download,
  CalendarCheck,
  IndianRupee,
  Receipt,
  GraduationCap,
  CheckCircle,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Users,
  Filter,
  Calendar,
  Phone,
} from 'lucide-react';

function SuperAdminReportsContent() {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get('tab') as any) || 'class_attendance';
  const initialDate = searchParams.get('date') || '';
  const initialCenter = searchParams.get('center') || 'center-manjeri-01';

  const [selectedCenter, setSelectedCenter] = useState<string>(initialCenter);
  const [reportType, setReportType] = useState<'class_attendance' | 'fee' | 'attendance' | 'financial' | 'exam'>(initialTab);
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-11');
  const [copied, setCopied] = useState(false);

  const centers = dataService.getCenters();
  const currentCenterObj = centers.find((c) => c.id === selectedCenter);
  const centerDisplayName = currentCenterObj ? currentCenterObj.name : 'All Centres (Statewide)';

  // All attendance records for currently selected centre
  const centerAttendanceRecords = useMemo(() => {
    if (selectedCenter === 'ALL') {
      const all: any[] = [];
      centers.forEach((c) => all.push(...dataService.getAttendanceRecords(c.id)));
      return all;
    }
    return dataService.getAttendanceRecords(selectedCenter);
  }, [selectedCenter, centers]);

  // Available unique class dates
  const availableDates = useMemo(() => {
    const dates = Array.from(new Set(centerAttendanceRecords.map((a) => a.date))).sort().reverse();
    return dates;
  }, [centerAttendanceRecords]);

  const [selectedDate, setSelectedDate] = useState<string>(
    initialDate || (availableDates.length > 0 ? availableDates[0] : '2026-11-08')
  );

  // Update selectedDate if availableDates changes and current selectedDate is not in it
  React.useEffect(() => {
    if (availableDates.length > 0 && !availableDates.includes(selectedDate)) {
      setSelectedDate(availableDates[0]);
    }
  }, [availableDates, selectedDate]);

  // Data computations based on filters
  const students = useMemo(() => {
    return dataService.getStudents(selectedCenter === 'ALL' ? undefined : selectedCenter);
  }, [selectedCenter]);

  // Class Attendance details for selected date
  const classAttendanceData = useMemo(() => {
    const records = centerAttendanceRecords.filter((a) => a.date === selectedDate);
    const presentList: Array<{ student: any; record: any }> = [];
    const absentList: Array<{ student: any; record: any }> = [];
    const leaveList: Array<{ student: any; record: any }> = [];

    records.forEach((r) => {
      const student = dataService.getStudentById(r.studentId);
      if (r.status === 'Present') {
        presentList.push({ student, record: r });
      } else if (r.status === 'Absent') {
        absentList.push({ student, record: r });
      } else if (r.status === 'Leave') {
        leaveList.push({ student, record: r });
      }
    });

    const total = records.length;
    const turnoutRate = total > 0 ? Math.round((presentList.length / total) * 100) : 0;

    return {
      records,
      presentList,
      absentList,
      leaveList,
      total,
      turnoutRate,
    };
  }, [centerAttendanceRecords, selectedDate]);

  const monthlyFees = useMemo(() => {
    if (selectedCenter === 'ALL') {
      const all: any[] = [];
      centers.forEach((c) => all.push(...dataService.getMonthlyFees(c.id, selectedMonth)));
      return all;
    }
    return dataService.getMonthlyFees(selectedCenter, selectedMonth);
  }, [selectedCenter, selectedMonth, centers]);

  const financialSummary = useMemo(() => {
    return dataService.getFinancialSummary(
      selectedCenter === 'ALL' ? undefined : selectedCenter,
      selectedMonth
    );
  }, [selectedCenter, selectedMonth]);

  const attendanceSummary = useMemo(() => {
    const activeSt = students.filter((s) => s.status === 'Active');
    let totalPresent = 0;
    let totalAbsent = 0;
    let totalLeave = 0;
    let totalConductedMax = 0;

    activeSt.forEach((st) => {
      const att = dataService.calculateStudentAttendance(st.id, st.centerId, selectedMonth);
      totalPresent += att.present;
      totalAbsent += att.absent;
      totalLeave += att.leave;
      if (att.totalConducted > totalConductedMax) totalConductedMax = att.totalConducted;
    });

    const totalRecords = totalPresent + totalAbsent + totalLeave;
    const overallRate = totalRecords > 0 ? Math.round((totalPresent / totalRecords) * 100) : 0;

    return { totalPresent, totalAbsent, totalLeave, totalConductedMax, overallRate };
  }, [students, selectedMonth]);

  // Generate WhatsApp text for current report
  const whatsAppText = useMemo(() => {
    if (reportType === 'class_attendance') {
      const { presentList, absentList, leaveList, total, turnoutRate } = classAttendanceData;

      let text = `*CRE – CLASS ATTENDANCE REPORT*
*Wisdom Islamic Students Organization*

*Centre:* ${centerDisplayName}
*Class Date:* ${selectedDate}
*Attendance Turnout:* ${turnoutRate}% (${presentList.length}/${total} Present)

*SUMMARY*
Total Students: ${total}
Present: ${presentList.length}
Absent: ${absentList.length}
On Leave: ${leaveList.length}

*PRESENT STUDENTS (${presentList.length}):*`;

      if (presentList.length === 0) {
        text += '\n- None';
      } else {
        presentList.forEach((item, idx) => {
          text += `\n${idx + 1}. ${item.student?.name || 'Student'} (${item.student?.admissionNumber || '—'}) - ${item.student?.place || '—'}`;
        });
      }

      text += `\n\n*ABSENT STUDENTS (${absentList.length}):*`;
      if (absentList.length === 0) {
        text += '\n- None';
      } else {
        absentList.forEach((item, idx) => {
          const phone = item.student?.parentPhone || item.student?.studentPhone || 'No phone';
          text += `\n${idx + 1}. ${item.student?.name || 'Student'} (${item.student?.admissionNumber || '—'}) - Parent: ${phone}`;
        });
      }

      if (leaveList.length > 0) {
        text += `\n\n*ON LEAVE (${leaveList.length}):*`;
        leaveList.forEach((item, idx) => {
          text += `\n${idx + 1}. ${item.student?.name || 'Student'} (${item.student?.admissionNumber || '—'}) - Reason: ${item.record.remarks || 'Sanctioned leave'}`;
        });
      }

      text += `\n\n*Generated on:* ${new Date().toLocaleDateString('en-IN')}`;
      return text;
    }

    if (reportType === 'fee') {
      const paidCount = monthlyFees.filter((f) => f.status === 'Paid' || f.status === 'Advance / Excess').length;
      const partialCount = monthlyFees.filter((f) => f.status === 'Partially Paid').length;
      const unpaidCount = monthlyFees.filter((f) => f.status === 'Unpaid').length;
      const expectedTotal = monthlyFees.reduce((acc, f) => acc + (f.expectedFee || 0), 0);
      const collectedTotal = monthlyFees.reduce((acc, f) => acc + (f.paidAmount || 0), 0);
      const outstandingTotal = monthlyFees.reduce((acc, f) => acc + (f.outstandingAmount || 0), 0);

      return `*CRE – MONTHLY FEE REPORT*
*Wisdom Islamic Students Organization*

*Centre:* ${centerDisplayName}
*Month:* ${selectedMonth}

*FEE SUMMARY*
Total Students: ${monthlyFees.length}
Paid: ${paidCount}
Partially Paid: ${partialCount}
Unpaid: ${unpaidCount}

*COLLECTION*
Expected Amount: ${formatCurrency(expectedTotal)}
Collected Amount: ${formatCurrency(collectedTotal)}
Outstanding: ${formatCurrency(outstandingTotal)}

*Generated on:* ${new Date().toLocaleDateString('en-IN')}`;
    }

    if (reportType === 'attendance') {
      return `*CRE – ATTENDANCE REPORT*
*Wisdom Islamic Students Organization*

*Centre:* ${centerDisplayName}
*Month:* ${selectedMonth}

*ATTENDANCE SUMMARY*
Total Classes Conducted: ${attendanceSummary.totalConductedMax}
Present Sessions: ${attendanceSummary.totalPresent}
Absent Sessions: ${attendanceSummary.totalAbsent}
Leave Records: ${attendanceSummary.totalLeave}
Overall Attendance: ${attendanceSummary.overallRate}%

*Generated on:* ${new Date().toLocaleDateString('en-IN')}`;
    }

    if (reportType === 'financial') {
      return `*CRE – FINANCIAL REPORT*
*Wisdom Islamic Students Organization*

*Centre:* ${centerDisplayName}
*Month:* ${selectedMonth}

*INCOME*
Fee Collection: ${formatCurrency(financialSummary.totalFeeIncome)}
Donations: ${formatCurrency(financialSummary.totalDonationIncome)}
*Total Income:* ${formatCurrency(financialSummary.totalIncome)}

*EXPENDITURE*
Weekly Class Expenses: ${formatCurrency(financialSummary.totalWeeklyExpense)}
Other Operational: ${formatCurrency(financialSummary.totalOtherExpense)}
*Total Expenditure:* ${formatCurrency(financialSummary.totalExpenses)}

*NET BALANCE:* ${formatCurrency(financialSummary.netBalance)}

*Generated on:* ${new Date().toLocaleDateString('en-IN')}`;
    }

    // Exam Report
    return `*CRE – EXAMINATION REPORT*
*Wisdom Islamic Students Organization*

*Centre:* ${centerDisplayName}
*Active Students:* ${students.filter((s) => s.status === 'Active').length}

*Generated on:* ${new Date().toLocaleDateString('en-IN')}`;
  }, [
    reportType,
    centerDisplayName,
    selectedDate,
    classAttendanceData,
    selectedMonth,
    monthlyFees,
    financialSummary,
    attendanceSummary,
    students,
  ]);

  const handleCopyText = async () => {
    const success = await copyToClipboard(whatsAppText);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const handleShareWhatsApp = () => {
    const url = getWhatsAppShareUrl(whatsAppText);
    window.open(url, '_blank');
  };

  const handleDownloadPdf = () => {
    if (reportType === 'class_attendance') {
      const columns = ['#', 'Adm No', 'Student Name', 'Place', 'Parent Phone', 'Status', 'Remarks'];
      let counter = 1;
      const rows: (string | number)[][] = [];

      classAttendanceData.absentList.forEach((item) => {
        rows.push([
          counter++,
          item.student?.admissionNumber || '—',
          item.student?.name || 'Student',
          item.student?.place || '—',
          item.student?.parentPhone || '—',
          'ABSENT',
          'Absent from weekly class',
        ]);
      });

      classAttendanceData.presentList.forEach((item) => {
        rows.push([
          counter++,
          item.student?.admissionNumber || '—',
          item.student?.name || 'Student',
          item.student?.place || '—',
          item.student?.parentPhone || '—',
          'PRESENT',
          item.record.remarks || 'Attended',
        ]);
      });

      classAttendanceData.leaveList.forEach((item) => {
        rows.push([
          counter++,
          item.student?.admissionNumber || '—',
          item.student?.name || 'Student',
          item.student?.place || '—',
          item.student?.parentPhone || '—',
          'LEAVE',
          item.record.remarks || 'Sanctioned leave',
        ]);
      });

      generatePdfReport({
        title: `Class Attendance Report (${selectedDate})`,
        centerName: centerDisplayName,
        period: selectedDate,
        summaryItems: [
          { label: 'Total Students', value: classAttendanceData.total },
          { label: 'Present', value: classAttendanceData.presentList.length },
          { label: 'Absent', value: classAttendanceData.absentList.length },
          { label: 'Turnout Rate', value: `${classAttendanceData.turnoutRate}%` },
        ],
        columns,
        rows,
        fileName: `${centerDisplayName}_class_attendance_${selectedDate}`,
      });
    } else if (reportType === 'fee') {
      const columns = ['Adm No', 'Student Name', 'Expected', 'Paid', 'Outstanding', 'Status'];
      const rows = monthlyFees.map((f) => {
        const st = dataService.getStudentById(f.studentId);
        return [
          st?.admissionNumber || '—',
          st?.name || 'Student',
          formatCurrency(f.expectedFee),
          formatCurrency(f.paidAmount),
          formatCurrency(f.outstandingAmount),
          f.status,
        ];
      });

      generatePdfReport({
        title: `Monthly Fee Collection Report (${selectedMonth})`,
        centerName: centerDisplayName,
        period: selectedMonth,
        summaryItems: [
          { label: 'Total Students', value: monthlyFees.length },
          { label: 'Collected Fee', value: formatCurrency(financialSummary.totalFeeIncome) },
        ],
        columns,
        rows,
        fileName: `cre_fee_report_${selectedMonth}`,
      });
    } else if (reportType === 'financial') {
      const columns = ['Head / Category', 'Type', 'Amount (INR)'];
      const rows = [
        ['Fee Income', 'Income', formatCurrency(financialSummary.totalFeeIncome)],
        ['Donation Income', 'Income', formatCurrency(financialSummary.totalDonationIncome)],
        ['TOTAL INCOME', 'Income', formatCurrency(financialSummary.totalIncome)],
        ['Weekly Session Expenses', 'Expenditure', formatCurrency(financialSummary.totalWeeklyExpense)],
        ['Other Operational Expenses', 'Expenditure', formatCurrency(financialSummary.totalOtherExpense)],
        ['TOTAL EXPENDITURE', 'Expenditure', formatCurrency(financialSummary.totalExpenses)],
        ['NET BALANCE', 'Balance', formatCurrency(financialSummary.netBalance)],
      ];

      generatePdfReport({
        title: `Income & Expenditure Statement (${selectedMonth})`,
        centerName: centerDisplayName,
        period: selectedMonth,
        summaryItems: [
          { label: 'Total Income', value: formatCurrency(financialSummary.totalIncome) },
          { label: 'Total Expenses', value: formatCurrency(financialSummary.totalExpenses) },
          { label: 'Net Balance', value: formatCurrency(financialSummary.netBalance) },
        ],
        columns,
        rows,
        fileName: `cre_financial_report_${selectedMonth}`,
      });
    } else if (reportType === 'attendance') {
      const columns = ['Adm No', 'Student Name', 'Conducted', 'Present', 'Absent', 'Leave', 'Percentage'];
      const rows = students.filter((s) => s.status === 'Active').map((s) => {
        const att = dataService.calculateStudentAttendance(s.id, s.centerId, selectedMonth);
        return [
          s.admissionNumber,
          s.name,
          att.totalConducted,
          att.present,
          att.absent,
          att.leave,
          `${att.percentage}%`,
        ];
      });

      generatePdfReport({
        title: `Monthly Attendance Report (${selectedMonth})`,
        centerName: centerDisplayName,
        period: selectedMonth,
        summaryItems: [
          { label: 'Overall Rate', value: `${attendanceSummary.overallRate}%` },
          { label: 'Total Present', value: attendanceSummary.totalPresent },
          { label: 'Total Absent', value: attendanceSummary.totalAbsent },
        ],
        columns,
        rows,
        fileName: `cre_attendance_report_${selectedMonth}`,
      });
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="pb-2 border-b border-cre-border">
          <h1 className="text-xl sm:text-2xl font-black text-cre-navy">
            Reports & Statements
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Instant on-screen viewing, WhatsApp text sharing, and client-side PDF downloads
          </p>
        </div>

        {/* Report Type Selector Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 bg-slate-100 p-1.5 rounded-2xl">
          <button
            type="button"
            onClick={() => setReportType('class_attendance')}
            className={`flex items-center justify-center py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
              reportType === 'class_attendance'
                ? 'bg-cre-green text-white shadow-xs'
                : 'text-slate-600 hover:text-cre-navy hover:bg-white/60'
            }`}
          >
            <CalendarCheck className="w-4 h-4 mr-1.5" />
            <span>Class Attendance Report</span>
          </button>

          <button
            type="button"
            onClick={() => setReportType('attendance')}
            className={`flex items-center justify-center py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
              reportType === 'attendance'
                ? 'bg-cre-green text-white shadow-xs'
                : 'text-slate-600 hover:text-cre-navy hover:bg-white/60'
            }`}
          >
            <Users className="w-4 h-4 mr-1.5" />
            <span>Monthly Attendance</span>
          </button>

          <button
            type="button"
            onClick={() => setReportType('fee')}
            className={`flex items-center justify-center py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
              reportType === 'fee'
                ? 'bg-cre-navy text-white shadow-xs'
                : 'text-slate-600 hover:text-cre-navy hover:bg-white/60'
            }`}
          >
            <IndianRupee className="w-4 h-4 mr-1.5" />
            <span>Monthly Fee Report</span>
          </button>

          <button
            type="button"
            onClick={() => setReportType('financial')}
            className={`flex items-center justify-center py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
              reportType === 'financial'
                ? 'bg-cre-navy text-white shadow-xs'
                : 'text-slate-600 hover:text-cre-navy hover:bg-white/60'
            }`}
          >
            <Receipt className="w-4 h-4 mr-1.5" />
            <span>Financial Statement</span>
          </button>

          <button
            type="button"
            onClick={() => setReportType('exam')}
            className={`flex items-center justify-center py-2.5 px-3 rounded-xl text-xs font-bold transition-all col-span-2 sm:col-span-1 ${
              reportType === 'exam'
                ? 'bg-cre-navy text-white shadow-xs'
                : 'text-slate-600 hover:text-cre-navy hover:bg-white/60'
            }`}
          >
            <GraduationCap className="w-4 h-4 mr-1.5" />
            <span>Exam Report</span>
          </button>
        </div>

        {/* Filters & Action Buttons */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center space-x-2 bg-white px-3 py-2 rounded-xl border border-cre-border text-xs">
              <span className="text-slate-400 font-medium">Centre:</span>
              <select
                value={selectedCenter}
                onChange={(e) => setSelectedCenter(e.target.value)}
                className="bg-transparent text-slate-800 font-semibold focus:outline-hidden cursor-pointer"
              >
                {centers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
                {reportType !== 'class_attendance' && (
                  <option value="ALL">All CRE Centres (Statewide)</option>
                )}
              </select>
            </div>

            {reportType === 'class_attendance' ? (
              <div className="flex items-center space-x-2 bg-white px-3 py-2 rounded-xl border border-cre-border text-xs font-semibold text-slate-800">
                <Calendar className="w-4 h-4 text-cre-green" />
                <span className="text-slate-400 font-medium">Class Date:</span>
                <select
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-transparent font-bold text-cre-navy focus:outline-hidden cursor-pointer"
                >
                  {availableDates.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                  {availableDates.length === 0 && <option value="2026-11-08">2026-11-08</option>}
                </select>
              </div>
            ) : (
              <div className="flex items-center space-x-2 bg-white px-3 py-2 rounded-xl border border-cre-border text-xs font-semibold text-slate-800">
                <span className="text-slate-400 font-medium">Period:</span>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="bg-transparent text-slate-800 focus:outline-hidden cursor-pointer"
                />
              </div>
            )}
          </div>

          {/* Action Buttons: Copy, WhatsApp, PDF */}
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleCopyText}
              className="inline-flex items-center px-3.5 py-2 rounded-xl text-xs font-bold bg-white text-slate-700 hover:text-cre-navy border border-cre-border hover:bg-slate-50 transition-colors shadow-xs"
            >
              {copied ? <CheckCircle className="w-4 h-4 text-cre-green mr-1.5" /> : <Copy className="w-4 h-4 mr-1.5" />}
              <span>{copied ? 'Copied!' : 'Copy Text'}</span>
            </button>

            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="inline-flex items-center px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-xs"
            >
              <Share2 className="w-4 h-4 mr-1.5" />
              <span>Share on WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPdf}
              className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-bold text-white bg-cre-navy hover:bg-cre-navy-hover transition-colors shadow-xs"
            >
              <Download className="w-4 h-4 mr-1.5" />
              <span>Download PDF</span>
            </button>
          </div>
        </div>

        {/* DEDICATED ON-SCREEN VIEW FOR CLASS ATTENDANCE REPORT */}
        {reportType === 'class_attendance' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-2xl border border-cre-border shadow-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Enrolled</span>
                <span className="text-xl font-black text-cre-navy mt-1 block">{classAttendanceData.total}</span>
              </div>
              <div className="bg-cre-green-light p-4 rounded-2xl border border-cre-green/30 shadow-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-cre-green block">Present Students</span>
                <span className="text-xl font-black text-cre-green mt-1 block">{classAttendanceData.presentList.length}</span>
              </div>
              <div className="bg-red-50 p-4 rounded-2xl border border-red-200 shadow-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-red-600 block">Absent Students</span>
                <span className="text-xl font-black text-red-700 mt-1 block">{classAttendanceData.absentList.length}</span>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-cre-border shadow-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Turnout Rate</span>
                <span className="text-xl font-black text-cre-navy mt-1 block">{classAttendanceData.turnoutRate}%</span>
              </div>
            </div>

            {/* PRESENT & ABSENT STUDENTS LISTS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* PRESENT STUDENTS LIST */}
              <div className="bg-white rounded-2xl border border-cre-border shadow-xs overflow-hidden">
                <div className="bg-cre-green-light px-5 py-3.5 border-b border-cre-green/30 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-cre-green" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-cre-green">
                      Present Students List ({classAttendanceData.presentList.length})
                    </h3>
                  </div>
                  <span className="text-[10px] font-bold text-cre-green bg-white px-2 py-0.5 rounded-full border border-cre-green/30">
                    Attended Class
                  </span>
                </div>

                <div className="p-4">
                  {classAttendanceData.presentList.length > 0 ? (
                    <div className="divide-y divide-slate-100">
                      {classAttendanceData.presentList.map((item, idx) => (
                        <div key={item.record.id} className="py-2.5 flex items-center justify-between text-xs">
                          <div className="flex items-center space-x-3">
                            <span className="w-5 text-slate-400 font-bold">{idx + 1}.</span>
                            <div>
                              <h4 className="font-bold text-slate-900">{item.student?.name || 'Student'}</h4>
                              <p className="text-[11px] text-slate-500">
                                {item.student?.admissionNumber} • {item.student?.place || 'Local'}
                              </p>
                            </div>
                          </div>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cre-green-light text-cre-green border border-cre-green/20">
                            Present
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 text-center text-slate-400 text-xs">
                      No present records found for this date.
                    </div>
                  )}
                </div>
              </div>

              {/* ABSENT STUDENTS LIST */}
              <div className="bg-white rounded-2xl border border-cre-border shadow-xs overflow-hidden">
                <div className="bg-red-50 px-5 py-3.5 border-b border-red-200 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <XCircle className="w-4 h-4 text-red-600" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-red-700">
                      Absent Students List ({classAttendanceData.absentList.length})
                    </h3>
                  </div>
                  <span className="text-[10px] font-bold text-red-700 bg-white px-2 py-0.5 rounded-full border border-red-200">
                    Follow-up Required
                  </span>
                </div>

                <div className="p-4">
                  {classAttendanceData.absentList.length > 0 ? (
                    <div className="divide-y divide-slate-100">
                      {classAttendanceData.absentList.map((item, idx) => {
                        const parentPhone = item.student?.parentPhone || item.student?.studentPhone || '';
                        return (
                          <div key={item.record.id} className="py-2.5 flex items-center justify-between text-xs">
                            <div className="flex items-center space-x-3">
                              <span className="w-5 text-slate-400 font-bold">{idx + 1}.</span>
                              <div>
                                <h4 className="font-bold text-slate-900">{item.student?.name || 'Student'}</h4>
                                <p className="text-[11px] text-slate-500">
                                  {item.student?.admissionNumber} • Parent: {item.student?.parentName || 'Parent'}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              {parentPhone && (
                                <a
                                  href={`https://wa.me/91${parentPhone}?text=${encodeURIComponent(
                                    `Assalamu Alaikum. This is regarding CRE class on ${selectedDate}. Your child ${item.student?.name} was marked absent.`
                                  )}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                                  title="Contact Parent on WhatsApp"
                                >
                                  <Phone className="w-3.5 h-3.5" />
                                </a>
                              )}
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">
                                Absent
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="py-8 text-center text-cre-green text-xs font-semibold">
                      ✓ Excellent! No students were absent on this class date.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* LEAVE STUDENTS (IF ANY) */}
            {classAttendanceData.leaveList.length > 0 && (
              <div className="bg-white rounded-2xl border border-cre-border shadow-xs p-5">
                <div className="flex items-center space-x-2 mb-3">
                  <AlertCircle className="w-4 h-4 text-amber-500" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Sanctioned Leave Students ({classAttendanceData.leaveList.length})
                  </h3>
                </div>
                <div className="divide-y divide-slate-100">
                  {classAttendanceData.leaveList.map((item, idx) => (
                    <div key={item.record.id} className="py-2 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-slate-800">{item.student?.name}</span>
                        <span className="text-slate-400 ml-2">({item.student?.admissionNumber})</span>
                      </div>
                      <span className="text-slate-500 italic text-[11px]">
                        Reason: {item.record.remarks || 'Prior leave approved'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* WhatsApp Preview Card */}
        <div className="bg-white rounded-2xl border border-cre-border shadow-xs p-6">
          <div className="flex items-center justify-between pb-3 border-b border-cre-border mb-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                WhatsApp Formatted Output Preview
              </h3>
            </div>
            <span className="text-[10px] text-slate-400">
              *Bold formatting supported by WhatsApp*
            </span>
          </div>

          <pre className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-800 font-mono whitespace-pre-wrap leading-relaxed">
            {whatsAppText}
          </pre>
        </div>
      </div>
    </AppShell>
  );
}

export default function SuperAdminReportsPage() {
  return (
    <Suspense
      fallback={
        <AppShell>
          <div className="p-8 text-center text-xs font-bold text-cre-navy">Loading Reports...</div>
        </AppShell>
      }
    >
      <SuperAdminReportsContent />
    </Suspense>
  );
}
