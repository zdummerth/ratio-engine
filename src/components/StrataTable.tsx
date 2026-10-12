import { formatCod, formatCount, formatRatio } from '@/lib/format';
import type { Measure } from '@/lib/study/compliance';
import type { StratumResult } from '@/lib/study/runStudy';

const STATUS_LABELS: Record<string, string> = {
  PASS: 'Pass',
  FAIL: 'Fail',
  INSUFFICIENT_SAMPLE: 'Too few sales',
};

function failed(stratum: StratumResult, measure: Measure): boolean {
  return stratum.compliance.checks.some((c) => c.measure === measure && !c.passed);
}

function Row({ stratum, overall }: { stratum: StratumResult; overall?: boolean }) {
  const stats = stratum.statistics;
  const cell = (measure: Measure, text: string) => (
    <td className={failed(stratum, measure) ? 'num out-of-range' : 'num'}>{text}</td>
  );
  return (
    <tr className={overall ? 'overall-row' : undefined}>
      <th scope="row">
        <span className="stratum-label">{stratum.label}</span>
        {!overall && <span className="stratum-key">{stratum.key}</span>}
      </th>
      <td className="num">{formatCount(stratum.salesCount)}</td>
      <td className="num">{stratum.trimming.applied ? formatCount(stratum.trimming.excludedCount) : '—'}</td>
      {cell('level', formatRatio(stats?.median ?? null))}
      <td className="num">{formatRatio(stats?.mean ?? null)}</td>
      <td className="num">{formatRatio(stats?.weightedMean ?? null)}</td>
      {cell('cod', formatCod(stats?.cod ?? null))}
      {cell('prd', formatRatio(stats?.prd ?? null))}
      {cell('prb', formatRatio(stats?.prb ?? null))}
      <td>
        <span className={`status status-${stratum.compliance.status.toLowerCase()}`}>
          {STATUS_LABELS[stratum.compliance.status] ?? stratum.compliance.status}
        </span>
      </td>
    </tr>
  );
}

export function StrataTable({ overall, strata }: { overall: StratumResult; strata: StratumResult[] }) {
  return (
    <div className="table-wrap">
      <table className="strata-table">
        <thead>
          <tr>
            <th scope="col">Stratum</th>
            <th scope="col" className="num">Sales</th>
            <th scope="col" className="num">Trimmed</th>
            <th scope="col" className="num">Median</th>
            <th scope="col" className="num">Mean</th>
            <th scope="col" className="num">Wtd mean</th>
            <th scope="col" className="num">COD</th>
            <th scope="col" className="num">PRD</th>
            <th scope="col" className="num">PRB</th>
            <th scope="col">Status</th>
          </tr>
        </thead>
        <tbody>
          <Row stratum={overall} overall />
          {strata.map((stratum) => (
            <Row key={stratum.key} stratum={stratum} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
