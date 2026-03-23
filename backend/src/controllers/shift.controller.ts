import { Request, Response } from 'express';
import { ShiftService } from '../services/shift.service.js';
import ExcelJS from 'exceljs';

export class ShiftController {
    static async exportShiftTemplate(req: Request, res: Response) {
        try {
            const workbook = new ExcelJS.Workbook();
            const sheet = workbook.addWorksheet('Shift Karyawan');

            // Header structure based on the image and request
            // Row 1: Main Headers
            // A1: Nama
            // B1-H1: Senin - Minggu
            // I1-K1: Jumlah Grup Karyawan/Shift (minggu)
            // L1: Total Jam Kerja

            sheet.mergeCells('A1:A2');
            sheet.getCell('A1').value = 'Nama';
            
            const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
            days.forEach((day, i) => {
                const col = String.fromCharCode(66 + i); // B, C, D...
                sheet.getCell(`${col}1`).value = day;
                sheet.getCell(`${col}2`).value = i + 1; // Date mock 1-7
            });

            sheet.mergeCells('I1:K1');
            sheet.getCell('I1').value = 'Jumlah Grup Karyawan/Shift (minggu)';
            sheet.getCell('I2').value = 'Shift Pagi';
            sheet.getCell('J2').value = 'Shift Sore';
            sheet.getCell('K2').value = 'Shift Malam';

            sheet.mergeCells('L1:L2');
            sheet.getCell('L1').value = 'Total Jam Kerja';

            // Styling Headers
            const headerRows = [sheet.getRow(1), sheet.getRow(2)];
            headerRows.forEach(row => {
                row.font = { bold: true, color: { argb: 'FFFFFFFF' } };
                row.alignment = { vertical: 'middle', horizontal: 'center' };
                row.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FF008080' } // Teal background like the image
                };
            });

            // Sample Data for Employees A-E
            const employees = ['A', 'B', 'C', 'D', 'E'];
            const sampleData = [
                ['P', 'OFF', 'S', 'OFF', 'M', 'S', 'M'],
                ['S', 'OFF', 'P', 'S', 'OFF', 'M', 'P'],
                ['M', 'OFF', 'OFF', 'M', 'P', 'P', 'S'],
                ['OFF', 'P', 'M', 'P', 'OFF', 'S', 'M'],
                ['OFF', 'S', 'P', 'OFF', 'S', 'M', 'P']
            ];

            employees.forEach((name, rowIndex) => {
                const rowNum = rowIndex + 3;
                const row = sheet.getRow(rowNum);
                row.getCell(1).value = name;
                
                const shifts = sampleData[rowIndex];
                shifts.forEach((shift, colIndex) => {
                    const cell = row.getCell(2 + colIndex);
                    cell.value = shift;
                    
                    // Apply conditional colors
                    if (shift === 'P') cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFB3E5FC' } }; // Light Blue
                    if (shift === 'S') cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF9C4' } }; // Light Yellow
                    if (shift === 'M') cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } }; // Gray
                    if (shift === 'OFF') {
                        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF0000' } }; // Red
                        cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
                    }
                    cell.alignment = { horizontal: 'center' };
                });

                // Formulas for Counts
                // I (Shift Pagi): COUNTIF(B:H, "P")
                row.getCell(9).value = { formula: `COUNTIF(B${rowNum}:H${rowNum}, "P")` };
                // J (Shift Sore): COUNTIF(B:H, "S")
                row.getCell(10).value = { formula: `COUNTIF(B${rowNum}:H${rowNum}, "S")` };
                // K (Shift Malam): COUNTIF(B:H, "M")
                row.getCell(11).value = { formula: `COUNTIF(B${rowNum}:H${rowNum}, "M")` };
                
                // L (Total Jam Kerja): (P+S+M) * 8
                row.getCell(12).value = { formula: `(I${rowNum}+J${rowNum}+K${rowNum})*8` };
                
                [9, 10, 11, 12].forEach(col => {
                    row.getCell(col).alignment = { horizontal: 'center' };
                });
            });

            // Recap Section
            const recapStartRow = 3 + employees.length + 1;
            sheet.mergeCells(`A${recapStartRow}:H${recapStartRow}`);
            const recapTitleCell = sheet.getCell(`A${recapStartRow}`);
            recapTitleCell.value = 'Jumlah Karyawan/Shift (hari)';
            recapTitleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF008080' } };
            recapTitleCell.font = { bold: true, color: { argb: 'FFFFFFFF' } };

            const shiftTypes = [
                { label: 'Shift Pagi', code: 'P' },
                { label: 'Shift Sore', code: 'S' },
                { label: 'Shift Malam', code: 'M' }
            ];

            shiftTypes.forEach((type, i) => {
                const rowNum = recapStartRow + 1 + i;
                const row = sheet.getRow(rowNum);
                row.getCell(1).value = type.label;
                row.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF008080' } };
                row.getCell(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

                for (let col = 2; col <= 8; col++) {
                    const colLetter = String.fromCharCode(64 + col);
                    row.getCell(col).value = { formula: `COUNTIF(${colLetter}3:${colLetter}${recapStartRow - 2}, "${type.code}")` };
                    row.getCell(col).alignment = { horizontal: 'center' };
                }
            });

            // Borders for the whole table
            sheet.eachRow((row, rowNumber) => {
                row.eachCell((cell) => {
                    cell.border = {
                        top: { style: 'thin' },
                        left: { style: 'thin' },
                        bottom: { style: 'thin' },
                        right: { style: 'thin' }
                    };
                });
            });

            // Adjust column widths
            sheet.getColumn(1).width = 15;
            for (let i = 2; i <= 8; i++) sheet.getColumn(i).width = 10;
            sheet.getColumn(9).width = 15;
            sheet.getColumn(10).width = 15;
            sheet.getColumn(11).width = 15;
            sheet.getColumn(12).width = 15;

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', 'attachment; filename=Template_Shift_Karyawan.xlsx');

            await workbook.xlsx.write(res);
            res.status(200).end();
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    static async getAllShifts(req: Request, res: Response) {
        try {
            const shifts = await ShiftService.getAllShifts();
            res.json(shifts);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    static async getMyShifts(req: Request, res: Response) {
        try {
            const userId = (req as any).user?.id;
            if (!userId) return res.status(401).json({ error: 'Unauthorized' });
            
            const shifts = await ShiftService.getShiftsByUser(userId);
            res.json(shifts);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    static async createShift(req: Request, res: Response) {
        try {
            const currentUserId = (req as any).user?.id;
            const { userId, date, startTime, endTime } = req.body;
            
            const newShift = await ShiftService.createShift(userId, new Date(date), startTime, endTime, currentUserId);
            res.status(201).json(newShift);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    static async updateShift(req: Request, res: Response) {
        try {
            const currentUserId = (req as any).user?.id;
            const id = req.params.id as string;
            const updatedShift = await ShiftService.updateShift(parseInt(id), req.body, currentUserId);
            res.json(updatedShift);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    static async deleteShift(req: Request, res: Response) {
        try {
            const currentUserId = (req as any).user?.id;
            const id = req.params.id as string;
            await ShiftService.deleteShift(parseInt(id), currentUserId);
            res.json({ success: true });
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }
}
