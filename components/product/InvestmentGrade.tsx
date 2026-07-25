import {
  calculateInvestmentGrade,
  type InvestmentGrade as InvestmentGradeValue,
} from "@/lib/analytics/investmentGrade";

type InvestmentGradeProps = {
  marketHealthScore: number;
  liquidityScore: number;
  supplyBalanceScore: number;
  priceStabilityScore: number;
  dealScore: number;
};

function getGradeClass(grade: InvestmentGradeValue) {
  if (grade.startsWith("A")) {
    return "investment-grade--excellent";
  }

  if (grade.startsWith("B")) {
    return "investment-grade--strong";
  }

  if (grade.startsWith("C")) {
    return "investment-grade--mixed";
  }

  return "investment-grade--weak";
}

function getRiskLabel(riskScore: number) {
  if (riskScore <= 20) return "Low";
  if (riskScore <= 40) return "Moderate";
  if (riskScore <= 65) return "Elevated";

  return "High";
}

function getComponentLabel(score: number) {
  if (score >= 85) return "Strong";
  if (score >= 70) return "Healthy";
  if (score >= 50) return "Moderate";

  return "Weak";
}

function getInvestmentSummary(
  grade: InvestmentGradeValue,
  marketQualityScore: number,
  opportunityScore: number,
  riskScore: number,
) {
  if (grade.startsWith("A")) {
    return "This product shows a strong combination of market quality, pricing support, and current opportunity.";
  }

  if (grade.startsWith("B")) {
    if (opportunityScore < 60) {
      return "The underlying market appears relatively strong, though the current listing opportunity is only moderately attractive.";
    }

    return "The product presents an above-average investment profile with generally supportive market conditions.";
  }

  if (grade.startsWith("C")) {
    if (marketQualityScore < 60) {
      return "The investment profile is mixed because the underlying market currently shows limited strength or reliability.";
    }

    if (riskScore >= 50) {
      return "The product has some positive investment qualities, but elevated market risk reduces overall conviction.";
    }

    return "The product shows a balanced mix of strengths and weaknesses and may require a more selective entry price.";
  }

  return "The current investment profile is weak due to limited market quality, elevated risk, or an unattractive entry price.";
}

export default function InvestmentGrade({
  marketHealthScore,
  liquidityScore,
  supplyBalanceScore,
  priceStabilityScore,
  dealScore,
}: InvestmentGradeProps) {
  const result = calculateInvestmentGrade({
    marketHealthScore,
    liquidityScore,
    supplyBalanceScore,
    priceStabilityScore,
    dealScore,
  });

  const gradeClass = getGradeClass(result.grade);

  const investmentSummary = getInvestmentSummary(
    result.grade,
    result.marketQualityScore,
    result.opportunityScore,
    result.riskScore,
  );

  return (
    <section className="investment-grade">
      <div className="investment-grade-heading">
        <div>
          <span className="section-kicker">TCGMVP Investment Analysis</span>

          <h2>Investment Grade</h2>

          <p>
            Evaluates current market quality, pricing opportunity, and risk
            to estimate the strength of the product&apos;s investment profile.
          </p>
        </div>

        <div className="investment-grade-result">
          <span>Investment Grade</span>

          <strong className={gradeClass}>{result.grade}</strong>

          <div className={`investment-grade-label ${gradeClass}`}>
            {result.label}
          </div>

          <small>{result.score} / 100 investment score</small>
        </div>
      </div>

      <div className="investment-grade-progress">
        <div
          className={`investment-grade-progress-fill ${gradeClass}`}
          style={{ width: `${result.score}%` }}
        />
      </div>

      <div className="investment-grade-summary">
        <span>Investment Assessment</span>

        <strong>{investmentSummary}</strong>
      </div>

      <div className="investment-grade-grid">
        <div className="investment-grade-card">
          <div className="investment-grade-card-heading">
            <div>
              <span>Market Quality</span>
              <strong>
                {getComponentLabel(result.marketQualityScore)}
              </strong>
            </div>

            <div className="investment-grade-card-score">
              {result.marketQualityScore}
              <small>/100</small>
            </div>
          </div>

          <div className="investment-grade-card-progress">
            <div
              style={{
                width: `${result.marketQualityScore}%`,
              }}
            />
          </div>

          <p>
            Reflects market health, liquidity, supply balance, and recent
            price stability.
          </p>
        </div>

        <div className="investment-grade-card">
          <div className="investment-grade-card-heading">
            <div>
              <span>Current Opportunity</span>
              <strong>
                {getComponentLabel(result.opportunityScore)}
              </strong>
            </div>

            <div className="investment-grade-card-score">
              {result.opportunityScore}
              <small>/100</small>
            </div>
          </div>

          <div className="investment-grade-card-progress">
            <div
              style={{
                width: `${result.opportunityScore}%`,
              }}
            />
          </div>

          <p>
            Uses the current Deal Score to measure price attractiveness
            relative to Fair Value.
          </p>
        </div>

        <div className="investment-grade-card">
          <div className="investment-grade-card-heading">
            <div>
              <span>Market Risk</span>
              <strong>{getRiskLabel(result.riskScore)}</strong>
            </div>

            <div className="investment-grade-card-score">
              {result.riskScore}
              <small>/100</small>
            </div>
          </div>

          <div className="investment-grade-card-progress investment-grade-risk-progress">
            <div
              style={{
                width: `${result.riskScore}%`,
              }}
            />
          </div>

          <p>
            Higher scores indicate greater risk from weak liquidity,
            unstable pricing, or poor supply balance.
          </p>
        </div>
      </div>

      <div className="investment-grade-methodology">
        <span>How this grade works</span>

        <p>
          Investment Grade combines Market Quality at 70% and Current
          Opportunity at 30%. The model intentionally favors the strength of
          the underlying market over a temporary discount.
        </p>
      </div>
    </section>
  );
}