import { Injectable, NotFoundException, StreamableFile } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as ExcelJS from 'exceljs';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  // ──────────────────────────────────────────────
  //  DAILY SUMMARY (chức năng cũ, giữ nguyên)
  // ──────────────────────────────────────────────
  async getDeviceDailySummary(deviceId: string) {
    const device = await this.prisma.dEVICES.findUnique({
      where: { Device_ID: deviceId },
      include: { sensors: true, actuators: true },
    });

    if (!device) throw new NotFoundException('Khong tim thay thiet bi');

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const tempSensor = device.sensors.find((s) => s.type === 'temperature');
    let tempStats = { avg: 0, max: 0, min: 0 };

    if (tempSensor) {
      const agg = await this.prisma.sENSOR_READINGS.aggregate({
        _avg: { value: true }, _max: { value: true }, _min: { value: true },
        where: { Sensor_ID: tempSensor.Sensor_ID, recorded_at: { gte: startOfDay, lte: endOfDay } },
      });
      tempStats = {
        avg: agg._avg.value ? parseFloat(agg._avg.value.toFixed(1)) : 0,
        max: agg._max.value || 0,
        min: agg._min.value || 0,
      };
    }

    const warningCount = await this.prisma.aCTIVITY_LOGS.count({
      where: { Device_ID: deviceId, event_type: 'WARNING', occurred_at: { gte: startOfDay, lte: endOfDay } },
    });

    const pump = device.actuators.find((a) => a.type === 'pump');
    let pumpCount = 0;
    if (pump) {
      pumpCount = await this.prisma.aCTUATOR_LOGS.count({
        where: { Actuator_ID: pump.Actuator_ID, action: 'ON', occurred_at: { gte: startOfDay, lte: endOfDay } },
      });
    }

    return {
      date: startOfDay.toISOString().split('T')[0],
      temperature: tempStats,
      warnings_today: warningCount,
      pump_activations_today: pumpCount,
    };
  }

  // ──────────────────────────────────────────────
  //  HELPER: Aggregate data by date range
  // ──────────────────────────────────────────────
  private async getReportData(deviceId: string, startDate: Date, endDate: Date) {
    const device = await this.prisma.dEVICES.findUnique({
      where: { Device_ID: deviceId },
      include: { sensors: true, actuators: true },
    });

    if (!device) throw new NotFoundException('Khong tim thay thiet bi');

    const tempSensor  = device.sensors.find((s) => s.type === 'temperature');
    const humiSensor  = device.sensors.find((s) => s.type === 'humidity');
    const soilSensor  = device.sensors.find((s) => s.type === 'soil_moisture' || s.type === 'soil');
    const lightSensor = device.sensors.find((s) => s.type === 'light' || s.type === 'lux');
    const pump        = device.actuators.find((a) => a.type === 'pump');

    const dailyStats: Array<{
      date: string;
      temp_avg: number | null;
      temp_max: number | null;
      temp_min: number | null;
      humi_avg: number | null;
      soil_avg: number | null;
      light_avg: number | null;
      pump_on_count: number;
    }> = [];

    const cursor = new Date(startDate);
    cursor.setHours(0, 0, 0, 0);

    while (cursor <= endDate) {
      const dayStart = new Date(cursor);
      const dayEnd   = new Date(cursor);
      dayEnd.setHours(23, 59, 59, 999);

      const [tempAgg, humiAgg, soilAgg, lightAgg, pumpCount] = await Promise.all([
        tempSensor
          ? this.prisma.sENSOR_READINGS.aggregate({
              _avg: { value: true }, _max: { value: true }, _min: { value: true },
              where: { Sensor_ID: tempSensor.Sensor_ID, recorded_at: { gte: dayStart, lte: dayEnd } },
            })
          : null,
        humiSensor
          ? this.prisma.sENSOR_READINGS.aggregate({
              _avg: { value: true },
              where: { Sensor_ID: humiSensor.Sensor_ID, recorded_at: { gte: dayStart, lte: dayEnd } },
            })
          : null,
        soilSensor
          ? this.prisma.sENSOR_READINGS.aggregate({
              _avg: { value: true },
              where: { Sensor_ID: soilSensor.Sensor_ID, recorded_at: { gte: dayStart, lte: dayEnd } },
            })
          : null,
        lightSensor
          ? this.prisma.sENSOR_READINGS.aggregate({
              _avg: { value: true },
              where: { Sensor_ID: lightSensor.Sensor_ID, recorded_at: { gte: dayStart, lte: dayEnd } },
            })
          : null,
        pump
          ? this.prisma.aCTUATOR_LOGS.count({
              where: { Actuator_ID: pump.Actuator_ID, action: 'ON', occurred_at: { gte: dayStart, lte: dayEnd } },
            })
          : 0,
      ]);

      const r1 = (v: number | null | undefined) => (v != null ? parseFloat(v.toFixed(1)) : null);
      const dd   = String(cursor.getDate()).padStart(2, '0');
      const mm   = String(cursor.getMonth() + 1).padStart(2, '0');

      dailyStats.push({
        date: `${dd}/${mm}/${cursor.getFullYear()}`,
        temp_avg:  r1(tempAgg?._avg.value),
        temp_max:  r1(tempAgg?._max.value),
        temp_min:  r1(tempAgg?._min.value),
        humi_avg:  r1(humiAgg?._avg.value),
        soil_avg:  r1(soilAgg?._avg.value),
        light_avg: r1(lightAgg?._avg.value),
        pump_on_count: pumpCount as number,
      });

      cursor.setDate(cursor.getDate() + 1);
    }

    const totalPumpActivations = dailyStats.reduce((s, d) => s + d.pump_on_count, 0);
    const estimatedWaterLiters = totalPumpActivations * 2 * 10;
    const estimatedKWh         = parseFloat(((totalPumpActivations * 2 * 60) / 3600 * 0.06).toFixed(3));

    const fmtD = (d: Date) =>
      `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;

    return {
      device,
      dailyStats,
      summary: {
        startDate: fmtD(startDate),
        endDate:   fmtD(endDate),
        totalPumpActivations,
        estimatedWaterLiters,
        estimatedKWh,
        estimatedElectricityCost: parseFloat((estimatedKWh * 3000).toFixed(0)),
      },
    };
  }

  // ──────────────────────────────────────────────
  //  EXPORT EXCEL
  // ──────────────────────────────────────────────
  async exportExcel(deviceId: string, startDate: Date, endDate: Date): Promise<StreamableFile> {
    const { device, dailyStats, summary } = await this.getReportData(deviceId, startDate, endDate);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Ecogreen System';
    workbook.created = new Date();

    const sheet1 = workbook.addWorksheet('Daily Data');

    const headerFill: ExcelJS.FillPattern  = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A7F4B' } };
    const headerFont: Partial<ExcelJS.Font> = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    const summaryFill: ExcelJS.FillPattern  = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F5E9' } };

    sheet1.mergeCells('A1:H1');
    const t1 = sheet1.getCell('A1');
    t1.value = `ECOGREEN REPORT - ${device.name}`;
    t1.font  = { bold: true, size: 16, color: { argb: 'FF1A7F4B' } };
    t1.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet1.getRow(1).height = 36;

    sheet1.mergeCells('A2:H2');
    const t2 = sheet1.getCell('A2');
    t2.value = `Period: ${summary.startDate} - ${summary.endDate}`;
    t2.font  = { italic: true, size: 11, color: { argb: 'FF555555' } };
    t2.alignment = { horizontal: 'center' };
    sheet1.getRow(2).height = 20;
    sheet1.addRow([]);

    const hr = sheet1.addRow([
      'Date', 'Temp Avg (C)', 'Temp Max (C)', 'Temp Min (C)',
      'Humi Avg (%)', 'Soil Avg (%)', 'Light Avg (lux)', 'Pump On (times)',
    ]);
    hr.eachCell((cell) => {
      cell.fill = headerFill; cell.font = headerFont;
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    });
    hr.height = 40;

    dailyStats.forEach((day, idx) => {
      const row = sheet1.addRow([
        day.date,
        day.temp_avg  ?? '-', day.temp_max  ?? '-', day.temp_min  ?? '-',
        day.humi_avg  ?? '-', day.soil_avg  ?? '-', day.light_avg ?? '-',
        day.pump_on_count,
      ]);
      const fc = idx % 2 === 0 ? 'FFF9FFF9' : 'FFFFFFFF';
      row.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fc } };
        cell.border = { top: { style: 'thin', color: { argb: 'FFD0E8D4' } }, left: { style: 'thin', color: { argb: 'FFD0E8D4' } }, bottom: { style: 'thin', color: { argb: 'FFD0E8D4' } }, right: { style: 'thin', color: { argb: 'FFD0E8D4' } } };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      });
    });

    sheet1.columns = [{ width: 14 }, { width: 16 }, { width: 16 }, { width: 16 }, { width: 16 }, { width: 16 }, { width: 18 }, { width: 16 }];

    const sheet2 = workbook.addWorksheet('Summary');
    const addRow = (label: string, value: string | number, unit = '') => {
      const row = sheet2.addRow([label, `${value} ${unit}`.trim()]);
      row.getCell(1).font = { bold: true, color: { argb: 'FF1A7F4B' } };
      row.getCell(1).fill = summaryFill;
      row.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };
      row.eachCell((cell) => {
        cell.border = { top: { style: 'thin', color: { argb: 'FFBBDEC4' } }, left: { style: 'thin', color: { argb: 'FFBBDEC4' } }, bottom: { style: 'thin', color: { argb: 'FFBBDEC4' } }, right: { style: 'thin', color: { argb: 'FFBBDEC4' } } };
        cell.alignment = { vertical: 'middle', horizontal: 'left' };
      });
      row.height = 26;
    };

    sheet2.mergeCells('A1:B1');
    const s2t = sheet2.getCell('A1');
    s2t.value = 'ACTIVITY SUMMARY';
    s2t.font  = { bold: true, size: 14, color: { argb: 'FF1A7F4B' } };
    s2t.alignment = { horizontal: 'center' };
    sheet2.getRow(1).height = 32;
    sheet2.addRow([]);

    addRow('Device Name',            device.name);
    addRow('MAC Address',            device.mac_address);
    addRow('Report Period',          `${summary.startDate} - ${summary.endDate}`);
    addRow('Total Pump Activations', summary.totalPumpActivations, 'times');
    addRow('Estimated Water Usage',  summary.estimatedWaterLiters, 'liters');
    addRow('Estimated Power Usage',  summary.estimatedKWh, 'kWh');
    addRow('Estimated Power Cost',   summary.estimatedElectricityCost, 'VND');

    sheet2.columns = [{ width: 28 }, { width: 32 }];

    const buffer = Buffer.from(await workbook.xlsx.writeBuffer());
    return new StreamableFile(buffer, {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      disposition: `attachment; filename="ecogreen-report-${deviceId}-${Date.now()}.xlsx"`,
    });
  }

  // ──────────────────────────────────────────────
  //  EXPORT PDF  — dùng pdf-lib (pure JS, no font issues)
  // ──────────────────────────────────────────────
  async exportPdf(deviceId: string, startDate: Date, endDate: Date): Promise<StreamableFile> {
    const { device, dailyStats, summary } = await this.getReportData(deviceId, startDate, endDate);

    // Helper: bỏ dấu tiếng Việt để dùng font ASCII an toàn
    const removeDiacritics = (str: string) => {
      return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');
    };

    const pdfDoc   = await PDFDocument.create();
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontReg  = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const GREEN      = rgb(0.102, 0.498, 0.294);  // #1A7F4B
    const LIGHT_GRN  = rgb(0.91, 0.973, 0.914);   // #E8F5E9
    const WHITE      = rgb(1, 1, 1);
    const DARK       = rgb(0.1, 0.1, 0.1);
    const GRAY       = rgb(0.4, 0.4, 0.4);
    const LIGHT_GRAY = rgb(0.667, 0.667, 0.667);
    const BORDER     = rgb(0.78, 0.9, 0.79);       // #C8E6C9
    const ROW_ALT    = rgb(0.945, 0.984, 0.957);   // #F1FBF4

    const marginX = 40;
    const pageW   = 595;  // A4 width in points
    const pageH   = 841;  // A4 height in points
    const bodyW   = pageW - marginX * 2;

    const now    = new Date();
    const nowStr = `${String(now.getDate()).padStart(2,'0')}/${String(now.getMonth()+1).padStart(2,'0')}/${now.getFullYear()} ${now.toTimeString().slice(0,8)}`;

    const drawText = (
      page: Awaited<ReturnType<typeof pdfDoc.addPage>>,
      text: string,
      x: number,
      y: number,
      { size = 11, font = fontReg, color = DARK, maxWidth, align = 'left' }: { size?: number; font?: typeof fontReg; color?: typeof DARK; maxWidth?: number; align?: 'left' | 'center' | 'right' } = {},
    ) => {
      let t = text;
      if (maxWidth && font.widthOfTextAtSize(t, size) > maxWidth) {
        while (t.length > 0 && font.widthOfTextAtSize(t + '...', size) > maxWidth) {
          t = t.slice(0, -1);
        }
        t = t + '...';
      }

      let drawX = x;
      if (align === 'center' && maxWidth) {
        const textWidth = font.widthOfTextAtSize(t, size);
        drawX = x + (maxWidth / 2) - (textWidth / 2);
      } else if (align === 'right' && maxWidth) {
        const textWidth = font.widthOfTextAtSize(t, size);
        drawX = x + maxWidth - textWidth;
      }

      page.drawText(t, { x: drawX, y: pageH - y, font, size, color });
    };

    const drawRect = (
      page: Awaited<ReturnType<typeof pdfDoc.addPage>>,
      x: number, y: number, w: number, h: number,
      fillColor: typeof DARK, border = false,
    ) => {
      page.drawRectangle({ x, y: pageH - y - h, width: w, height: h, color: fillColor, borderColor: border ? BORDER : undefined, borderWidth: border ? 0.5 : 0 });
    };

    // ── Page 1 ────────────────────────────────────
    let page = pdfDoc.addPage([pageW, pageH]);

    // Banner
    drawRect(page, 0, 0, pageW, 85, GREEN);
    drawText(page, 'ECOGREEN IoT', 0, 40, { size: 26, font: fontBold, color: WHITE, maxWidth: pageW, align: 'center' });
    drawText(page, 'Smart Garden Monitoring & Control System', 0, 64, { size: 12, color: WHITE, maxWidth: pageW, align: 'center' });

    // Title
    drawText(page, 'ACTIVITY REPORT', marginX, 115, { size: 16, font: fontBold, color: GREEN });
    drawText(page, `Device MAC: ${device.mac_address}`, marginX, 141, { size: 11, color: GRAY });
    drawText(page, `Period: ${summary.startDate} - ${summary.endDate}`, marginX, 157, { size: 11, color: GRAY });
    drawText(page, `Generated: ${nowStr}`, marginX, 173, { size: 11, color: GRAY });

    // Divider
    page.drawLine({ start: { x: marginX, y: pageH - 190 }, end: { x: marginX + bodyW, y: pageH - 190 }, thickness: 1.5, color: GREEN });

    // Summary section
    drawText(page, 'SUMMARY', marginX, 215, { size: 14, font: fontBold, color: GREEN });

    const summaryRows: [string, string][] = [
      ['Device Name',            removeDiacritics(device.name)],
      ['MAC Address',            device.mac_address],
      ['Report Period',          `${summary.startDate} - ${summary.endDate}`],
      ['Pump Activations',       `${summary.totalPumpActivations} times`],
      ['Est. Water Usage',       `${summary.estimatedWaterLiters} liters`],
      ['Est. Power Usage',       `${summary.estimatedKWh} kWh`],
      ['Est. Power Cost',        `${summary.estimatedElectricityCost.toLocaleString('en-US')} VND`],
    ];

    let curY = 225;
    const sumRowH = 24;
    const sumColW = bodyW / 2;

    summaryRows.forEach(([label, value], idx) => {
      const fill = idx % 2 === 0 ? LIGHT_GRN : WHITE;
      drawRect(page, marginX, curY, bodyW, sumRowH, fill);
      // Vertical centering: y + (rowH/2) + (fontSize/3) = y + 12 + 3.6 = y + 16
      drawText(page, label, marginX + 10, curY + 16, { size: 11, font: fontBold, color: GREEN });
      drawText(page, value, marginX + sumColW + 10, curY + 16, { size: 11, color: DARK, maxWidth: sumColW - 20 });
      curY += sumRowH;
    });

    // Divider
    curY += 15;
    page.drawLine({ start: { x: marginX, y: pageH - curY }, end: { x: marginX + bodyW, y: pageH - curY }, thickness: 0.8, color: GREEN });
    curY += 24;

    // Daily table header
    drawText(page, 'DAILY SENSOR DATA', marginX, curY, { size: 14, font: fontBold, color: GREEN });
    curY += 12;

    const cols      = ['Date', 'Temp Avg', 'Temp Max', 'Humi Avg', 'Soil Avg', 'Pump On'];
    // Phân bổ đều chiều rộng cho 6 cột (515 / 6 ~ 85.8)
    const colWidths = [85, 86, 86, 86, 86, 86]; 
    const tblRowH   = 24;

    const drawHeader = () => {
      drawRect(page, marginX, curY, bodyW, tblRowH, GREEN);
      let colX = marginX;
      cols.forEach((col, i) => {
        // Vẽ border dọc cho header
        if (i > 0) page.drawLine({ start: { x: colX, y: pageH - curY }, end: { x: colX, y: pageH - curY - tblRowH }, thickness: 0.5, color: WHITE });
        // Canh giữa y + 16
        drawText(page, col, colX, curY + 16, { size: 10, font: fontBold, color: WHITE, maxWidth: colWidths[i], align: 'center' });
        colX += colWidths[i];
      });
      curY += tblRowH;
    };

    drawHeader();

    // Table data rows
    for (const [idx, day] of dailyStats.entries()) {
      if (curY + tblRowH > pageH - 40) {
        // Footer for current page
        const pn = pdfDoc.getPageCount();
        drawText(page, `Page ${pn}  |  Auto-generated by Ecogreen System  |  ${nowStr}`, marginX, pageH - 18, { size: 9, color: LIGHT_GRAY, maxWidth: bodyW, align: 'center' });

        page  = pdfDoc.addPage([pageW, pageH]);
        curY  = 40;
        drawHeader();
      }

      const fill = idx % 2 === 0 ? ROW_ALT : WHITE;
      drawRect(page, marginX, curY, bodyW, tblRowH, fill, true);

      const values = [
        day.date,
        day.temp_avg  != null ? `${day.temp_avg}C`  : '-',
        day.temp_max  != null ? `${day.temp_max}C`  : '-',
        day.humi_avg  != null ? `${day.humi_avg}%`  : '-',
        day.soil_avg  != null ? `${day.soil_avg}%`  : '-',
        `${day.pump_on_count}x`,
      ];

      let colX = marginX;
      values.forEach((val, i) => {
        // Vẽ border dọc cho từng ô
        if (i > 0) page.drawLine({ start: { x: colX, y: pageH - curY }, end: { x: colX, y: pageH - curY - tblRowH }, thickness: 0.5, color: BORDER });
        // Canh giữa text (y + 16)
        drawText(page, val, colX, curY + 16, { size: 10, color: DARK, maxWidth: colWidths[i], align: 'center' });
        colX += colWidths[i];
      });

      curY += tblRowH;
    }

    // Update all page footers with total count
    const totalPages = pdfDoc.getPageCount();
    pdfDoc.getPages().forEach((p, i) => {
      const fText = `Page ${i + 1} of ${totalPages}  |  Auto-generated by Ecogreen System  |  ${nowStr}`;
      const tW = fontReg.widthOfTextAtSize(fText, 9);
      p.drawText(fText, {
        x: marginX + (bodyW / 2) - (tW / 2), y: 18, size: 9, font: fontReg, color: LIGHT_GRAY,
      });
    });

    const pdfBytes = await pdfDoc.save();
    return new StreamableFile(Buffer.from(pdfBytes), {
      type: 'application/pdf',
      disposition: `attachment; filename="ecogreen-report-${deviceId}-${Date.now()}.pdf"`,
    });
  }
}
