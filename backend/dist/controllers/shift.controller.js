import { ShiftService } from '../services/shift.service.js';
import ExcelJS from 'exceljs';
export class ShiftController {
    static async exportSchedule(req, res) {
        try {
            const { gridData, startDate, endDate, dates } = req.body;
            if (!gridData || !dates) {
                return res.status(400).json({ error: 'Data grid dan tanggal diperlukan.' });
            }
            const workbook = new ExcelJS.Workbook();
            const sheet = workbook.addWorksheet('Jadwal Shift');
            // 1. Set Title & Period
            sheet.mergeCells('A1:M1');
            const titleCell = sheet.getCell('A1');
            titleCell.value = 'LAPORAN JADWAL SHIFT KARYAWAN';
            titleCell.font = { size: 16, bold: true };
            titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
            sheet.mergeCells('A2:M2');
            const periodCell = sheet.getCell('A2');
            const startFormatted = new Date(startDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
            const endFormatted = new Date(endDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
            periodCell.value = `Periode: ${startFormatted} – ${endFormatted}`;
            periodCell.font = { size: 12, italic: true };
            periodCell.alignment = { horizontal: 'center', vertical: 'middle' };
            // 3. Header Row (Row 4)
            const headerRow = sheet.getRow(4);
            const headers = [
                'Nama Karyawan', 'ID Karyawan',
                'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu',
                'Total P', 'Total S', 'Total M', 'Total Jam'
            ];
            headers.forEach((h, i) => {
                const cell = headerRow.getCell(i + 1);
                cell.value = h;
                // Add date sub-header if it's a day of the week
                if (i >= 2 && i <= 8 && dates[i - 2]) {
                    const d = dates[i - 2].split('-')[2];
                    const m = dates[i - 2].split('-')[1];
                    cell.value = `${h}\n(${d}/${m})`;
                }
            });
            headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            headerRow.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
            headerRow.height = 35;
            headerRow.eachCell(cell => {
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FF1E293B' } // Dark Slate Like UI
                };
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };
            });
            // 4. Data Rows
            gridData.forEach((row, rIdx) => {
                const sheetRow = sheet.getRow(5 + rIdx);
                sheetRow.getCell(1).value = row.name;
                sheetRow.getCell(2).value = row.id.slice(0, 8);
                let pCount = 0, sCount = 0, mCount = 0;
                dates.forEach((date, cIdx) => {
                    const cell = sheetRow.getCell(3 + cIdx);
                    const code = row.shifts[date] || 'OFF';
                    cell.value = code;
                    cell.alignment = { horizontal: 'center' };
                    cell.border = {
                        top: { style: 'thin' },
                        left: { style: 'thin' },
                        bottom: { style: 'thin' },
                        right: { style: 'thin' }
                    };
                    if (code === 'P') {
                        pCount++;
                        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFBFDBFE' } }; // Blue-200
                        cell.font = { color: { argb: 'FF1D4ED8' }, bold: true };
                    }
                    if (code === 'S') {
                        sCount++;
                        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF9C3' } }; // Yellow-100
                        cell.font = { color: { argb: 'FFA16207' }, bold: true };
                    }
                    if (code === 'M') {
                        mCount++;
                        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } }; // Slate-100
                        cell.font = { color: { argb: 'FF475569' }, bold: true };
                    }
                    if (code === 'OFF') {
                        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } }; // Red-100
                        cell.font = { color: { argb: 'FFB91C1C' }, bold: true };
                    }
                });
                // Totals
                sheetRow.getCell(10).value = pCount;
                sheetRow.getCell(11).value = sCount;
                sheetRow.getCell(12).value = mCount;
                sheetRow.getCell(13).value = (pCount + sCount + mCount) * 8;
                [10, 11, 12, 13].forEach(col => {
                    const cell = sheetRow.getCell(col);
                    cell.alignment = { horizontal: 'center' };
                    cell.font = { bold: true };
                    cell.border = {
                        top: { style: 'thin' },
                        left: { style: 'thin' },
                        bottom: { style: 'thin' },
                        right: { style: 'thin' }
                    };
                });
            });
            // 5. Recap Table (Bottom)
            const recapStartRow = 5 + gridData.length + 2;
            sheet.mergeCells(`A${recapStartRow}:B${recapStartRow}`);
            const recapTitle = sheet.getCell(`A${recapStartRow}`);
            recapTitle.value = 'Rekap Karyawan per Shift (Harian)';
            recapTitle.font = { bold: true };
            const shiftCodes = ['P', 'S', 'M'];
            const shiftLabels = ['Shift Pagi', 'Shift Sore', 'Shift Malam'];
            shiftLabels.forEach((label, i) => {
                const rowNum = recapStartRow + 1 + i;
                const row = sheet.getRow(rowNum);
                row.getCell(1).value = label;
                row.getCell(1).font = { bold: true };
                dates.forEach((date, cIdx) => {
                    let count = 0;
                    gridData.forEach((emp) => {
                        if (emp.shifts[date] === shiftCodes[i])
                            count++;
                    });
                    const cell = row.getCell(3 + cIdx);
                    cell.value = count;
                    cell.alignment = { horizontal: 'center' };
                    cell.border = {
                        top: { style: 'thin' },
                        left: { style: 'thin' },
                        bottom: { style: 'thin' },
                        right: { style: 'thin' }
                    };
                    if (count > 0)
                        cell.font = { bold: true };
                });
                // Recap Border
                for (let c = 1; c <= 9; c++) {
                    row.getCell(c).border = {
                        top: { style: 'thin' },
                        left: { style: 'thin' },
                        bottom: { style: 'thin' },
                        right: { style: 'thin' }
                    };
                }
            });
            // 6. Formatting
            sheet.getColumn(1).width = 25;
            sheet.getColumn(2).width = 15;
            for (let i = 3; i <= 9; i++)
                sheet.getColumn(i).width = 12;
            for (let i = 10; i <= 13; i++)
                sheet.getColumn(i).width = 10;
            sheet.views = [{ state: 'frozen', ySplit: 4 }];
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename=jadwal-shift-${startDate}-${endDate}.xlsx`);
            await workbook.xlsx.write(res);
            res.status(200).end();
        }
        catch (error) {
            console.error('[Excel Export Error]', error);
            res.status(500).json({ error: error.message });
        }
    }
    static async getAllShifts(req, res) {
        try {
            const shifts = await ShiftService.getAllShifts();
            res.json({
                success: true,
                data: shifts,
                meta: { total: shifts.length, limit: shifts.length, page: 1 }
            });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    static async getMyShifts(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId)
                return res.status(401).json({ error: 'Unauthorized' });
            const shifts = await ShiftService.getShiftsByUser(userId);
            res.json({
                success: true,
                data: shifts,
                meta: { total: shifts.length, limit: shifts.length, page: 1 }
            });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    static async createShift(req, res) {
        try {
            const currentUserId = req.user?.id;
            const { userId, date, startTime, endTime } = req.body;
            const newShift = await ShiftService.createShift(userId, new Date(date), startTime, endTime, currentUserId);
            res.status(201).json(newShift);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    static async getSettings(req, res) {
        try {
            const settings = await ShiftService.getShiftSettings();
            res.json(settings);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    static async batchSave(req, res) {
        try {
            const currentUserId = req.user?.id;
            if (!currentUserId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }
            const { shifts: shiftsData, startDate, endDate, userIdsToSync, settings } = req.body;
            if (!Array.isArray(shiftsData)) {
                return res.status(400).json({ error: 'Request body must contain shifts array.' });
            }
            const result = await ShiftService.batchSave(shiftsData, currentUserId, { startDate, endDate, userIdsToSync, settings });
            res.status(200).json(result);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    static async updateShift(req, res) {
        try {
            const currentUserId = req.user?.id;
            const id = req.params.id;
            const updatedShift = await ShiftService.updateShift(parseInt(id), req.body, currentUserId);
            res.json(updatedShift);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    static async deleteShift(req, res) {
        try {
            const currentUserId = req.user?.id;
            const id = req.params.id;
            await ShiftService.deleteShift(parseInt(id), currentUserId);
            res.json({ success: true });
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
}
