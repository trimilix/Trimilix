import csv
from pathlib import Path

WEIGHTS = {
    "eu_etf_coverage": 0.25,
    "commercial_display_clarity": 0.25,
    "mvp_cost_accessibility": 0.20,
    "eu_realtime_upgrade_path": 0.20,
    "streaming_support": 0.10,
}

# Scores lopen van 1 (zwak/ongeschikt) tot 5 (sterk/duidelijk).
# Ze zijn gebaseerd op de officiële bronnen in docs/marktdata-aanbieders-bronnotities.md.
PROVIDERS = [
    {
        "provider": "Marketstack",
        "eu_etf_coverage": 3.5,
        "commercial_display_clarity": 3.5,
        "mvp_cost_accessibility": 5.0,
        "eu_realtime_upgrade_path": 1.5,
        "streaming_support": 1.0,
        "role": "Goedkoopste kandidaat voor commerciële EOD-MVP, na schriftelijke bevestiging",
    },
    {
        "provider": "EODHD",
        "eu_etf_coverage": 5.0,
        "commercial_display_clarity": 2.5,
        "mvp_cost_accessibility": 3.0,
        "eu_realtime_upgrade_path": 2.0,
        "streaming_support": 3.0,
        "role": "Sterk voor Europese EOD/vertraagde data; commerciële offerte vereist",
    },
    {
        "provider": "Twelve Data",
        "eu_etf_coverage": 5.0,
        "commercial_display_clarity": 4.0,
        "mvp_cost_accessibility": 1.5,
        "eu_realtime_upgrade_path": 5.0,
        "streaming_support": 5.0,
        "role": "Duidelijkste premiumroute naar real-time EU-koersen",
    },
    {
        "provider": "Finnhub",
        "eu_etf_coverage": 4.0,
        "commercial_display_clarity": 1.5,
        "mvp_cost_accessibility": 1.0,
        "eu_realtime_upgrade_path": 4.0,
        "streaming_support": 5.0,
        "role": "Technisch sterk, maar duur en commercieel maatwerk",
    },
    {
        "provider": "Financial Modeling Prep",
        "eu_etf_coverage": 3.0,
        "commercial_display_clarity": 1.5,
        "mvp_cost_accessibility": 2.5,
        "eu_realtime_upgrade_path": 2.0,
        "streaming_support": 1.0,
        "role": "Bruikbaar voor analyse/fundamentals; displaylicentie en EU-realtime onduidelijk",
    },
    {
        "provider": "Tiingo",
        "eu_etf_coverage": 2.5,
        "commercial_display_clarity": 2.0,
        "mvp_cost_accessibility": 2.0,
        "eu_realtime_upgrade_path": 2.0,
        "streaming_support": 4.0,
        "role": "Interne licenties duidelijker dan klantweergave; EU-fit onvoldoende bevestigd",
    },
    {
        "provider": "Alpaca Market Data",
        "eu_etf_coverage": 1.5,
        "commercial_display_clarity": 1.0,
        "mvp_cost_accessibility": 2.0,
        "eu_realtime_upgrade_path": 2.0,
        "streaming_support": 5.0,
        "role": "Niet geschikt voor gewone redistributie in een klantapp",
    },
    {
        "provider": "Massive",
        "eu_etf_coverage": 1.0,
        "commercial_display_clarity": 2.0,
        "mvp_cost_accessibility": 2.0,
        "eu_realtime_upgrade_path": 1.0,
        "streaming_support": 5.0,
        "role": "Valt af wegens uitsluitend Amerikaanse marktdekking",
    },
]


def weighted_score(provider: dict) -> float:
    return round(
        sum(provider[criterion] * weight for criterion, weight in WEIGHTS.items()),
        2,
    )


def main() -> None:
    output_path = Path(__file__).resolve().parents[1] / "docs" / "marktdata-provider-scores.csv"
    rows = []
    for provider in PROVIDERS:
        row = dict(provider)
        row["weighted_score_out_of_5"] = weighted_score(provider)
        rows.append(row)

    rows.sort(key=lambda item: item["weighted_score_out_of_5"], reverse=True)

    fieldnames = [
        "provider",
        "weighted_score_out_of_5",
        *WEIGHTS.keys(),
        "role",
    ]
    with output_path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    for row in rows:
        print(f"{row['provider']}: {row['weighted_score_out_of_5']:.2f}/5")


if __name__ == "__main__":
    main()
