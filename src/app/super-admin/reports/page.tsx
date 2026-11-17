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
  SlidersHorizontal,
  X,
} from 'lucide-react';

function SuperAdminReportsContent() {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get('tab') as any) || 'class_attendance';
  const initialDate = searchParams.get('date') || '';
  const initialCenter = searchParams.get('center') || 'ALL';

  const [selectedCenter, setSelectedCenter] = useState<string>(initialCenter);
  const [reportType, setReportType] = useState<'class_attendance' | 'fee' | 'attendance' | 'financial' | 'exam'>(initialTab);
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-11');
  const [copied, setCopied] = useState(false);

  // Column Visibility Filters (Add/Remove content)
  const [showAdmNo, setShowAdmNo] = useState(true);
  const [showName, setShowName] = useState(true);
  const [showGender, setShowGender] = useState(true);
  const [showPlace, setShowPlace] = useState(true);
  const [showContact, setShowContact] = useState(true);
  const [showDetails, setShowDetails] = useState(true);
  const [showStatus, setShowStatus] = useState(true);

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

  // Exam records
  const allExams = useMemo(() => {
    if (selectedCenter === 'ALL') {
      const all: any[] = [];
      centers.forEach((c) => all.push(...dataService.getExams(c.id)));
      return all;
    }
    return dataService.getExams(selectedCenter);
  }, [selectedCenter, centers]);

  const allExamMarks = useMemo(() => {
    if (selectedCenter === 'ALL') {
      const all: any[] = [];
      centers.forEach((c) => all.push(...dataService.getExamMarks(c.id)));
      return all;
    }
    return dataService.getExamMarks(selectedCenter);
  }, [selectedCenter, centers]);

  // Generate WhatsApp text respecting column toggles
  const whatsAppText = useMemo(() => {
    if (reportType === 'class_attendance') {
      const { presentList, absentList, leaveList, total, turnoutRate } = classAttendanceData;

      let text = `*CRE – CLASS ATTENDANCE REPORT*\n*Wisdom Islamic Students Organization*\n\n*Centre:* ${centerDisplayName}\n*Class Date:* ${selectedDate}\n*Attendance Turnout:* ${turnoutRate}% (${presentList.length}/${total} Present)\n\n*SUMMARY*\nTotal Students: ${total}\nPresent: ${presentList.length}\nAbsent: ${absentList.length}\nOn Leave: ${leaveList.length}\n\n*PRESENT STUDENTS (${presentList.length}):*`;

      if (presentList.length === 0) {
        text += '\n- None';
      } else {
        presentList.forEach((item, idx) => {
          const admStr = showAdmNo && item.student?.admissionNumber ? ` (${item.student.admissionNumber})` : '';
          const genderStr = showGender && item.student?.gender ? ` [${item.student.gender}]` : '';
          const placeStr = showPlace && item.student?.place ? ` - ${item.student.place}` : '';
          text += `\n${idx + 1}. ${item.student?.name || 'Student'}${admStr}${genderStr}${placeStr}`;
        });
      }

      text += `\n\n*ABSENT STUDENTS (${absentList.length}):*`;
      if (absentList.length === 0) {
        text += '\n- None';
      } else {
        absentList.forEach((item, idx) => {
          const admStr = showAdmNo && item.student?.admissionNumber ? ` (${item.student.admissionNumber})` : '';
          const genderStr = showGender && item.student?.gender ? ` [${item.student.gender}]` : '';
          const phone = item.student?.parentPhone || item.student?.studentPhone || '';
          const phoneStr = showContact && phone ? ` - Parent: ${phone}` : '';
          text += `\n${idx + 1}. ${item.student?.name || 'Student'}${admStr}${genderStr}${phoneStr}`;
        });
      }

      if (leaveList.length > 0) {
        text += `\n\n*ON LEAVE (${leaveList.length}):*`;
        leaveList.forEach((item, idx) => {
          const admStr = showAdmNo && item.student?.admissionNumber ? ` (${item.student.admissionNumber})` : '';
          const genderStr = showGender && item.student?.gender ? ` [${item.student.gender}]` : '';
          text += `\n${idx + 1}. ${item.student?.name || 'Student'}${admStr}${genderStr} - ${item.record.remarks || 'Sanctioned leave'}`;
        });
      }

      return text;
    }

    if (reportType === 'fee') {
      const paidCount = monthlyFees.filter((f) => f.status === 'Paid' || f.status === 'Advance / Excess').length;
      const partialCount = monthlyFees.filter((f) => f.status === 'Partially Paid').length;
      const unpaidCount = monthlyFees.filter((f) => f.status === 'Unpaid').length;
      const expectedTotal = monthlyFees.reduce((acc, f) => acc + (f.expectedFee || 0), 0);
      const collectedTotal = monthlyFees.reduce((acc, f) => acc + (f.paidAmount || 0), 0);
      const outstandingTotal = monthlyFees.reduce((acc, f) => acc + (f.outstandingAmount || 0), 0);

      return `*CRE – MONTHLY FEE REPORT*\n*Wisdom Islamic Students Organization*\n\n*Scope:* ${centerDisplayName}\n*Month:* ${selectedMonth}\n\n*FEE SUMMARY*\nTotal Students: ${monthlyFees.length}\nPaid: ${paidCount}\nPartially Paid: ${partialCount}\nUnpaid: ${unpaidCount}\n\n*COLLECTION*\nExpected Amount: ${formatCurrency(expectedTotal)}\nCollected Amount: ${formatCurrency(collectedTotal)}\nOutstanding: ${formatCurrency(outstandingTotal)}`;
    }

    if (reportType === 'attendance') {
      return `*CRE – MONTHLY ATTENDANCE STATEMENT*\n*Wisdom Islamic Students Organization*\n\n*Scope:* ${centerDisplayName}\n*Month:* ${selectedMonth}\n\n*ATTENDANCE SUMMARY*\nConducted Sessions: ${attendanceSummary.totalConductedMax}\nPresent Sessions: ${attendanceSummary.totalPresent}\nAbsent Sessions: ${attendanceSummary.totalAbsent}\nOverall Attendance: ${attendanceSummary.overallRate}%`;
    }

    if (reportType === 'financial') {
      return `*CRE – FINANCIAL CONSOLIDATED REPORT*\n*Wisdom Islamic Students Organization*\n\n*Scope:* ${centerDisplayName}\n*Month:* ${selectedMonth}\n\n*INCOME*\nFee Collections: ${formatCurrency(financialSummary.totalFeeIncome)}\nDonations: ${formatCurrency(financialSummary.totalDonationIncome)}\n*Total Income:* ${formatCurrency(financialSummary.totalIncome)}\n\n*EXPENDITURE*\nWeekly Class Expenses: ${formatCurrency(financialSummary.totalWeeklyExpense)}\nOther Operational: ${formatCurrency(financialSummary.totalOtherExpense)}\n*Total Expenses:* ${formatCurrency(financialSummary.totalExpenses)}\n\n*NET BALANCE:* ${formatCurrency(financialSummary.netBalance)}`;
    }

    // Exam Report
    return `*CRE – STATEWIDE EXAMINATION REPORT*\n*Wisdom Islamic Students Organization*\n\n*Scope:* ${centerDisplayName}\n*Total Exams Recorded:* ${allExams.length}\n*Evaluated Marks:* ${allExamMarks.length}`;
  }, [
    reportType,
    centerDisplayName,
    selectedDate,
    classAttendanceData,
    selectedMonth,
    monthlyFees,
    financialSummary,
    attendanceSummary,
    allExams,
    allExamMarks,
    showAdmNo,
    showGender,
    showPlace,
    showContact,
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
      const columns = ['#'];
      if (showAdmNo) columns.push('Adm No');
      if (showName) columns.push('Student Name');
      if (showGender) columns.push('Gender');
      if (showPlace) columns.push('Place');
      if (showContact) columns.push('Parent Phone');
      if (showStatus) columns.push('Status');

      let counter = 1;
      const rows: (string | number)[][] = [];

      classAttendanceData.absentList.forEach((item) => {
        const row: (string | number)[] = [counter++];
        if (showAdmNo) row.push(item.student?.admissionNumber || '—');
        if (showName) row.push(item.student?.name || 'Student');
        if (showGender) row.push(item.student?.gender || 'Boy');
        if (showPlace) row.push(item.student?.place || '—');
        if (showContact) row.push(item.student?.parentPhone || '—');
        if (showStatus) row.push('ABSENT');
        rows.push(row);
      });

      classAttendanceData.presentList.forEach((item) => {
        const row: (string | number)[] = [counter++];
        if (showAdmNo) row.push(item.student?.admissionNumber || '—');
        if (showName) row.push(item.student?.name || 'Student');
        if (showGender) row.push(item.student?.gender || 'Boy');
        if (showPlace) row.push(item.student?.place || '—');
        if (showContact) row.push(item.student?.parentPhone || '—');
        if (showStatus) row.push('PRESENT');
        rows.push(row);
      });

      classAttendanceData.leaveList.forEach((item) => {
        const row: (string | number)[] = [counter++];
        if (showAdmNo) row.push(item.student?.admissionNumber || '—');
        if (showName) row.push(item.student?.name || 'Student');
        if (showGender) row.push(item.student?.gender || 'Boy');
        if (showPlace) row.push(item.student?.place || '—');
        if (showContact) row.push(item.student?.parentPhone || '—');
        if (showStatus) row.push('LEAVE');
        rows.push(row);
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
        fileName: `CRE_class_attendance_${selectedDate}`,
      });
    } else if (reportType === 'fee') {
      const columns = ['#'];
      if (showAdmNo) columns.push('Adm No');
      if (showName) columns.push('Student Name');
      if (showGender) columns.push('Gender');
      if (showPlace) columns.push('Place');
      if (showDetails) {
        columns.push('Expected Fee');
        columns.push('Paid Amount');
        columns.push('Balance Due');
      }
      if (showStatus) columns.push('Status');

      let counter = 1;
      const rows = monthlyFees.map((f) => {
        const st = dataService.getStudentById(f.studentId);
        const row: (string | number)[] = [counter++];
        if (showAdmNo) row.push(st?.admissionNumber || '—');
        if (showName) row.push(st?.name || 'Student');
        if (showGender) row.push(st?.gender || 'Boy');
        if (showPlace) row.push(st?.place || '—');
        if (showDetails) {
          row.push(formatCurrency(f.expectedFee));
          row.push(formatCurrency(f.paidAmount));
          row.push(formatCurrency(f.outstandingAmount));
        }
        if (showStatus) row.push(f.status);
        return row;
      });

      generatePdfReport({
        title: `Monthly Fee Report (${selectedMonth})`,
        centerName: centerDisplayName,
        period: selectedMonth,
        summaryItems: [
          { label: 'Total Enrolled', value: monthlyFees.length },
          { label: 'Collected Fee', value: formatCurrency(financialSummary.totalFeeIncome) },
          { label: 'Outstanding', value: formatCurrency(monthlyFees.reduce((a, b) => a + (b.outstandingAmount || 0), 0)) },
        ],
        columns,
        rows,
        fileName: `CRE_fee_report_${selectedMonth}`,
      });
    } else if (reportType === 'attendance') {
      const columns = ['#'];
      if (showAdmNo) columns.push('Adm No');
      if (showName) columns.push('Student Name');
      if (showGender) columns.push('Gender');
      if (showPlace) columns.push('Place');
      if (showDetails) {
        columns.push('Conducted');
        columns.push('Present');
        columns.push('Absent');
        columns.push('Leave');
      }
      if (showStatus) columns.push('Rate %');

      let counter = 1;
      const rows = students.map((s) => {
        const att = dataService.calculateStudentAttendance(s.id, s.centerId, selectedMonth);
        const row: (string | number)[] = [counter++];
        if (showAdmNo) row.push(s.admissionNumber);
        if (showName) row.push(s.name);
        if (showGender) row.push(s.gender || 'Boy');
        if (showPlace) row.push(s.place || '—');
        if (showDetails) {
          row.push(att.totalConducted);
          row.push(att.present);
          row.push(att.absent);
          row.push(att.leave);
        }
        if (showStatus) row.push(`${att.percentage}%`);
        return row;
      });

      generatePdfReport({
        title: `Monthly Attendance Statement (${selectedMonth})`,
        centerName: centerDisplayName,
        period: selectedMonth,
        summaryItems: [
          { label: 'Overall Rate', value: `${attendanceSummary.overallRate}%` },
          { label: 'Present Sessions', value: attendanceSummary.totalPresent },
          { label: 'Absent Sessions', value: attendanceSummary.totalAbsent },
        ],
        columns,
        rows,
        fileName: `CRE_attendance_statement_${selectedMonth}`,
      });
    } else if (reportType === 'financial') {
      const columns = ['Accounting Head', 'Type', 'Amount (INR)'];
      const rows = [
        ['Fee Collections', 'Income', formatCurrency(financialSummary.totalFeeIncome)],
        ['Donations Received', 'Income', formatCurrency(financialSummary.totalDonationIncome)],
        ['TOTAL INCOME', 'Income', formatCurrency(financialSummary.totalIncome)],
        ['Weekly Class Expenses', 'Expenditure', formatCurrency(financialSummary.totalWeeklyExpense)],
        ['Other Operational Expenses', 'Expenditure', formatCurrency(financialSummary.totalOtherExpense)],
        ['TOTAL EXPENDITURE', 'Expenditure', formatCurrency(financialSummary.totalExpenses)],
        ['NET BALANCE', 'Balance', formatCurrency(financialSummary.netBalance)],
      ];

      generatePdfReport({
        title: `Consolidated Financial Statement (${selectedMonth})`,
        centerName: centerDisplayName,
        period: selectedMonth,
        summaryItems: [
          { label: 'Total Income', value: formatCurrency(financialSummary.totalIncome) },
          { label: 'Total Expenses', value: formatCurrency(financialSummary.totalExpenses) },
          { label: 'Net Balance', value: formatCurrency(financialSummary.netBalance) },
        ],
        columns,
        rows,
        fileName: `CRE_finance_statement_${selectedMonth}`,
      });
    } else if (reportType === 'exam') {
      const columns = ['#'];
      if (showAdmNo) columns.push('Adm No');
      if (showName) columns.push('Student Name');
      if (showGender) columns.push('Gender');
      if (showPlace) columns.push('Place');
      if (showDetails) {
        columns.push('Exam Title');
        columns.push('Score');
        columns.push('Max Marks');
      }
      if (showStatus) columns.push('Result');

      let counter = 1;
      const rows = allExamMarks.map((m) => {
        const st = dataService.getStudentById(m.studentId);
        const ex = dataService.getExamById(m.examId);
        const row: (string | number)[] = [counter++];
        if (showAdmNo) row.push(st?.admissionNumber || '—');
        if (showName) row.push(st?.name || 'Student');
        if (showGender) row.push(st?.gender || 'Boy');
        if (showPlace) row.push(st?.place || '—');
        if (showDetails) {
          row.push(ex?.name || 'Exam');
          row.push(m.marksObtained);
          row.push(m.maxMarks);
        }
        if (showStatus) row.push(m.isPassed ? 'PASSED' : 'NEEDS IMPROVEMENT');
        return row;
      });

      generatePdfReport({
        title: `Statewide Examination Statement`,
        centerName: centerDisplayName,
        period: 'All Records',
        summaryItems: [
          { label: 'Total Exams', value: allExams.length },
          { label: 'Evaluated Marks', value: allExamMarks.length },
        ],
        columns,
        rows,
        fileName: `CRE_exam_records`,
      });
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="pb-2 border-b border-cre-border">
          <h1 className="text-xl sm:text-2xl font-black text-cre-navy">
            Statewide Reports & Intelligence
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Centralized multi-centre reporting with dynamic field filtering, WhatsApp summaries, and PDF generation
          </p>
        </div>

        {/* Tab Selector */}
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
            <span>Class Attendance</span>
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
            <span>Fee Statement</span>
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
            <span>Financial Accounts</span>
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
            <span>Exam Marksheet</span>
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
            ) : reportType === 'exam' ? (
              <div className="text-xs font-bold text-cre-navy bg-white px-3.5 py-2 rounded-xl border border-cre-border">
                All Examination Records
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

        {/* COLUMN FILTERING BAR (Toggle fields to add / remove) */}
        {reportType !== 'financial' && (
          <div className="bg-white p-4 rounded-2xl border border-cre-border shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
              <div className="flex items-center space-x-2 text-xs font-bold text-cre-navy uppercase tracking-wider">
                <SlidersHorizontal className="w-4 h-4 text-cre-green" />
                <span>Filter Report Columns & Content</span>
              </div>
              <span className="text-[11px] text-slate-400">
                Click any column to include or remove it from the table, PDF export, and WhatsApp text
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setShowAdmNo(!showAdmNo)}
                className={`inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  showAdmNo
                    ? 'bg-cre-green text-white shadow-xs'
                    : 'bg-slate-100 text-slate-400 line-through hover:bg-slate-200'
                }`}
              >
                {showAdmNo ? <CheckCircle className="w-3.5 h-3.5 mr-1.5" /> : <X className="w-3.5 h-3.5 mr-1.5" />}
                Admission No.
              </button>

              <button
                type="button"
                onClick={() => setShowName(!showName)}
                className={`inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  showName
                    ? 'bg-cre-green text-white shadow-xs'
                    : 'bg-slate-100 text-slate-400 line-through hover:bg-slate-200'
                }`}
              >
                {showName ? <CheckCircle className="w-3.5 h-3.5 mr-1.5" /> : <X className="w-3.5 h-3.5 mr-1.5" />}
                Student Name
              </button>

              <button
                type="button"
                onClick={() => setShowGender(!showGender)}
                className={`inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  showGender
                    ? 'bg-cre-green text-white shadow-xs'
                    : 'bg-slate-100 text-slate-400 line-through hover:bg-slate-200'
                }`}
              >
                {showGender ? <CheckCircle className="w-3.5 h-3.5 mr-1.5" /> : <X className="w-3.5 h-3.5 mr-1.5" />}
                Gender (Boy / Girl)
              </button>

              <button
                type="button"
                onClick={() => setShowPlace(!showPlace)}
                className={`inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  showPlace
                    ? 'bg-cre-green text-white shadow-xs'
                    : 'bg-slate-100 text-slate-400 line-through hover:bg-slate-200'
                }`}
              >
                {showPlace ? <CheckCircle className="w-3.5 h-3.5 mr-1.5" /> : <X className="w-3.5 h-3.5 mr-1.5" />}
                Place / Location
              </button>

              {reportType === 'class_attendance' && (
                <button
                  type="button"
                  onClick={() => setShowContact(!showContact)}
                  className={`inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    showContact
                      ? 'bg-cre-green text-white shadow-xs'
                      : 'bg-slate-100 text-slate-400 line-through hover:bg-slate-200'
                  }`}
                >
                  {showContact ? <CheckCircle className="w-3.5 h-3.5 mr-1.5" /> : <X className="w-3.5 h-3.5 mr-1.5" />}
                  Parent Phone / Contact
                </button>
              )}

              <button
                type="button"
                onClick={() => setShowDetails(!showDetails)}
                className={`inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  showDetails
                    ? 'bg-cre-green text-white shadow-xs'
                    : 'bg-slate-100 text-slate-400 line-through hover:bg-slate-200'
                }`}
              >
                {showDetails ? <CheckCircle className="w-3.5 h-3.5 mr-1.5" /> : <X className="w-3.5 h-3.5 mr-1.5" />}
                {reportType === 'fee' ? 'Fee Amounts' : reportType === 'attendance' ? 'Session Numbers' : reportType === 'exam' ? 'Exam & Marks' : 'Detailed Records'}
              </button>

              <button
                type="button"
                onClick={() => setShowStatus(!showStatus)}
                className={`inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  showStatus
                    ? 'bg-cre-green text-white shadow-xs'
                    : 'bg-slate-100 text-slate-400 line-through hover:bg-slate-200'
                }`}
              >
                {showStatus ? <CheckCircle className="w-3.5 h-3.5 mr-1.5" /> : <X className="w-3.5 h-3.5 mr-1.5" />}
                Status / Percentage
              </button>
            </div>
          </div>
        )}

        {/* 1. CLASS ATTENDANCE VIEW */}
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

            <div className="bg-white rounded-2xl border border-cre-border shadow-xs overflow-hidden">
              <div className="p-4 border-b border-cre-border flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-cre-navy">
                  Class Attendance Turnout – {selectedDate} ({centerDisplayName})
                </h3>
                <span className="text-[11px] text-slate-500 font-medium">
                  {classAttendanceData.records.length} Students Logged
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-cre-border text-[11px] font-bold text-cre-navy uppercase">
                    <tr>
                      <th className="py-3 px-4">#</th>
                      {showAdmNo && <th className="py-3 px-4">Adm No</th>}
                      {showName && <th className="py-3 px-4">Student Name</th>}
                      {showGender && <th className="py-3 px-4">Gender</th>}
                      {showPlace && <th className="py-3 px-4">Place</th>}
                      {showContact && <th className="py-3 px-4">Parent Phone</th>}
                      {showStatus && <th className="py-3 px-4 text-right">Attendance Status</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cre-border">
                    {classAttendanceData.records.map((r, idx) => {
                      const st = dataService.getStudentById(r.studentId);
                      return (
                        <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3 px-4 text-slate-400 font-bold">{idx + 1}</td>
                          {showAdmNo && (
                            <td className="py-3 px-4 font-mono font-bold text-cre-navy">
                              {st?.admissionNumber || '—'}
                            </td>
                          )}
                          {showName && (
                            <td className="py-3 px-4 font-bold text-slate-900">{st?.name || 'Student'}</td>
                          )}
                          {showGender && (
                            <td className="py-3 px-4">
                              <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                (st?.gender || 'Boy') === 'Boy' ? 'bg-blue-50 text-blue-700' : 'bg-pink-50 text-pink-700'
                              }`}>
                                {st?.gender || 'Boy'}
                              </span>
                            </td>
                          )}
                          {showPlace && (
                            <td className="py-3 px-4 text-slate-600">{st?.place || '—'}</td>
                          )}
                          {showContact && (
                            <td className="py-3 px-4 font-mono text-slate-600">
                              {st?.parentPhone || st?.studentPhone || '—'}
                            </td>
                          )}
                          {showStatus && (
                            <td className="py-3 px-4 text-right">
                              <span
                                className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                  r.status === 'Present'
                                    ? 'bg-cre-green-light text-cre-green border border-cre-green/30'
                                    : r.status === 'Absent'
                                    ? 'bg-red-50 text-red-700 border border-red-200'
                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                }`}
                              >
                                {r.status}
                              </span>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 2. MONTHLY ATTENDANCE STATEMENT VIEW */}
        {reportType === 'attendance' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-2xl border border-cre-border shadow-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Conducted Sessions</span>
                <span className="text-xl font-black text-cre-navy mt-1 block">{attendanceSummary.totalConductedMax}</span>
              </div>
              <div className="bg-cre-green-light p-4 rounded-2xl border border-cre-green/30 shadow-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-cre-green block">Present Turnout</span>
                <span className="text-xl font-black text-cre-green mt-1 block">{attendanceSummary.totalPresent}</span>
              </div>
              <div className="bg-red-50 p-4 rounded-2xl border border-red-200 shadow-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-red-600 block">Absent Count</span>
                <span className="text-xl font-black text-red-700 mt-1 block">{attendanceSummary.totalAbsent}</span>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-cre-border shadow-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Average Attendance</span>
                <span className="text-xl font-black text-cre-navy mt-1 block">{attendanceSummary.overallRate}%</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-cre-border shadow-xs overflow-hidden">
              <div className="p-4 border-b border-cre-border">
                <h3 className="text-xs font-bold uppercase tracking-wider text-cre-navy">
                  Statewide Monthly Attendance Statement ({selectedMonth})
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-cre-border text-[11px] font-bold text-cre-navy uppercase">
                    <tr>
                      <th className="py-3 px-4">#</th>
                      {showAdmNo && <th className="py-3 px-4">Adm No</th>}
                      {showName && <th className="py-3 px-4">Student Name</th>}
                      {showGender && <th className="py-3 px-4">Gender</th>}
                      {showPlace && <th className="py-3 px-4">Place</th>}
                      {showDetails && (
                        <>
                          <th className="py-3 px-4">Conducted</th>
                          <th className="py-3 px-4">Present</th>
                          <th className="py-3 px-4">Absent</th>
                          <th className="py-3 px-4">Leave</th>
                        </>
                      )}
                      {showStatus && <th className="py-3 px-4 text-right">Attendance Rate</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cre-border">
                    {students.map((s, idx) => {
                      const att = dataService.calculateStudentAttendance(s.id, s.centerId, selectedMonth);
                      return (
                        <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3 px-4 text-slate-400 font-bold">{idx + 1}</td>
                          {showAdmNo && (
                            <td className="py-3 px-4 font-mono font-bold text-cre-navy">{s.admissionNumber}</td>
                          )}
                          {showName && (
                            <td className="py-3 px-4 font-bold text-slate-900">{s.name}</td>
                          )}
                          {showGender && (
                            <td className="py-3 px-4">
                              <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                (s.gender || 'Boy') === 'Boy' ? 'bg-blue-50 text-blue-700' : 'bg-pink-50 text-pink-700'
                              }`}>
                                {s.gender || 'Boy'}
                              </span>
                            </td>
                          )}
                          {showPlace && (
                            <td className="py-3 px-4 text-slate-600">{s.place || '—'}</td>
                          )}
                          {showDetails && (
                            <>
                              <td className="py-3 px-4 text-slate-700 font-semibold">{att.totalConducted}</td>
                              <td className="py-3 px-4 text-cre-green font-bold">{att.present}</td>
                              <td className="py-3 px-4 text-red-600 font-semibold">{att.absent}</td>
                              <td className="py-3 px-4 text-amber-600">{att.leave}</td>
                            </>
                          )}
                          {showStatus && (
                            <td className="py-3 px-4 text-right">
                              <span
                                className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                  att.percentage >= 80
                                    ? 'bg-cre-green-light text-cre-green'
                                    : att.percentage >= 60
                                    ? 'bg-amber-50 text-amber-700'
                                    : 'bg-red-50 text-red-700'
                                }`}
                              >
                                {att.percentage}%
                              </span>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 3. MONTHLY FEE STATEMENT VIEW */}
        {reportType === 'fee' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-2xl border border-cre-border shadow-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Expected</span>
                <span className="text-xl font-black text-cre-navy mt-1 block">
                  {formatCurrency(monthlyFees.reduce((acc, f) => acc + (f.expectedFee || 0), 0))}
                </span>
              </div>
              <div className="bg-cre-green-light p-4 rounded-2xl border border-cre-green/30 shadow-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-cre-green block">Collected Fee</span>
                <span className="text-xl font-black text-cre-green mt-1 block">
                  {formatCurrency(monthlyFees.reduce((acc, f) => acc + (f.paidAmount || 0), 0))}
                </span>
              </div>
              <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 shadow-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block">Outstanding</span>
                <span className="text-xl font-black text-amber-800 mt-1 block">
                  {formatCurrency(monthlyFees.reduce((acc, f) => acc + (f.outstandingAmount || 0), 0))}
                </span>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-cre-border shadow-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Enrolled</span>
                <span className="text-xl font-black text-cre-navy mt-1 block">{monthlyFees.length}</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-cre-border shadow-xs overflow-hidden">
              <div className="p-4 border-b border-cre-border">
                <h3 className="text-xs font-bold uppercase tracking-wider text-cre-navy">
                  Monthly Student Fee Register ({selectedMonth})
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-cre-border text-[11px] font-bold text-cre-navy uppercase">
                    <tr>
                      <th className="py-3 px-4">#</th>
                      {showAdmNo && <th className="py-3 px-4">Adm No</th>}
                      {showName && <th className="py-3 px-4">Student Name</th>}
                      {showGender && <th className="py-3 px-4">Gender</th>}
                      {showPlace && <th className="py-3 px-4">Place</th>}
                      {showDetails && (
                        <>
                          <th className="py-3 px-4">Expected</th>
                          <th className="py-3 px-4">Paid</th>
                          <th className="py-3 px-4">Outstanding</th>
                        </>
                      )}
                      {showStatus && <th className="py-3 px-4 text-right">Fee Status</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cre-border">
                    {monthlyFees.map((f, idx) => {
                      const st = dataService.getStudentById(f.studentId);
                      return (
                        <tr key={f.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3 px-4 text-slate-400 font-bold">{idx + 1}</td>
                          {showAdmNo && (
                            <td className="py-3 px-4 font-mono font-bold text-cre-navy">{st?.admissionNumber || '—'}</td>
                          )}
                          {showName && (
                            <td className="py-3 px-4 font-bold text-slate-900">{st?.name || 'Student'}</td>
                          )}
                          {showGender && (
                            <td className="py-3 px-4">
                              <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                (st?.gender || 'Boy') === 'Boy' ? 'bg-blue-50 text-blue-700' : 'bg-pink-50 text-pink-700'
                              }`}>
                                {st?.gender || 'Boy'}
                              </span>
                            </td>
                          )}
                          {showPlace && (
                            <td className="py-3 px-4 text-slate-600">{st?.place || '—'}</td>
                          )}
                          {showDetails && (
                            <>
                              <td className="py-3 px-4 text-slate-700">{formatCurrency(f.expectedFee)}</td>
                              <td className="py-3 px-4 text-cre-green font-bold">{formatCurrency(f.paidAmount)}</td>
                              <td className="py-3 px-4 text-red-600 font-semibold">{formatCurrency(f.outstandingAmount)}</td>
                            </>
                          )}
                          {showStatus && (
                            <td className="py-3 px-4 text-right">
                              <span
                                className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                  f.status === 'Paid'
                                    ? 'bg-cre-green-light text-cre-green'
                                    : f.status === 'Partially Paid'
                                    ? 'bg-amber-50 text-amber-700'
                                    : 'bg-red-50 text-red-700'
                                }`}
                              >
                                {f.status}
                              </span>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 4. FINANCIAL STATEMENT VIEW */}
        {reportType === 'financial' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-cre-green-light p-5 rounded-2xl border border-cre-green/30 shadow-xs">
                <span className="text-xs font-bold uppercase tracking-wider text-cre-green block">Total Statewide Income</span>
                <span className="text-2xl font-black text-cre-green mt-1 block">
                  {formatCurrency(financialSummary.totalIncome)}
                </span>
                <p className="text-[11px] text-slate-500 mt-1">Student fees and general donations</p>
              </div>

              <div className="bg-red-50 p-5 rounded-2xl border border-red-200 shadow-xs">
                <span className="text-xs font-bold uppercase tracking-wider text-red-600 block">Total Expenditure</span>
                <span className="text-2xl font-black text-red-700 mt-1 block">
                  {formatCurrency(financialSummary.totalExpenses)}
                </span>
                <p className="text-[11px] text-slate-500 mt-1">Operating costs and weekly sessions</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-cre-border shadow-xs">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">Net System Surplus</span>
                <span className="text-2xl font-black text-cre-navy mt-1 block">
                  {formatCurrency(financialSummary.netBalance)}
                </span>
                <p className="text-[11px] text-slate-500 mt-1">Consolidated reserve balance</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-cre-border shadow-xs overflow-hidden">
              <div className="p-4 border-b border-cre-border">
                <h3 className="text-xs font-bold uppercase tracking-wider text-cre-navy">
                  Statewide Financial Statement ({selectedMonth})
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-cre-border text-[11px] font-bold text-cre-navy uppercase">
                    <tr>
                      <th className="py-3 px-4">Accounting Head</th>
                      <th className="py-3 px-4">Transaction Type</th>
                      <th className="py-3 px-4 text-right">Amount (INR)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cre-border font-medium">
                    <tr className="hover:bg-slate-50/60">
                      <td className="py-3 px-4 font-bold text-slate-900">Student Fee Collections</td>
                      <td className="py-3 px-4 text-cre-green font-semibold">Income</td>
                      <td className="py-3 px-4 text-right font-bold text-cre-green">{formatCurrency(financialSummary.totalFeeIncome)}</td>
                    </tr>
                    <tr className="hover:bg-slate-50/60">
                      <td className="py-3 px-4 font-bold text-slate-900">Direct Donations Received</td>
                      <td className="py-3 px-4 text-cre-green font-semibold">Income</td>
                      <td className="py-3 px-4 text-right font-bold text-cre-green">{formatCurrency(financialSummary.totalDonationIncome)}</td>
                    </tr>
                    <tr className="bg-cre-green-light/30">
                      <td className="py-3 px-4 font-black text-cre-navy uppercase">TOTAL CONSOLIDATED INCOME</td>
                      <td className="py-3 px-4 text-cre-green font-bold">Total Inflow</td>
                      <td className="py-3 px-4 text-right font-black text-cre-green">{formatCurrency(financialSummary.totalIncome)}</td>
                    </tr>
                    <tr className="hover:bg-slate-50/60">
                      <td className="py-3 px-4 font-bold text-slate-900">Weekly Class Sessions Operational Expenses</td>
                      <td className="py-3 px-4 text-red-600 font-semibold">Expenditure</td>
                      <td className="py-3 px-4 text-right font-bold text-red-600">{formatCurrency(financialSummary.totalWeeklyExpense)}</td>
                    </tr>
                    <tr className="hover:bg-slate-50/60">
                      <td className="py-3 px-4 font-bold text-slate-900">Other General & Maintenance Expenses</td>
                      <td className="py-3 px-4 text-red-600 font-semibold">Expenditure</td>
                      <td className="py-3 px-4 text-right font-bold text-red-600">{formatCurrency(financialSummary.totalOtherExpense)}</td>
                    </tr>
                    <tr className="bg-red-50/30">
                      <td className="py-3 px-4 font-black text-cre-navy uppercase">TOTAL CONSOLIDATED EXPENDITURE</td>
                      <td className="py-3 px-4 text-red-600 font-bold">Total Outflow</td>
                      <td className="py-3 px-4 text-right font-black text-red-600">{formatCurrency(financialSummary.totalExpenses)}</td>
                    </tr>
                    <tr className="bg-slate-100 font-black">
                      <td className="py-3.5 px-4 text-cre-navy uppercase">NET SURPLUS / BALANCE</td>
                      <td className="py-3.5 px-4 text-slate-600">Net</td>
                      <td className="py-3.5 px-4 text-right text-base text-cre-navy">{formatCurrency(financialSummary.netBalance)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 5. EXAM REPORT VIEW */}
        {reportType === 'exam' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-2xl border border-cre-border shadow-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Exams Conducted</span>
                <span className="text-xl font-black text-cre-navy mt-1 block">{allExams.length}</span>
              </div>
              <div className="bg-cre-green-light p-4 rounded-2xl border border-cre-green/30 shadow-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-cre-green block">Recorded Marks</span>
                <span className="text-xl font-black text-cre-green mt-1 block">{allExamMarks.length}</span>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-cre-border shadow-xs col-span-2 sm:col-span-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Students</span>
                <span className="text-xl font-black text-cre-navy mt-1 block">{students.length}</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-cre-border shadow-xs overflow-hidden">
              <div className="p-4 border-b border-cre-border">
                <h3 className="text-xs font-bold uppercase tracking-wider text-cre-navy">
                  Examination Marks Roster ({centerDisplayName})
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-cre-border text-[11px] font-bold text-cre-navy uppercase">
                    <tr>
                      <th className="py-3 px-4">#</th>
                      {showAdmNo && <th className="py-3 px-4">Adm No</th>}
                      {showName && <th className="py-3 px-4">Student Name</th>}
                      {showGender && <th className="py-3 px-4">Gender</th>}
                      {showPlace && <th className="py-3 px-4">Place</th>}
                      {showDetails && (
                        <>
                          <th className="py-3 px-4">Exam Title</th>
                          <th className="py-3 px-4">Score</th>
                          <th className="py-3 px-4">Max Marks</th>
                        </>
                      )}
                      {showStatus && <th className="py-3 px-4 text-right">Result</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cre-border">
                    {allExamMarks.map((m, idx) => {
                      const st = dataService.getStudentById(m.studentId);
                      const ex = dataService.getExamById(m.examId);
                      return (
                        <tr key={m.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3 px-4 text-slate-400 font-bold">{idx + 1}</td>
                          {showAdmNo && (
                            <td className="py-3 px-4 font-mono font-bold text-cre-navy">{st?.admissionNumber || '—'}</td>
                          )}
                          {showName && (
                            <td className="py-3 px-4 font-bold text-slate-900">{st?.name || 'Student'}</td>
                          )}
                          {showGender && (
                            <td className="py-3 px-4">
                              <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                (st?.gender || 'Boy') === 'Boy' ? 'bg-blue-50 text-blue-700' : 'bg-pink-50 text-pink-700'
                              }`}>
                                {st?.gender || 'Boy'}
                              </span>
                            </td>
                          )}
                          {showPlace && (
                            <td className="py-3 px-4 text-slate-600">{st?.place || '—'}</td>
                          )}
                          {showDetails && (
                            <>
                              <td className="py-3 px-4 font-semibold text-slate-800">{ex?.name || 'Examination'}</td>
                              <td className="py-3 px-4 font-bold text-cre-green">{m.marksObtained}</td>
                              <td className="py-3 px-4 text-slate-500">{m.maxMarks}</td>
                            </>
                          )}
                          {showStatus && (
                            <td className="py-3 px-4 text-right">
                              <span
                                className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                  m.isPassed
                                    ? 'bg-cre-green-light text-cre-green'
                                    : 'bg-red-50 text-red-700'
                                }`}
                              >
                                {m.isPassed ? 'PASSED' : 'NEEDS IMPROVEMENT'}
                              </span>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                    {allExamMarks.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-400">
                          No examination marks entered yet for this selection.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
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
