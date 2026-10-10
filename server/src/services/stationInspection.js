const { Op } = require('sequelize');
const { Station, CCTVPoint, MonitoringReport, MonitoringDetail } = require('../models');
const { canReadReport } = require('../policies/reportAccess');
const { getCalendar, currentInspectionPeriod, reportCalendarData, STATUS_FIELDS } = require('./reportCalendar');

function summarizeStations(stations, reports, calendar, user) {
  const byStation = new Map(reports.map((report) => [report.station_id, report]));
  return stations.map((station) => {
    const report = byStation.get(station.id);
    const activeGroups = station.cctvPoints.length;
    const reportWeeks = report ? reportCalendarData(report).weeks : [];
    // Existing reports retain their stored group membership when the master changes.
    const totalGroups = report?.details.length || activeGroups;
    const weeks = calendar.weeks.map((week) => {
      // A status from an older calendar must not be credited to a different date range.
      const reportWeek = reportWeeks.find((item) => item.start === week.start && item.end === week.end);
      const completedGroups = reportWeek?.completedGroups || 0;
      const complete = totalGroups > 0 && completedGroups === totalGroups;
      return {
        number: week.number,
        completedGroups,
        totalGroups,
        complete,
        overdue: week.state === 'past' && totalGroups > 0 && !complete,
        checkedAt: reportWeek?.checkedAt || null,
      };
    });
    const started = weeks.filter((_, index) => calendar.weeks[index].state !== 'future');
    return {
      id: station.id,
      nama_stasiun: station.nama_stasiun,
      kode_stasiun: station.kode_stasiun,
      totalGroups,
      hasReport: Boolean(report),
      legacySchedule: Boolean(report && report.calendar_scheme !== 'monday'),
      reportId: report && canReadReport(user, report) ? report.id : null,
      weeks,
      monthly: {
        complete: started.length > 0 && totalGroups > 0 && started.every((week) => week.complete),
        completedGroups: started.reduce((sum, week) => sum + week.completedGroups, 0),
        totalGroups: started.length * totalGroups,
        overdue: started.some((week) => week.overdue),
      },
    };
  });
}

async function getStationInspection(params, user, now = new Date()) {
  const currentPeriod = currentInspectionPeriod(now);
  const calendar = getCalendar(params.bulan ?? currentPeriod.bulan, params.tahun ?? currentPeriod.tahun, now);
  const stations = await Station.findAll({
    where: { is_active: true, wilayah: 'Daop 6 Yogyakarta' },
    attributes: ['id', 'nama_stasiun', 'kode_stasiun'],
    include: [{ model: CCTVPoint, as: 'cctvPoints', attributes: ['id'],
      where: { is_active: true }, required: false }],
    order: [['nama_stasiun', 'ASC']],
  });
  const reports = stations.length ? await MonitoringReport.findAll({
    where: { station_id: { [Op.in]: stations.map((station) => station.id) },
      bulan: calendar.bulan, tahun: calendar.tahun },
    attributes: ['id', 'station_id', 'created_by', 'bulan', 'tahun', 'calendar_scheme',
      ...Array.from({ length: 5 }, (_, i) => `checked_at_m${i + 1}`)],
    include: [{ model: MonitoringDetail, as: 'details', attributes: ['id', ...STATUS_FIELDS] }],
  }) : [];
  return { calendar, stations: summarizeStations(stations, reports, calendar, user),
    currentPeriod };
}

module.exports = { getStationInspection, summarizeStations };
