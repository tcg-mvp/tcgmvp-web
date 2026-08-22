import type {
  InvestmentGrade as InvestmentGradeValue,
  InvestmentGradeResult,
} from "@/lib/analytics/investmentGrade";


type InvestmentGradeProps = {
  result: InvestmentGradeResult;
};


function getGradeClass(
  grade: InvestmentGradeValue,
) {
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


function getComponentLabel(
  score: number,
) {
  if (score >= 85) {
    return "Strong";
  }

  if (score >= 70) {
    return "Healthy";
  }

  if (score >= 50) {
    return "Moderate";
  }

  return "Weak";
}


function getInvestmentSummary(
  grade: InvestmentGradeValue,
  marketQualityScore: number,
  opportunityScore: number,
) {
  if (grade.startsWith("A")) {
    return (
      "This product combines strong underlying market quality " +
      "with an attractive current valuation opportunity."
    );
  }


  if (grade.startsWith("B")) {
    if (opportunityScore < 60) {
      return (
        "The underlying market is relatively strong, though " +
        "the current valuation opportunity is only moderately attractive."
      );
    }

    return (
      "The product presents an above-average investment setup " +
      "with generally supportive market conditions."
    );
  }


  if (grade.startsWith("C")) {
    if (marketQualityScore < 60) {
      return (
        "The investment setup is mixed because the underlying " +
        "market currently shows limited structural strength."
      );
    }

    if (opportunityScore < 50) {
      return (
        "The market structure is reasonably supportive, but " +
        "the current entry price limits investment attractiveness."
      );
    }

    return (
      "The product presents a balanced investment setup with " +
      "a mix of supportive and limiting factors."
    );
  }


  return (
    "The current investment setup is weak due to limited market " +
    "quality, an unattractive valuation opportunity, or both."
  );
}


export default function InvestmentGrade({
  result,
}: InvestmentGradeProps) {
  const gradeClass =
    getGradeClass(
      result.grade,
    );


  const investmentSummary =
    getInvestmentSummary(
      result.grade,
      result.marketQualityScore,
      result.opportunityScore,
    );


  return (
    <section className="investment-grade">
      <div className="investment-grade-heading">
        <div>
          <span className="section-kicker">
            TCGMVP Investment Analysis
          </span>

          <h2>
            Investment Grade
          </h2>

          <p>
            Evaluates the quality of the underlying market
            and the attractiveness of the current valuation
            opportunity.
          </p>
        </div>


        <div className="investment-grade-result">
          <span>
            Investment Grade
          </span>

          <strong className={gradeClass}>
            {result.grade}
          </strong>

          <div
            className={`investment-grade-label ${gradeClass}`}
          >
            {result.label}
          </div>

          <small>
            {result.score} / 100 investment score
          </small>
        </div>
      </div>


      <div className="investment-grade-progress">
        <div
          className={`investment-grade-progress-fill ${gradeClass}`}
          style={{
            width:
              `${result.score}%`,
          }}
        />
      </div>


      <div className="investment-grade-summary">
        <span>
          Investment Assessment
        </span>

        <strong>
          {investmentSummary}
        </strong>
      </div>


      <div className="investment-grade-grid">
        <div className="investment-grade-card">
          <div className="investment-grade-card-heading">
            <div>
              <span>
                Market Quality
              </span>

              <strong>
                {getComponentLabel(
                  result.marketQualityScore,
                )}
              </strong>
            </div>

            <div className="investment-grade-card-score">
              {result.marketQualityScore}
              <small>
                /100
              </small>
            </div>
          </div>


          <div className="investment-grade-card-progress">
            <div
              style={{
                width:
                  `${result.marketQualityScore}%`,
              }}
            />
          </div>


          <p>
            Reflects overall Market Health, including
            transaction liquidity, supply balance, and
            realized-price stability.
          </p>
        </div>


        <div className="investment-grade-card">
          <div className="investment-grade-card-heading">
            <div>
              <span>
                Current Opportunity
              </span>

              <strong>
                {getComponentLabel(
                  result.opportunityScore,
                )}
              </strong>
            </div>

            <div className="investment-grade-card-score">
              {result.opportunityScore}
              <small>
                /100
              </small>
            </div>
          </div>


          <div className="investment-grade-card-progress">
            <div
              style={{
                width:
                  `${result.opportunityScore}%`,
              }}
            />
          </div>


          <p>
            Uses Deal Score to measure how attractive
            the current market price is relative to
            estimated Fair Value.
          </p>
        </div>
      </div>


      <div className="investment-grade-methodology">
        <span>
          How this grade works
        </span>

        <p>
          Investment Grade combines Market Quality at
          75% and Current Opportunity at 25%. The model
          intentionally favors the strength of the
          underlying market over a temporary valuation
          discount.
        </p>
      </div>
    </section>
  );
}