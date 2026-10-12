# Ratio Study Methodology

This document specifies how the toolkit selects sales, computes sales ratio
statistics, and evaluates them against performance standards. It is the
reference for the implementation in `src/lib/`; when the code and this
document disagree, this document is correct.

The approach follows common mass appraisal practice for sales ratio studies.
The specific thresholds below are the ones this toolkit has adopted.

## 1. Sample selection

A study is defined by a **tax year**, a **study period** (`periodStart` and
`periodEnd`), and the property classes it covers.

- **Qualified sales only.** Only sales with validity code `Q` (qualified,
  arm's-length) are used. All other validity codes are excluded.
- **Study period.** `periodStart` and `periodEnd` are calendar dates written as
  `YYYY-MM-DD`. Both dates are **inclusive**.
- **Sale date.** Sales are stored with the recorder's timestamp in
  `recorded_at` (for example `2025-12-31T16:45:00`). A sale's date is the
  calendar date portion of that timestamp. A sale recorded at
  `2025-12-31T16:45:00` falls inside a study period ending `2025-12-31`.
- **Assessed value.** Each sale is paired with its parcel's assessed value for
  the study's tax year. Sales whose parcel has no assessment for that tax year
  are excluded.

## 2. Sales ratios

For each sale:

```
ratio = assessed value / sale price
```

Ratios are kept at full precision for every calculation in this document. The
user interface displays individual ratios to two decimal places; that is
display formatting only and must never feed back into the statistics.

## 3. Strata

A study reports an **overall stratum** plus one stratum per group.

- Neighborhood studies cover a single property class and group sales by
  neighborhood.
- A stratum is created only for a group that has at least one qualified sale in
  the sample.
- Neighborhood strata are ordered by neighborhood code, ascending.
- The overall stratum is computed from the full sample as a sample in its own
  right. It is **not** an aggregate of the other strata's results.

## 4. Outlier trimming

Outliers are removed with the interquartile range (IQR) method before any
statistic is computed.

1. Sort the stratum's ratios ascending: `x[0] ... x[n-1]`.
2. Compute the first and third quartiles with linear interpolation between
   closest ranks. For a proportion `p`, let `h = (n - 1) * p`; the quantile is
   `x[floor(h)] + (h - floor(h)) * (x[ceil(h)] - x[floor(h)])`.
   This is the same method as Excel's `QUARTILE.INC`.
3. `IQR = Q3 - Q1`. The fences are `Q1 - 1.5 * IQR` and `Q3 + 1.5 * IQR`.
4. A sale is excluded when its ratio is strictly below the lower fence or
   strictly above the upper fence. Ratios exactly equal to a fence are kept.

Rules:

- **Trimming is performed independently within each stratum**, using only that
  stratum's ratios. The overall stratum is trimmed as its own sample. A sale
  that is trimmed from the overall stratum may remain in its neighborhood
  stratum, and the reverse.
- Trimming is **not applied** to a stratum with fewer than **10** qualified
  sales; every sale in such a stratum is kept.

## 5. Statistics

All statistics are computed on the sales that remain after trimming. Let `n` be
the number of remaining sales, with ratios `r[i]`, assessed values `A[i]`, and
sale prices `S[i]`.

| Statistic | Definition |
| --- | --- |
| Median | The middle ratio. When `n` is even, the average of the two middle ratios. |
| Mean | `sum(r) / n` |
| Weighted mean | `sum(A) / sum(S)` |
| COD | `100 * (sum(abs(r[i] - median)) / n) / median` |
| PRD | `mean / weighted mean` |
| PRB | See below. |

**PRB (price-related bias).** For each sale compute

```
pct[i]   = (r[i] - median) / median
value[i] = 0.5 * S[i] + 0.5 * (A[i] / median)
x[i]     = ln(value[i]) / ln(2)
```

PRB is the slope of the ordinary least squares regression of `pct` on `x`.
PRB is not computed (reported as `null`) when fewer than 2 sales remain or when
every `x[i]` is the same.

## 6. Rounding

- Median, mean, weighted mean, PRD, and PRB are reported to **4** decimal
  places. COD is reported to **2** decimal places.
- Values are rounded half away from zero.
- Rounding is applied **once**, to the final reported statistics. Intermediate
  values, including individual ratios, are never rounded.
- Performance standards are evaluated against the reported (rounded) values.

## 7. Performance standards

| Property class | Code | Level (median) | COD (max) | PRD | PRB |
| --- | --- | --- | --- | --- | --- |
| Residential | `RES` | 0.90 to 1.10 | 15.0 | 0.98 to 1.03 | -0.05 to 0.05 |
| Condominium | `CON` | 0.90 to 1.10 | 15.0 | 0.98 to 1.03 | -0.05 to 0.05 |
| Commercial | `COM` | 0.90 to 1.10 | 20.0 | 0.98 to 1.03 | -0.05 to 0.05 |
| Vacant land | `VAC` | 0.90 to 1.10 | 25.0 | 0.98 to 1.03 | -0.05 to 0.05 |

All bounds are inclusive.

Each stratum receives a compliance status:

- `INSUFFICIENT_SAMPLE`: fewer than **5** sales remain after trimming. No
  checks are run.
- `PASS`: every check passes.
- `FAIL`: at least one check fails.

The PRB check is skipped when PRB is not computed.

Standards are specific to a property class. A stratum whose sales span more
than one property class is never evaluated against a standard: its status is
`NOT_EVALUATED` and it has no checks, regardless of its sample size.
