def compute_ratios(data: dict) -> dict:
    """
    Compute financial ratios from raw extracted financial data.
    These ratio names match the model's training features exactly.
    """
    def safe_div(a, b):
        try:
            return float(a) / float(b) if float(b) != 0 else 0.0
        except (TypeError, ValueError):
            return 0.0

    ta   = data.get("total_assets")        or 1
    tl   = data.get("total_liabilities")   or 0
    ca   = data.get("current_assets")      or 0
    cl   = data.get("current_liabilities") or 1
    eq   = data.get("equity")              or 1
    re_  = data.get("retained_earnings")   or 0
    rev  = data.get("revenue") or data.get("sales") or 1
    np_  = data.get("net_profit")          or 0
    op   = data.get("operating_profit")    or 0
    ebit = data.get("ebit")                or op
    gp   = data.get("gross_profit")        or 0
    dep  = data.get("depreciation")        or 0
    cf   = data.get("operating_cash_flow") or 0

    return {
        "net_profit_over_total_assets":                       safe_div(np_, ta),
        "total_liabilities_over_total_assets":                safe_div(tl, ta),
        "working_capital_over_total_assets":                  safe_div(ca - cl, ta),
        "current_assets_over_short_term_liabilities":         safe_div(ca, cl),
        "retained_earnings_over_total_assets":                safe_div(re_, ta),
        "EBIT_over_total_assets":                             safe_div(ebit, ta),
        "book_value_of_equity_over_total_liabilities":        safe_div(eq, tl),
        "sales_over_total_assets":                            safe_div(rev, ta),
        "equity_over_total_assets":                           safe_div(eq, ta),
        "gross_profit_over_sales":                            safe_div(gp, rev),
        "net_profit_over_sales":                              safe_div(np_, rev),
        "profit_on_operating_activities_over_total_assets":   safe_div(op, ta),
    }


def generate_risk_flags(ratios: dict) -> list:
    """
    Return human-readable flags based on ratio thresholds.
    These are shown to the user alongside the risk score.
    """
    flags = []

    if ratios.get("total_liabilities_over_total_assets", 0) > 0.7:
        flags.append("High debt ratio — liabilities exceed 70% of assets")

    if ratios.get("net_profit_over_sales", 0) < 0:
        flags.append("Negative net profit margin — company is loss-making")
    elif ratios.get("net_profit_over_sales", 0) < 0.05:
        flags.append("Very low profit margin — possible income underreporting")

    if ratios.get("current_assets_over_short_term_liabilities", 1) < 1.0:
        flags.append("Current ratio below 1 — liquidity risk")

    if ratios.get("profit_on_operating_activities_over_total_assets", 0) < 0.02:
        flags.append("Low operating efficiency")

    if ratios.get("working_capital_over_total_assets", 0) < 0:
        flags.append("Negative working capital")

    return flags