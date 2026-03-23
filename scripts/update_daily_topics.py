#!/usr/bin/env python3
import json
import re
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timedelta, timezone
from pathlib import Path

RSS_URL = "https://trends.google.com/trending/rss?geo=KR"
OUTPUT_PATH = Path("data/daily-topics.json")


def clean_text(value: str) -> str:
    return re.sub(r"\s+", " ", value or "").strip()


def fetch_trending_titles() -> list[str]:
    request = urllib.request.Request(
        RSS_URL,
        headers={"User-Agent": "Mozilla/5.0 (compatible; IDKWELLBot/1.0)"},
    )
    with urllib.request.urlopen(request, timeout=20) as response:
        xml_data = response.read()

    root = ET.fromstring(xml_data)
    titles = []
    for item in root.findall("./channel/item"):
        text = clean_text(item.findtext("title", default=""))
        if text:
            titles.append(text)

    return titles


def build_topics(titles: list[str]) -> list[dict]:
    topics = []
    seen = set()

    for title in titles:
        if title in seen:
            continue
        seen.add(title)

        topics.append(
            {
                "title": title,
                "summary": "오늘 급상승 검색어 기반 주제",
            }
        )

        if len(topics) == 5:
            break

    if len(topics) < 5:
        fallback = ["돈관리", "건강관리", "커리어", "디지털", "생활팁"]
        for title in fallback:
            if len(topics) == 5:
                break
            topics.append({"title": title, "summary": "핵심 생활 정보 주제"})

    return topics


def main() -> None:
    titles = fetch_trending_titles()
    topics = build_topics(titles)

    now_utc = datetime.now(timezone.utc)
    kst = timezone(timedelta(hours=9))
    now_kst = now_utc.astimezone(kst)

    payload = {
        "updated_at": now_utc.strftime("%Y-%m-%d %H:%M:%S"),
        "updated_at_kst": now_kst.strftime("%Y-%m-%d %H:%M:%S"),
        "source": RSS_URL,
        "topics": topics,
    }

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


if __name__ == "__main__":
    main()
