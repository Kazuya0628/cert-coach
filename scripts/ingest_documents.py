"""
Microsoft Learn 学習ガイドを Azure AI Search にインデックスするスクリプト
実行: python scripts/ingest_documents.py
"""
import os
import re
import time
import hashlib
import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from azure.search.documents import SearchClient
from azure.core.credentials import AzureKeyCredential

load_dotenv(".env.local")

ENDPOINT = os.environ["AZURE_SEARCH_ENDPOINT"]
KEY = os.environ["AZURE_SEARCH_KEY"]
INDEX_NAME = os.environ.get("AZURE_SEARCH_INDEX_NAME", "exam-knowledge")

# Microsoft Learn 公式学習ガイド（公開ページ）
STUDY_GUIDES = {
    "az-900": "https://learn.microsoft.com/ja-jp/credentials/certifications/resources/study-guides/az-900",
    "ai-900": "https://learn.microsoft.com/ja-jp/credentials/certifications/resources/study-guides/ai-900",
    "sc-900": "https://learn.microsoft.com/ja-jp/credentials/certifications/resources/study-guides/sc-900",
    "dp-900": "https://learn.microsoft.com/ja-jp/credentials/certifications/resources/study-guides/dp-900",
}

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
}

CHUNK_SIZE = 500  # 文字数


def fetch_page(url: str) -> BeautifulSoup | None:
    try:
        res = requests.get(url, headers=HEADERS, timeout=15)
        res.raise_for_status()
        return BeautifulSoup(res.text, "html.parser")
    except Exception as e:
        print(f"  ⚠️ フェッチ失敗: {url} - {e}")
        return None


def extract_sections(soup: BeautifulSoup, exam_id: str, source_url: str) -> list[dict]:
    """ページからセクション別にテキストを抽出してチャンク化"""
    documents = []
    chunk_index = 0

    # メインコンテンツエリアを取得
    main = soup.find("main") or soup.find("div", {"id": "main"}) or soup.body
    if not main:
        return []

    current_section = "概要"
    current_subsection = ""
    current_text = ""

    for elem in main.find_all(["h1", "h2", "h3", "h4", "p", "ul", "ol", "li"]):
        tag = elem.name

        if tag in ("h1", "h2"):
            # セクション変わり目でフラッシュ
            if current_text.strip():
                chunks = split_into_chunks(current_text.strip(), CHUNK_SIZE)
                for chunk in chunks:
                    doc = make_doc(
                        exam_id, current_section, current_subsection,
                        chunk, source_url, chunk_index
                    )
                    documents.append(doc)
                    chunk_index += 1
            current_section = elem.get_text(strip=True)
            current_subsection = ""
            current_text = ""

        elif tag in ("h3", "h4"):
            if current_text.strip():
                chunks = split_into_chunks(current_text.strip(), CHUNK_SIZE)
                for chunk in chunks:
                    doc = make_doc(
                        exam_id, current_section, current_subsection,
                        chunk, source_url, chunk_index
                    )
                    documents.append(doc)
                    chunk_index += 1
            current_subsection = elem.get_text(strip=True)
            current_text = ""

        elif tag in ("p", "li"):
            text = elem.get_text(strip=True)
            if text:
                current_text += text + "\n"

    # 最後のテキストをフラッシュ
    if current_text.strip():
        chunks = split_into_chunks(current_text.strip(), CHUNK_SIZE)
        for chunk in chunks:
            doc = make_doc(
                exam_id, current_section, current_subsection,
                chunk, source_url, chunk_index
            )
            documents.append(doc)
            chunk_index += 1

    return documents


def split_into_chunks(text: str, size: int) -> list[str]:
    """テキストを指定文字数でチャンク分割"""
    sentences = re.split(r"(?<=[。！？\n])", text)
    chunks = []
    current = ""
    for s in sentences:
        if len(current) + len(s) > size and current:
            chunks.append(current.strip())
            current = s
        else:
            current += s
    if current.strip():
        chunks.append(current.strip())
    return chunks or [text]


def make_doc(exam_id, section, subsection, content, source_url, chunk_index) -> dict:
    raw_id = f"{exam_id}_{section}_{subsection}_{chunk_index}"
    doc_id = hashlib.md5(raw_id.encode()).hexdigest()
    return {
        "id": doc_id,
        "exam_id": exam_id,
        "section": section,
        "subsection": subsection,
        "content": content,
        "source_url": source_url,
        "chunk_index": chunk_index,
    }


def upload_documents(documents: list[dict]):
    client = SearchClient(ENDPOINT, INDEX_NAME, AzureKeyCredential(KEY))
    batch_size = 100
    for i in range(0, len(documents), batch_size):
        batch = documents[i : i + batch_size]
        result = client.upload_documents(batch)
        succeeded = sum(1 for r in result if r.succeeded)
        print(f"  📤 {i + len(batch)}/{len(documents)} 件アップロード（成功: {succeeded}件）")


def main():
    all_documents = []

    for exam_id, url in STUDY_GUIDES.items():
        print(f"\n📚 [{exam_id.upper()}] 取得中: {url}")
        soup = fetch_page(url)
        if not soup:
            continue

        docs = extract_sections(soup, exam_id, url)
        print(f"  → {len(docs)} チャンク抽出")
        all_documents.extend(docs)
        time.sleep(1)  # サーバー負荷軽減

    print(f"\n合計: {len(all_documents)} チャンク")

    if not all_documents:
        print("❌ ドキュメントが取得できませんでした")
        return

    print("\n📤 Azure AI Search にアップロード中...")
    upload_documents(all_documents)
    print("\n✅ 完了！")


if __name__ == "__main__":
    main()
