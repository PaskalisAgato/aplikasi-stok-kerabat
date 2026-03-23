import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

export const exportToExcel = async (data: any[], fileName: string) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Attendance');

    // 1. Define Columns
    worksheet.columns = [
        { header: 'Nama Karyawan', key: 'userName', width: 25 },
        { header: 'Tanggal', key: 'dateStr', width: 15 },
        { header: 'Hari', key: 'day', width: 10 },
        { header: 'Shift', key: 'shift', width: 8 },
        { header: 'Jam Masuk', key: 'checkInTime', width: 12 },
        { header: 'Jam Keluar', key: 'checkOutTime', width: 12 },
        { header: 'Total Jam', key: 'totalHours', width: 12 },
        { header: 'Status', key: 'status', width: 12 },
        { header: 'Lokasi (Alamat)', key: 'location', width: 40 },
        { header: 'Latitude', key: 'latitude', width: 15 },
        { header: 'Longitude', key: 'longitude', width: 15 },
        { header: 'Keterangan', key: 'note', width: 20 },
    ];

    // 2. Add Rows and Formatting
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

        return {
            userName: item.userName,
            dateStr,
            day,
            shift: item.shift || '-',
            checkInTime,
            checkOutTime,
            totalHours,
            status: item.status,
            location: item.location || '-',
            latitude: item.latitude || '-',
            longitude: item.longitude || '-',
            note: item.note || ''
        };
    });

    worksheet.addRows(rows);

    // 3. Style Headers
    const headerRow = worksheet.getRow(1);
    headerRow.eachCell((cell) => {
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF1E293B' }, // Slate-800
        };
        cell.font = {
            bold: true,
            color: { argb: 'FFFFFFFF' },
        };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' },
        };
    });

    // 4. Style Data Cells
    worksheet.eachRow((row, rowNumber) => {
        if (rowNumber > 1) {
            row.eachCell((cell) => {
                cell.alignment = { horizontal: 'center', vertical: 'middle' };
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' },
                };
            });
        }
    });

    // 5. Add Recap (Rekap)
    worksheet.addRow([]); // Empty row
    const rekapStart = worksheet.lastRow!.number + 1;
    
    worksheet.addRow(['REKAP ABSENSI']);
    worksheet.mergeCells(`A${rekapStart}:C${rekapStart}`);
    worksheet.getCell(`A${rekapStart}`).font = { bold: true, size: 14 };

    const summary = {
        hadir: data.filter(i => i.status === 'Hadir').length,
        terlambat: data.filter(i => i.status === 'Terlambat').length,
        alpha: data.filter(i => i.status === 'Alpha').length,
        izin: data.filter(i => i.status === 'Izin').length,
        totalHours: rows.reduce((acc, r) => acc + parseFloat(r.totalHours), 0).toFixed(2)
    };

    worksheet.addRow(['Total Hadir', summary.hadir]);
    worksheet.addRow(['Total Terlambat', summary.terlambat]);
    worksheet.addRow(['Total Alpha', summary.alpha]);
    worksheet.addRow(['Total Izin', summary.izin]);
    worksheet.addRow(['Total Jam Kerja', summary.totalHours + ' Jam']);

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
