import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

export const exportToExcel = async (data: any[], fileName: string) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Attendance');

    // 1. Define Columns untuk Tabel 1 (Daily Logs)
    worksheet.columns = [
        { header: 'Tanggal', key: 'dateStr', width: 15 },
        { header: 'Nama Karyawan', key: 'userName', width: 25 },
        { header: 'Jam Masuk', key: 'checkInTime', width: 15 },
        { header: 'Jam Keluar', key: 'checkOutTime', width: 15 },
        { header: 'Status', key: 'status', width: 15 },
    ];

    // 2. Add Rows and Formatting untuk Tabel 1
    const rows = data.map(item => {
        const date = new Date(item.date);
        const dateStr = date.toISOString().split('T')[0]; // Format 'YYYY-MM-DD'
        
        const checkIn = item.checkIn ? new Date(item.checkIn) : null;
        const checkOut = item.checkOut ? new Date(item.checkOut) : null;
        
        const checkInTime = checkIn ? checkIn.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '';
        const checkOutTime = checkOut ? checkOut.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '';

        return {
            dateStr,
            userName: item.userName,
            checkInTime,
            checkOutTime,
            status: item.status
        };
    });

    worksheet.addRows(rows);

    // 3. Style Headers Tabel 1
    const headerRow = worksheet.getRow(1);
    headerRow.eachCell((cell) => {
        cell.font = { bold: true };
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    });

    // 4. Style Data Cells Tabel 1
    worksheet.eachRow((row, rowNumber) => {
        if (rowNumber > 1) {
            row.eachCell((cell) => {
                cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
            });
        }
    });

    // 5. Add Recap (Summary Tabel 2)
    worksheet.addRow([]); // Empty row
    worksheet.addRow([]); // Empty row
    
    const summaryHeader = ['Nama Karyawan', 'Total Hari Kerja', 'Hadir', 'Izin', 'Sakit', 'Alpa', 'Total Libur'];
    const summaryHeaderRow = worksheet.addRow(summaryHeader);
    
    summaryHeaderRow.eachCell(cell => {
        cell.font = { bold: true };
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    });

    // Kalkulasi Rekap per Karyawan
    const summaryMap: Record<string, { total: number, hadir: number, izin: number, sakit: number, alpa: number, libur: number }> = {};
    
    data.forEach(item => {
        const name = item.userName || 'Unknown';
        if (!summaryMap[name]) {
            summaryMap[name] = { total: 0, hadir: 0, izin: 0, sakit: 0, alpa: 0, libur: 0 };
        }
        summaryMap[name].total += 1;
        
        const status = (item.status || '').toLowerCase();
        if (status === 'hadir' || status === 'terlambat') summaryMap[name].hadir += 1;
        else if (status === 'izin') summaryMap[name].izin += 1;
        else if (status === 'sakit') summaryMap[name].sakit += 1;
        else if (status === 'alpha' || status === 'alpa') summaryMap[name].alpa += 1;
        else if (status === 'libur' || status === 'off') summaryMap[name].libur += 1;
    });

    Object.entries(summaryMap).forEach(([name, counts]) => {
        const row = worksheet.addRow([name, counts.total, counts.hadir, counts.izin, counts.sakit, counts.alpa, counts.libur]);
        row.eachCell(cell => {
             cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
        });
    });

    // Freeze Header
    worksheet.views = [
        { state: 'frozen', xSplit: 0, ySplit: 1 }
    ];

    // Download
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `${fileName}.xlsx`);
};

export const exportToCSV = (data: any[], fileName: string) => {
    const headers = [
        'Nama Karyawan', 'Tanggal', 'Hari', 'Shift', 'Jam Masuk', 'Jam Keluar',
        'Total Jam Kerja', 'Status', 'Lokasi (Alamat)', 'Latitude', 'Longitude', 'Keterangan'
    ];

    const rows = data.map(item => {
        const date = new Date(item.date);
        const day = date.toLocaleDateString('id-ID', { weekday: 'long' });
        const dateStr = date.toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' });
        
        const checkIn = item.checkIn ? new Date(item.checkIn) : null;
        const checkOut = item.checkOut ? new Date(item.checkOut) : null;
        
        const checkInTime = checkIn ? checkIn.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '--:--';
        const checkOutTime = checkOut ? checkOut.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '--:--';
        
        let totalHoursInt = 0;
        if (checkIn && checkOut) {
            totalHoursInt = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60);
        }
        const totalHours = totalHoursInt > 0 ? totalHoursInt.toFixed(2) : '0';

        return [
            item.userName,
            dateStr,
            day,
            item.shift || '-',
            checkInTime,
            checkOutTime,
            totalHours,
            item.status,
            `"${(item.location || '-').replace(/"/g, '""')}"`,
            item.latitude || '-',
            item.longitude || '-',
            item.note || ''
        ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `${fileName}.csv`);
};
