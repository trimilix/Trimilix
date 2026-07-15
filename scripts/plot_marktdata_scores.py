import csv
from pathlib import Path

import matplotlib.pyplot as plt

PROJECT_ROOT = Path(__file__).resolve().parents[1]
CSV_PATH = PROJECT_ROOT / "docs" / "marktdata-provider-scores.csv"
OUTPUT_DIR = Path("/home/ubuntu/webdev-static-assets")
OUTPUT_PATH = OUTPUT_DIR / "marktdata-provider-scores.png"


def main() -> None:
    with CSV_PATH.open(encoding="utf-8") as handle:
        rows = list(csv.DictReader(handle))

    rows.reverse()
    providers = [row["provider"] for row in rows]
    scores = [float(row["weighted_score_out_of_5"]) for row in rows]

    plt.style.use("seaborn-v0_8-whitegrid")
    fig, ax = plt.subplots(figsize=(11, 6.5))
    colors = ["#94A3B8"] * len(providers)
    for index, provider in enumerate(providers):
        if provider == "Twelve Data":
            colors[index] = "#0F766E"
        elif provider in {"EODHD", "Marketstack"}:
            colors[index] = "#14B8A6"

    bars = ax.barh(providers, scores, color=colors, height=0.62)
    ax.set_xlim(0, 5)
    ax.set_xlabel("Gewogen geschiktheidsscore (op 5)", fontsize=11)
    ax.set_title(
        "Marktdata-aanbieders voor een Europese ETF-app",
        fontsize=16,
        fontweight="bold",
        loc="left",
        pad=18,
    )
    ax.text(
        0,
        1.01,
        "Nadruk op EU ETF-dekking, commerciële klantweergave, MVP-kost, real-time groeipad en streaming",
        transform=ax.transAxes,
        fontsize=10,
        color="#475569",
        va="bottom",
    )
    ax.spines[["top", "right", "left"]].set_visible(False)
    ax.tick_params(axis="y", length=0)
    ax.grid(axis="y", visible=False)
    ax.grid(axis="x", color="#E2E8F0")

    for bar, score in zip(bars, scores):
        ax.text(
            score + 0.06,
            bar.get_y() + bar.get_height() / 2,
            f"{score:.2f}",
            va="center",
            fontsize=10,
            color="#0F172A",
            fontweight="bold",
        )

    fig.text(
        0.01,
        0.01,
        "Bron: gewogen analyse van officiële aanbiedersdocumentatie, geraadpleegd op 16 juli 2026. Scores zijn beslissingsondersteunend, geen garantie van licentierechten.",
        fontsize=8.5,
        color="#64748B",
    )
    fig.tight_layout(rect=(0, 0.04, 1, 1))
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    fig.savefig(OUTPUT_PATH, dpi=180, bbox_inches="tight")
    print(OUTPUT_PATH)


if __name__ == "__main__":
    main()
